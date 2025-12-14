/* eslint-disable react-hooks/exhaustive-deps */
//bookAppointment.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, CheckCircle, ChevronLeft, ChevronRight, X, Monitor, Building2, AlertTriangle, Droplet, Wind, Activity, HeartPulse, CircleAlert, AlertCircle } from 'lucide-react';import "../styles/bookAppointment.css";
import { io } from "socket.io-client";

const BookAppointment = ({ clinicId, onClose, onBookingSuccess, initialDescription = '', autoFillDescription = false }) => {
  const [viewMode, setViewMode] = useState('today');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState([]);
  const [weeklySlots, setWeeklySlots] = useState({});
  const [monthlySlots, setMonthlySlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [appointmentType, setAppointmentType] = useState('');
  const [appointmentDescription, setAppointmentDescription] = useState(initialDescription);
  const socketRef = useRef(null);
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  // New states for consultation flow
  const [consultationType, setConsultationType] = useState(null); // 'online' or 'physical'
  const [showEmergencyCheck, setShowEmergencyCheck] = useState(false);
  const [bookingStep, setBookingStep] = useState(1); // 1: choose type, 2: emergency check, 3: slot selection, 4: details

  const appointmentTypes = [
    {
      value: 'Check-up',
      color: '#a8ceff',
      consultationTypes: ['physical', 'online'] // triage / assessment
    },
    {
      value: 'Follow-up',
      color: '#c6e5b1',
      consultationTypes: ['physical', 'online'] // monitoring / review
    },
    {
      value: 'Behavioral Consultation',
      color: '#d0bfff',
      consultationTypes: ['physical', 'online'] // talk-based
    },
    {
      value: 'Nutrition & Diet',
      color: '#b8f2e6',
      consultationTypes: ['physical', 'online'] // guidance
    },
    {
      value: 'Vaccination',
      color: '#91befe',
      consultationTypes: ['physical'] // injections
    },
    {
      value: 'Dental',
      color: '#ffd666',
      consultationTypes: ['physical', 'online'] // advice vs procedure
    },
    {
      value: 'Surgery',
      color: '#ffb088',
      consultationTypes: ['physical']
    },
    {
      value: 'Emergency',
      color: '#ff8b8b',
      consultationTypes: ['physical']
    }
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
      // ✅ ADD consultationType parameter
      const res = await fetch(`http://localhost:5000/api/clinic-slots/${clinicId}/date/${dateStr}/${consultationType}`);
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

      // ✅ ADD consultationType parameter
      const res = await fetch(
        `http://localhost:5000/api/clinic-slots/${clinicId}/range/${consultationType}?startDate=${startDate}&endDate=${endDate}`
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

      // ✅ ADD consultationType parameter
      const res = await fetch(
        `http://localhost:5000/api/clinic-slots/${clinicId}/range/${consultationType}?startDate=${startDate}&endDate=${endDate}`
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

  // Auto-fill description when provided
  useEffect(() => {
    if (autoFillDescription && initialDescription) {
      setAppointmentDescription(initialDescription);
    }
  }, [initialDescription, autoFillDescription]);

  // ✅ Initial data fetch
  useEffect(() => {
    // ✅ Only fetch if consultation type is selected
    if (clinicId && consultationType) {
      if (viewMode === 'today') {
        fetchDaySlots(currentDate);
      } else if (viewMode === 'weekly') {
        fetchWeeklySlots(currentDate);
      } else if (viewMode === 'monthly') {
        fetchMonthlySlots(currentDate);
      }
    }
  }, [clinicId, currentDate, viewMode, consultationType]); // ✅ ADD consultationType dependency

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
    // Inside the socket.on("slotUpdated") handler
    socket.on("slotUpdated", (data) => {
      console.log("📡 Slot update received:", data);

      if (data.clinic_id == clinicId && consultationType) { // ✅ ADD consultationType check
        console.log("🔄 Refreshing slots for clinic:", clinicId);
        
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

  useEffect(() => {
    const fetchUserPets = async () => {
      const userId = sessionStorage.getItem('userid');
      if (!userId) return;
  
      try {
        const res = await fetch(`http://localhost:5000/api/user-pets/${userId}`);
        const data = await res.json();
        setUserPets(data);
      } catch (error) {
        console.error('Error fetching user pets:', error);
      }
    };
  
    fetchUserPets();
  }, []);

  const handleSlotClick = (slot, date = null) => {
  if (slot.status === 'available') {
    setSelectedSlot(slot);
    setSelectedDate(date || currentDate);
    setBookingStep(4); // Jump to details step
    setShowConfirmModal(true);
  }
};

const handleConsultationTypeSelect = (type) => {
  setConsultationType(type);
  if (type === 'online') {
    setShowEmergencyCheck(true);
    setBookingStep(2);
  } else {
    setShowEmergencyCheck(false);
    setBookingStep(3);
  }
};

const handleEmergencyResponse = (isEmergency) => {
  if (isEmergency) {
    setConsultationType('physical');
    setShowEmergencyCheck(false);
    setBookingStep(3);
  } else {
    setShowEmergencyCheck(false);
    setBookingStep(3);
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
    
    if (!appointmentDescription.trim()) {
      alert('Please provide a description');
      return;
    }

    const userId = sessionStorage.getItem('userid');
    if (!selectedPet) {
      alert('Please select a pet');
      return;
    }
    
    const petOwnerName = `${sessionStorage.getItem('firstName')} - ${selectedPet.pet_name}`;
    const dateStr = formatDateForAPI(selectedDate);

    try {
      // Step 1: Get current slots - ✅ ADD consultationType
      const res = await fetch(`http://localhost:5000/api/clinic-slots/${clinicId}/date/${dateStr}/${consultationType}`);
      const data = await res.json();
      
      let currentSlots = data?.slots || [];

      // Step 2: Update slot status to pending
      const updatedSlots = currentSlots.map(slot => 
        slot.id === selectedSlot.id 
          ? { 
              ...slot, 
              status: 'pending', 
              patient: petOwnerName, 
              petId: selectedPet.pet_id,
              userId,
              appointmentType,
              description: appointmentDescription
            }
          : slot
      );

      // Step 3: Update slots in database - ✅ ADD consultationType
      const updateRes = await fetch(`http://localhost:5000/api/clinic-slots/${clinicId}/date/${dateStr}/${consultationType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: updatedSlots })
      });

      if (!updateRes.ok) {
        alert('Failed to book appointment');
        return;
      }

      // Step 4: Create appointment record
      const appointmentDateTime = `${dateStr} ${convertTo24Hour(selectedSlot.time)}`;
      
      const appointmentRes = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: clinicId,
          pet_id: selectedPet.pet_id,
          usr_id: userId,
          appt_type: appointmentType,
          consultation_type: consultationType,
          appt_description: appointmentDescription,
          appt_date: appointmentDateTime,
          slot_time: selectedSlot.time
        })
      });

      if (appointmentRes.ok) {
        setShowConfirmModal(false);
        setSelectedPet(null);
        
        onClose();
        
        if (onBookingSuccess) {
          onBookingSuccess({
            time: selectedSlot.time,
            date: selectedDate
          });
        }
        
        setSelectedSlot(null);
        setSelectedDate(null);
        setAppointmentType('');
        setAppointmentDescription('');
      } else {
        alert('Failed to create appointment record');
      }

    } catch (error) {
      console.error('Error booking slot:', error);
      alert('An error occurred while booking');
    }
  };
  
  // Helper function to convert 12-hour time to 24-hour format
  const convertTo24Hour = (time12h) => {
    const [time, period] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    hours = parseInt(hours);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${String(hours).padStart(2, '0')}:${minutes}:00`;
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

      {/* Back button for navigation */}
      {bookingStep > 1 && !showConfirmModal && (
        <button 
          className="book-back-btn"
          onClick={() => {
            if (bookingStep === 3) {
              if (consultationType === 'online') {
                setBookingStep(2);
                setShowEmergencyCheck(true);
              } else {
                setBookingStep(1);
              }
            } else if (bookingStep === 2) {
              setBookingStep(1);
              setShowEmergencyCheck(false);
            }
          }}
        >
          <ChevronLeft size={20} />
          Back
        </button>
      )}

      {/* Step 1: Consultation Type Selection */}
      {bookingStep === 1 && (
        <div className="book-consultation-type-container">
          <h3 className="book-consultation-title">How would you like to consult with a veterinarian?</h3>
          <div className="book-consultation-options">
            <div 
              className={`book-consultation-card ${consultationType === 'online' ? 'selected' : ''}`}
              onClick={() => handleConsultationTypeSelect('online')}
            >
              <div className="book-consultation-icon">
                <Monitor size={64} />
              </div>
              <h4>Online Consultation</h4>
              <p>Connect with a vet remotely for non-urgent cases</p>
            </div>
            <div 
              className={`book-consultation-card ${consultationType === 'physical' ? 'selected' : ''}`}
              onClick={() => handleConsultationTypeSelect('physical')}
            >
              <div className="book-consultation-icon">
                <Building2 size={64} />
              </div>
              <h4>Physical Clinic Visit</h4>
              <p>Visit the clinic in person for examinations</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Emergency Check (Online Only) */}
      {bookingStep === 2 && showEmergencyCheck && (
        <div className="book-emergency-check">
          <div className="book-emergency-header">
            <AlertTriangle size={48} />
            <h3 className="book-emergency-title">Quick Safety Check</h3>
          </div>
          <p className="book-emergency-question">
            Is your pet experiencing any of the following?
          </p>
          <ul className="book-emergency-symptoms">
            <li>
              <Droplet size={20} />
              <span>Bleeding heavily</span>
            </li>
            <li>
              <Wind size={20} />
              <span>Choking or cannot breathe properly</span>
            </li>
            <li>
              <Activity size={20} />
              <span>Having seizures</span>
            </li>
            <li>
              <HeartPulse size={20} />
              <span>Cannot move or collapsed</span>
            </li>
            <li>
              <CircleAlert size={20} />
              <span>Severe vomiting or diarrhea</span>
            </li>
          </ul>
          <div className="book-emergency-actions">
            <button 
              className="book-emergency-btn yes"
              onClick={() => handleEmergencyResponse(true)}
            >
              <AlertCircle size={24} />
              Yes - Switch to Physical Visit
            </button>
            <button 
              className="book-emergency-btn no"
              onClick={() => handleEmergencyResponse(false)}
            >
              <CheckCircle size={24} />
              No - Continue Online Booking
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Slot Selection */}
      {bookingStep === 3 && (
        <>
          <div className="book-consultation-badge">
            {consultationType === 'online' ? (
              <>
                <Monitor size={20} />
                <span>Online Consultation</span>
              </>
            ) : (
              <>
                <Building2 size={20} />
                <span>Physical Clinic Visit</span>
              </>
            )}
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
        </>
      )}

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

              <div className="book-modal-consultation-badge">
                {consultationType === 'online' ? (
                  <>
                    <Monitor size={24} />
                    <span>Online Consultation</span>
                  </>
                ) : (
                  <>
                    <Building2 size={24} />
                    <span>Physical Clinic Visit</span>
                  </>
                )}
              </div>

              <div className="book-pet-selection-section">
                <label className="book-pet-label">
                  Select Pet <span className="required">*</span>
                </label>
                <div className="book-pet-dropdown">
                  <select 
                    className="book-pet-select"
                    value={selectedPet?.pet_id || ''}
                    onChange={(e) => {
                      const pet = userPets.find(p => p.pet_id === parseInt(e.target.value));
                      setSelectedPet(pet || null);
                    }}
                  >
                    <option value="" disabled>Choose a pet...</option>
                    {userPets.map((pet) => (
                      <option key={pet.pet_id} value={pet.pet_id}>
                        {pet.pet_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="book-appointment-type-section">
                <label className="book-type-label">
                  Appointment Type <span className="required">*</span>
                </label>
                <div className="book-type-grid">
                {appointmentTypes
                  .filter(type => type.consultationTypes.includes(consultationType))
                  .map((type) => (
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
                  Description <span className="required">*</span>
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
                  setSelectedPet(null);
                  setBookingStep(3);
                }}
              >
                Cancel
              </button>
              <button 
                className="book-modal-confirm"
                onClick={handleBookSlot}
                disabled={!appointmentType || !selectedPet || !appointmentDescription.trim()}
              >
                <CheckCircle size={18} />
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default BookAppointment;