import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, CheckCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import "../styles/bookAppointment.css";
import { io } from "socket.io-client";

const BookAppointment = ({ clinicId, onClose }) => {
  const [viewMode, setViewMode] = useState('today');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState([]);
  const [weeklySlots, setWeeklySlots] = useState({});
  const [monthlySlots, setMonthlySlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [appointmentType, setAppointmentType] = useState('');
  const [appointmentDescription, setAppointmentDescription] = useState('');
  const socketRef = useRef(null);

  const appointmentTypes = [
    { value: 'Check-up', color: '#a8ceff' },
    { value: 'Vaccination', color: '#91befe' },
    { value: 'Dental', color: '#ffd666' },
    { value: 'Surgery', color: '#ffb088' },
    { value: 'Emergency', color: '#ff8b8b' }
  ];

  // ✅ FORMAT DATE HELPER (moved up to be used in socket handler)
  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ✅ Fetch functions
  const fetchDaySlots = async (date) => {
    setLoading(true);
    try {
      const dateStr = formatDateForAPI(date);
      const res = await fetch(`http://localhost:5000/api/clinic-slots/${clinicId}/date/${dateStr}`);
      const data = await res.json();
      
      if (data && data.slots) {
        setTimeSlots(data.slots);
      } else {
        setTimeSlots([]);
      }
    } catch (error) {
      console.error("Error fetching day slots:", error);
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklySlots = async (date) => {
    setLoading(true);
    try {
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startDate = formatDateForAPI(startOfWeek);
      const endDate = formatDateForAPI(endOfWeek);

      const res = await fetch(
        `http://localhost:5000/api/clinic-slots/${clinicId}/range?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await res.json();
      
      setWeeklySlots(data.slots || {});
    } catch (error) {
      console.error("Error fetching weekly slots:", error);
      setWeeklySlots({});
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlySlots = async (date) => {
    setLoading(true);
    try {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const startDate = formatDateForAPI(startOfMonth);
      const endDate = formatDateForAPI(endOfMonth);

      const res = await fetch(
        `http://localhost:5000/api/clinic-slots/${clinicId}/range?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await res.json();
      
      setMonthlySlots(data.slots || {});
    } catch (error) {
      console.error("Error fetching monthly slots:", error);
      setMonthlySlots({});
    } finally {
      setLoading(false);
    }
  };

  // ✅ Initial data fetch
  useEffect(() => {
    if (clinicId) {
      if (viewMode === 'today') {
        fetchDaySlots(currentDate);
      } else if (viewMode === 'weekly') {
        fetchWeeklySlots(currentDate);
      } else if (viewMode === 'monthly') {
        fetchMonthlySlots(currentDate);
      }
    }
  }, [clinicId, currentDate, viewMode]);

  // ✅ Socket.IO connection - Initialize ONCE and keep alive
  useEffect(() => {
    if (!clinicId) return;

    // Create socket connection
    socketRef.current = io("http://localhost:5000", {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("✅ Connected to Socket.IO:", socket.id);
    });

    socket.on("welcome", (data) => {
      console.log("📩 Welcome message:", data);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from Socket.IO:", reason);
    });

    // ✅ CRITICAL: Listen for slot updates
    socket.on("slotUpdated", (data) => {
      console.log("📡 Slot update received:", data);

      // Check if the update is for the current clinic
      if (data.clinic_id == clinicId) {
        console.log("🔄 Refreshing slots for clinic:", clinicId);
        
        // Refresh based on current view mode
        if (viewMode === "today") {
          fetchDaySlots(currentDate);
        } else if (viewMode === "weekly") {
          fetchWeeklySlots(currentDate);
        } else if (viewMode === "monthly") {
          fetchMonthlySlots(currentDate);
        }
      }
    });

    // ✅ Cleanup: Only disconnect when component unmounts
    return () => {
      console.log("🧹 Cleaning up socket connection");
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [clinicId]); // ✅ Only re-run if clinicId changes

  // ✅ Update socket listener when view changes (but don't recreate socket)
  useEffect(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    const handleSlotUpdate = (data) => {
      console.log("📡 View-specific slot update:", data);

      if (data.clinic_id == clinicId) {
        if (viewMode === "today") {
          fetchDaySlots(currentDate);
        } else if (viewMode === "weekly") {
          fetchWeeklySlots(currentDate);
        } else if (viewMode === "monthly") {
          fetchMonthlySlots(currentDate);
        }
      }
    };

    // Remove old listener and add new one
    socket.off("slotUpdated");
    socket.on("slotUpdated", handleSlotUpdate);

    return () => {
      socket.off("slotUpdated", handleSlotUpdate);
    };
  }, [clinicId, viewMode, currentDate]);

  const handleSlotClick = (slot, date = null) => {
    if (slot.status === 'available') {
      setSelectedSlot(slot);
      setSelectedDate(date || currentDate);
      setAppointmentType('');
      setAppointmentDescription('');
      setShowConfirmModal(true);
    }
  };

  const handleDayClick = async (date) => {
    setCurrentDate(date);
    setViewMode('today');
  };

  const handleBookSlot = async () => {
    if (!selectedSlot || !selectedDate) return;
    
    if (!appointmentType) {
      alert('Please select an appointment type');
      return;
    }
  
    const userId = sessionStorage.getItem('userid');
    const petOwnerName = sessionStorage.getItem('firstName') || 'Pet Owner';
    const dateStr = formatDateForAPI(selectedDate);

    try {
      const res = await fetch(`http://localhost:5000/api/clinic-slots/${clinicId}/date/${dateStr}`);
      const data = await res.json();
      
      let currentSlots = data?.slots || [];

      const updatedSlots = currentSlots.map(slot => 
        slot.id === selectedSlot.id 
          ? { 
              ...slot, 
              status: 'pending', 
              patient: petOwnerName, 
              userId,
              appointmentType,
              description: appointmentDescription
            }
          : slot
      );
  
      const updateRes = await fetch(`http://localhost:5000/api/clinic-slots/${clinicId}/date/${dateStr}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: updatedSlots })
      });
  
      if (updateRes.ok) {
        setShowConfirmModal(false);
        setBookingSuccess(true);
        
        // Note: No need to manually refresh - socket will handle it!
        
        setTimeout(() => {
          setBookingSuccess(false);
          setSelectedSlot(null);
          setSelectedDate(null);
          setAppointmentType('');
          setAppointmentDescription('');
        }, 3000);
      } else {
        alert('Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking slot:', error);
      alert('An error occurred while booking');
    }
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'weekly') {
      newDate.setDate(currentDate.getDate() + (direction * 7));
    } else if (viewMode === 'monthly') {
      newDate.setMonth(currentDate.getMonth() + direction);
    } else {
      newDate.setDate(currentDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const formatDate = (date) => {
    if (viewMode === 'today') {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } else if (viewMode === 'weekly') {
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const endDate = new Date(startOfWeek);
      endDate.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const renderWeeklyView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return (
      <div className="book-weekly-grid">
        {days.map((day, index) => {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + index);
          const dateStr = formatDateForAPI(date);
          const daySlots = weeklySlots[dateStr] || { available: 0, booked: 0, pending: 0, total: 0 };
          
          return (
            <div 
              key={day} 
              className="book-weekly-day-card"
              onClick={() => daySlots.total > 0 && handleDayClick(date)}
              style={{ cursor: daySlots.total > 0 ? 'pointer' : 'default' }}
            >
              <div className="book-weekly-day-header">
                <h4>{day}</h4>
                <span className="book-weekly-date">
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="book-weekly-day-stats">
                {daySlots.total === 0 ? (
                  <span className="book-no-slots">No slots</span>
                ) : (
                  <>
                    <div className="book-stat-badge available">
                      <span>{daySlots.available}</span>
                      <label>Available</label>
                    </div>
                    <div className="book-stat-badge booked">
                      <span>{daySlots.booked + daySlots.pending}</span>
                      <label>Booked</label>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthlyView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    for (let i = 0; i < startDate; i++) {
      days.push(<div key={`empty-${i}`} className="book-calendar-day empty"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDateForAPI(date);
      const daySlots = monthlySlots[dateStr] || { available: 0, booked: 0, pending: 0, total: 0 };
      const isToday = 
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear();
      
      days.push(
        <div 
          key={day} 
          className={`book-calendar-day ${isToday ? 'today' : ''} ${daySlots.total > 0 ? 'has-slots' : ''}`}
          onClick={() => daySlots.total > 0 && handleDayClick(date)}
        >
          <span className="book-calendar-day-number">{day}</span>
          {daySlots.total > 0 && (
            <div className="book-calendar-day-info">
              <div className="book-calendar-slots">
                <div className="book-calendar-slot available">
                  <span className="dot"></span>
                  <span className="count">{daySlots.available}</span>
                </div>
                <div className="book-calendar-slot booked">
                  <span className="dot"></span>
                  <span className="count">{daySlots.booked + daySlots.pending}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="book-calendar-container">
        <div className="book-calendar-header">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="book-calendar-weekday">{day}</div>
          ))}
        </div>
        <div className="book-calendar-grid">
          {days}
        </div>
        <div className="book-calendar-legend">
          <div className="book-legend-item">
            <span className="dot available"></span>
            <label>Available</label>
          </div>
          <div className="book-legend-item">
            <span className="dot booked"></span>
            <label>Booked</label>
          </div>
        </div>
      </div>
    );
  };

  const availableCount = timeSlots.filter(s => s.status === 'available').length;
  const takenCount = timeSlots.filter(s => s.status === 'taken' || s.status === 'booked').length;

  return (
    <div className="book-appointment-container">
      <div className="book-appointment-header">
        <div className="book-appointment-title">
          <Calendar size={28} />
          <h2>Book an Appointment</h2>
        </div>
        <button className="book-appointment-close" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <div className="book-view-selector">
        <button 
          className={`book-view-btn ${viewMode === 'today' ? 'active' : ''}`}
          onClick={() => setViewMode('today')}
        >
          Today
        </button>
        <button 
          className={`book-view-btn ${viewMode === 'weekly' ? 'active' : ''}`}
          onClick={() => setViewMode('weekly')}
        >
          This Week
        </button>
        <button 
          className={`book-view-btn ${viewMode === 'monthly' ? 'active' : ''}`}
          onClick={() => setViewMode('monthly')}
        >
          This Month
        </button>
      </div>

      <div className="book-date-nav">
        <button className="book-nav-btn" onClick={() => navigateDate(-1)}>
          <ChevronLeft size={20} />
        </button>
        <span className="book-current-date">{formatDate(currentDate)}</span>
        <button className="book-nav-btn" onClick={() => navigateDate(1)}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="book-content-area">
        {loading ? (
          <div className="book-loading">
            <div className="book-loading-spinner"></div>
            <p>Loading available slots...</p>
          </div>
        ) : (
          <>
            {viewMode === 'today' && (
              <>
                {timeSlots.length > 0 && (
                  <div className="book-stats">
                    <div className="book-stat-item available">
                      <span>Available</span>
                      <div>{availableCount}</div>
                    </div>
                    <div className="book-stat-item booked">
                      <span>Booked</span>
                      <div>{takenCount}</div>
                    </div>
                  </div>
                )}

                <div className="book-slots-container">
                  {timeSlots.length === 0 ? (
                    <div className="book-empty">
                      <Clock size={48} />
                      <p>No time slots available</p>
                      <span>Please check back later or contact the clinic directly</span>
                    </div>
                  ) : (
                    <div className="book-slots-grid">
                      {timeSlots.map(slot => (
                        <div 
                          key={slot.id}
                          className={`book-time-slot ${slot.status} ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                          onClick={() => handleSlotClick(slot)}
                        >
                          <div className="book-slot-header">
                            <span className="book-slot-time">{slot.time}</span>
                            <div className="book-slot-indicator"></div>
                          </div>
                          {slot.status === 'available' ? (
                            <div className="book-slot-available">Available</div>
                          ) : slot.status === 'pending' ? (
                            <div className="book-slot-pending">Pending</div>
                          ) : (
                            <div className="book-slot-booked">Booked</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {viewMode === 'weekly' && renderWeeklyView()}
            {viewMode === 'monthly' && renderMonthlyView()}
          </>
        )}
      </div>

      {showConfirmModal && selectedSlot && (
        <div className="book-modal-overlay">
          <div className="book-modal-content">
            <div className="book-modal-header">
              <Calendar size={32} />
              <h3>Book Appointment</h3>
            </div>
            <div className="book-modal-body">
              <p>Fill in the details for your appointment:</p>
              
              <div className="book-modal-time">
                <Clock size={24} />
                <span>{selectedSlot.time}</span>
              </div>
              
              <div className="book-modal-date">
                <Calendar size={24} />
                <span>{selectedDate?.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}</span>
              </div>

              <div className="book-appointment-type-section">
                <label className="book-type-label">
                  Appointment Type <span className="required">*</span>
                </label>
                <div className="book-type-grid">
                  {appointmentTypes.map((type) => (
                    <div
                      key={type.value}
                      className={`book-type-card ${appointmentType === type.value ? 'selected' : ''}`}
                      onClick={() => setAppointmentType(type.value)}
                      style={{
                        '--type-color': type.color
                      }}
                    >
                      <div className="book-type-indicator"></div>
                      <span>{type.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="book-description-section">
                <label className="book-description-label">
                  Description (Optional)
                </label>
                <textarea
                  className="book-description-input"
                  placeholder="Describe the reason for your visit or any specific concerns..."
                  value={appointmentDescription}
                  onChange={(e) => setAppointmentDescription(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <span className="book-description-count">
                  {appointmentDescription.length}/500
                </span>
              </div>
            </div>
            <div className="book-modal-actions">
              <button 
                className="book-modal-cancel"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedSlot(null);
                  setSelectedDate(null);
                  setAppointmentType('');
                  setAppointmentDescription('');
                }}
              >
                Cancel
              </button>
              <button 
                className="book-modal-confirm"
                onClick={handleBookSlot}
                disabled={!appointmentType}
              >
                <CheckCircle size={18} />
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {bookingSuccess && (
        <div className="book-success-toast pending">
          <Clock size={24} />
          <div>
            <strong>Awaiting Approval</strong>
            <p>Booking pending for {selectedSlot?.time}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;