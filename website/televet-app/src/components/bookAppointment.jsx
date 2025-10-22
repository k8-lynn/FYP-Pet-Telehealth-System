//bookAppointment.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import "../styles/bookAppointment.css";


const BookAppointment = ({ clinicId, onClose }) => {
  const [viewMode, setViewMode] = useState('today');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [appointmentType, setAppointmentType] = useState('');
  const [appointmentDescription, setAppointmentDescription] = useState('');

  const appointmentTypes = [
    { value: 'Check-up', color: '#a8ceff' },
    { value: 'Vaccination', color: '#91befe' },
    { value: 'Dental', color: '#ffd666' },
    { value: 'Surgery', color: '#ffb088' },
    { value: 'Emergency', color: '#ff8b8b' }
  ];

  useEffect(() => {
    if (clinicId) {
      fetchTimeSlots();
    }
  }, [clinicId, currentDate, viewMode]);

  const fetchTimeSlots = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/clinic-slots/${clinicId}`);
      const data = await res.json();
      
      if (data && data.slots) {
        setTimeSlots(data.slots);
      } else {
        setTimeSlots([]);
      }
    } catch (error) {
      console.error("Error fetching time slots:", error);
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (slot) => {
    if (slot.status === 'available') {
      setSelectedSlot(slot);
      setAppointmentType(''); // Reset
      setAppointmentDescription(''); // Reset
      setShowConfirmModal(true);
    }
  };

  const handleBookSlot = async () => {
    if (!selectedSlot) return;
    
    if (!appointmentType) {
      alert('Please select an appointment type');
      return;
    }
  
    const userId = sessionStorage.getItem('userid');
    const petOwnerName = sessionStorage.getItem('firstName') || 'Pet Owner';
  
    const updatedSlots = timeSlots.map(slot => 
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
  
    try {
      const res = await fetch(`http://localhost:5000/api/clinic-slots/${clinicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: updatedSlots })
      });
  
      if (res.ok) {
        setTimeSlots(updatedSlots);
        setShowConfirmModal(false);
        setBookingSuccess(true);
        
        setTimeout(() => {
          setBookingSuccess(false);
          setSelectedSlot(null);
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
      const endDate = new Date(date);
      endDate.setDate(date.getDate() + 6);
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const availableCount = timeSlots.filter(s => s.status === 'available').length;
  const takenCount = timeSlots.filter(s => s.status === 'taken').length;

  return (
    <div className="book-appointment-container">
      {/* Header */}
      <div className="book-appointment-header">
        <div className="book-appointment-title">
          <Calendar size={28} />
          <h2>Book an Appointment</h2>
        </div>
        <button className="book-appointment-close" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      {/* View Mode Selector */}
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

      {/* Date Navigation */}
      <div className="book-date-nav">
        <button className="book-nav-btn" onClick={() => navigateDate(-1)}>
          <ChevronLeft size={20} />
        </button>
        <span className="book-current-date">{formatDate(currentDate)}</span>
        <button className="book-nav-btn" onClick={() => navigateDate(1)}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Stats */}
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

      {/* Time Slots */}
      <div className="book-slots-container">
        {loading ? (
          <div className="book-loading">
            <div className="book-loading-spinner"></div>
            <p>Loading available slots...</p>
          </div>
        ) : timeSlots.length === 0 ? (
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

      {/* Confirmation Modal */}
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
            <span>{formatDate(currentDate)}</span>
            </div>

            {/* Appointment Type Selection */}
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

            {/* Description Field */}
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

      {/* Success Message */}
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