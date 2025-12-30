//petowner-dashboard.jsx
import React, { useState } from 'react';
import { Bell, ChevronLeft, ChevronRight, User, Plus } from 'lucide-react';
import './styles/petowner-dashboard.css';
import PawPattern from "./components/PawPattern";
import PetOwnerNavbar from './components/petowner-navbar';
import ProfileNotification from "./components/ProfileNotification";
import { useNavigate } from 'react-router-dom';
import BookAppointment from './components/bookAppointment';
import AppointmentDetailsModal from './components/AppointmentDetailsModal';
import Toast from './components/toast';

const PetOwnerDashboard = () => {
  // Navigation
  const navigate = useNavigate();
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [firstName, setFirstName] = useState('');
  
  // Modal States
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBookingToast, setShowBookingToast] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState(null);
  const [loadingAppointmentDetails, setLoadingAppointmentDetails] = useState(false);
  const [showCreateReminderModal, setShowCreateReminderModal] = useState(false);
  const [appointmentDates, setAppointmentDates] = useState(new Set());
  const [reminderDates, setReminderDates] = useState(new Set());
  // Data States
  const [registeredVet, setRegisteredVet] = useState(null);
  const [todaysReminders, setTodaysReminders] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [userId, setUserId] = useState(null);
  const [ppId, setPpId] = useState(null);
  const [userPets, setUserPets] = useState([]);
  const [rescheduleData, setRescheduleData] = useState(null);
  const [newReminder, setNewReminder] = useState({
    title: '',
    pet_id: '',
    date: '',
    time: '',
    description: '',
    recurring: false,
    recurringPeriod: 'day'
  });

  React.useEffect(() => {
    const storedName = sessionStorage.getItem('firstName');

    if (storedName) {
      setFirstName(storedName);
    }
  }, []);

  // Fetch user data and appointments
  React.useEffect(() => {
    const storedName = sessionStorage.getItem('firstName');
    const storedUserId = sessionStorage.getItem('userid');
  
    if (storedName) {
      setFirstName(storedName);
    }
  
    if (storedUserId) {
      setUserId(storedUserId);
      fetchPetParentInfo(storedUserId);
      fetchAssignedClinic(storedUserId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Add new useEffect to refresh reminders when date changes
  React.useEffect(() => {
    if (ppId) {
      fetchRemindersForDate(ppId, selectedDate);
    }
  }, [selectedDate, ppId]);

  React.useEffect(() => {
    if (ppId) {
      fetchReminderDates(ppId, selectedDate.getFullYear(), selectedDate.getMonth() + 1);
    }
    if (userId) {
      fetchAppointmentDates(userId, selectedDate.getFullYear(), selectedDate.getMonth() + 1);
    }
  }, [selectedDate, ppId, userId]);

  const fetchPetParentInfo = async (usr_id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/petparent/${usr_id}`);
      const data = await response.json();

      if (response.ok && data.pp_id) {
        setPpId(data.pp_id);
        await Promise.all([
          fetchUserPets(usr_id),
          fetchRemindersForDate(data.pp_id, selectedDate),
          fetchUpcomingAppointments(usr_id)
        ]);
      }
    } catch (error) {
      console.error('❌ Error fetching pet parent info:', error);
    }
  };

  const fetchAssignedClinic = async (usr_id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/user-clinic/${usr_id}`);
      const data = await res.json();

      if (data.clinic) {
        const vetRes = await fetch(`http://localhost:5000/api/vet-by-name/${encodeURIComponent(data.clinic)}`);
        const vetData = await vetRes.json();

        if (vetRes.ok && vetData) {
          setRegisteredVet(vetData);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching assigned clinic:", error);
    }
  };

  const fetchUserPets = async (usr_id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/user-pets/${usr_id}`);
      const data = await response.json();
      setUserPets(data);
    } catch (error) {
      console.error('❌ Error fetching pets:', error);
    }
  };

  const fetchRemindersForDate = async (pp_id, date) => {
    try {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      console.log('📅 Fetching reminders for date:', dateStr);
      
      // Use the new specific endpoint
      const response = await fetch(`http://localhost:5000/api/reminders/${pp_id}/by-date/${dateStr}`);
      const reminders = await response.json();
      
      console.log('✅ Received reminders:', reminders);
      setTodaysReminders(reminders.slice(0, 3));
    } catch (error) {
      console.error('❌ Error fetching reminders:', error);
    }
  };

  const fetchUpcomingAppointments = async (usr_id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/user-appointments/${usr_id}`);
      
      if (!response.ok) {
        console.error('Failed to fetch appointments');
        return;
      }
  
      const appointments = await response.json();
      
      // ✅ Transform and include ALL appointments (pending, scheduled, rescheduled)
      const transformedAppointments = appointments
        .filter(appt => appt.appt_status === 'scheduled' || appt.appt_status === 'pending')
        .map(appt => ({
          ...appt,
          appt_datetime: new Date(appt.appt_date)
        }));
  
      console.log('📅 Fetched appointments:', transformedAppointments);
      setUpcomingAppointments(transformedAppointments);
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
    }
  };

  const fetchAppointmentDetailsById = async (appt_id) => {
    try {
      setLoadingAppointmentDetails(true);
      const response = await fetch(`http://localhost:5000/api/appointment-details/${appt_id}`);

      if (response.status === 404) {
        alert('Appointment not found');
        setLoadingAppointmentDetails(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSelectedAppointmentDetails(data);
      setShowAppointmentModal(true);
      setLoadingAppointmentDetails(false);
    } catch (error) {
      console.error('❌ Error fetching appointment details:', error);
      setLoadingAppointmentDetails(false);
      alert('Failed to fetch appointment details');
    }
  };

  const handleBookingSuccess = (details) => {
    if (details.rescheduled) {
      alert(`Appointment rescheduled successfully to ${details.date.toLocaleDateString()} at ${details.time}. Your appointment is now pending approval.`);
    } else {
      setBookingDetails(details);
      setShowBookingToast(true);
      
      setTimeout(() => {
        setShowBookingToast(false);
        setBookingDetails(null);
      }, 3000);
    }
    
    setRescheduleData(null);
    
    // Refresh appointments
    if (userId) {
      fetchUpcomingAppointments(userId);
    }
  };

  const fetchReminderDates = async (pp_id, year, month) => {
    try {
      const response = await fetch(`http://localhost:5000/api/reminders/${pp_id}/dates/${year}/${month}`);
      const data = await response.json();
      setReminderDates(new Set(data.days));
    } catch (error) {
      console.error('❌ Error fetching reminder dates:', error);
    }
  };
  
  const fetchAppointmentDates = async (usr_id, year, month) => {
    try {
      const response = await fetch(`http://localhost:5000/api/user-appointments/${usr_id}`);
      const appointments = await response.json();
      
      const dates = new Set();
      appointments.forEach(appt => {
        const apptDate = new Date(appt.appt_date);
        if (apptDate.getFullYear() === year && apptDate.getMonth() === month - 1) {
          dates.add(apptDate.getDate());
        }
      });
      
      setAppointmentDates(dates);
    } catch (error) {
      console.error('❌ Error fetching appointment dates:', error);
    }
  };

  const handleCreateReminder = async () => {
    if (!newReminder.title || !newReminder.date || !newReminder.time) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pp_id: ppId,
          pet_id: newReminder.pet_id || null,
          rmd_title: newReminder.title,
          rmd_desc: newReminder.description,
          rmd_date: newReminder.date,
          rmd_time: newReminder.time,
          rmd_repeat: newReminder.recurring ? 'yes' : 'no',
          rmd_repeat_period: newReminder.recurring ? newReminder.recurringPeriod : ''
        })
      });

      if (response.ok) {
        setShowCreateReminderModal(false);
        setNewReminder({
          title: '',
          pet_id: '',
          date: '',
          time: '',
          description: '',
          recurring: false,
          recurringPeriod: 'day'
        });
        fetchRemindersForDate(ppId, selectedDate);
      } else {
        alert('Failed to create reminder');
      }
    } catch (error) {
      console.error('❌ Error creating reminder:', error);
      alert('Failed to create reminder');
    }
  };

  const handleInputChange = (field, value) => {
    setNewReminder(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDateForModal = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Calculate appointment position and height
  const getAppointmentStyle = (appt, appointmentsInHour, index) => {
    const apptDateTime = new Date(appt.appt_date);
    const minutes = apptDateTime.getMinutes();
    
    // Position based on minutes (0-60 maps to 0-80px slot height)
    const topPosition = (minutes / 60) * 80; // Maps minutes to the 80px slot
    
    // Appointment height
    const height = 65;
    
    // If multiple appointments in the same hour, stagger them
    const leftOffset = index > 0 ? index * 40 : 0;
    
    return {
      top: `${topPosition}px`,
      height: `${height}px`,
      left: `${8 + leftOffset}px`
    };
  };

  const getAppointmentsForHour = (hour) => {
    return upcomingAppointments.filter(appt => {
      const apptHour = appt.appt_datetime.getHours();
      const apptDate = appt.appt_datetime.toDateString();
      const selectedDateStr = selectedDate.toDateString();
      return apptHour === hour && apptDate === selectedDateStr;
    });
  };

  const hours = Array.from({ length: 24 }, (_, i) => i); // 0-23 (12am to 11pm)

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(selectedDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const handlePrevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day) => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day));
  };

  // Add this function in your parent component
  const handleCancelAppointment = async (apptId, cancelReason) => {
    const cancelledBy = 'petParent';
    
    try {
      const response = await fetch(`http://localhost:5000/api/appointments/${apptId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelReason: cancelReason || null,
          cancelledBy: cancelledBy
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to cancel appointment');
      }
  
      const data = await response.json();
      alert('Appointment cancelled successfully');
      
      // Close the modal and refresh appointments
      setShowAppointmentModal(false);
      setSelectedAppointmentDetails(null);
      
      // Refresh appointments list
      if (userId) {
        fetchUpcomingAppointments(userId);
      }
      
      return data;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  };

  const handleRescheduleRequest = (appointmentDetails) => {
    // The reason is already collected in AppointmentDetailsModal
    // Just store the appointment data and open booking modal
    setRescheduleData(appointmentDetails);
    setShowBookingModal(true);
  };

  return (
    <div className="petowner-dashboard-container">
      <PawPattern count={35} />
      
      {/* Sidebar Navigation Component */}
      <PetOwnerNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <ProfileNotification firstName={firstName} />

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {/* Today's Schedule */}
          <div className="schedule-section">
            <div className="schedule-header">
              <div className="schedule-title-container">
                <h2>Today's Schedule</h2>
                <p className="schedule-date">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button 
                className="book-appointment-button"
                onClick={() => setShowBookingModal(true)}
                disabled={!registeredVet}
              >
                <Plus size={18} />
                Book Appointment
              </button>
            </div>

            <div className="schedule-timeline">
            {hours.map((hour) => {
              const appointments = getAppointmentsForHour(hour);
              return (
                <div key={hour} className="time-slot">
                  <div className="time-label">
                    {hour === 0 ? '12' : hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                  </div>
                  <div className="time-content">
                    {appointments.map((appt, index) => {
                      const style = getAppointmentStyle(appt, appointments, index);
                      return (
                        <div 
                          key={appt.appt_id}
                          className={`appointment-block ${index > 0 ? `staggered-${index}` : ''}`}
                          style={style}
                          onClick={() => fetchAppointmentDetailsById(appt.appt_id)}
                        >
                          <div className="appointment-title">
                            {appt.appt_type} - {appt.pet_name} 
                            <span className={`consultation-badge ${appt.consultation_type === 'online' ? 'online' : 'physical'}`}>
                              {appt.consultation_type === 'online' ? 'Online' : 'Physical'}
                            </span>
                            {/* ✅ Show different badge based on status */}
                            {appt.resched_flag === 'yes' && !appt.vet_name ? (
                              <span className="vet-badge status-rescheduled" style={{ marginLeft: '8px', fontSize: '0.75rem' }}>
                                Rescheduled (Pending)
                              </span>
                            ) : appt.appt_status === 'pending' ? (
                              <span className="vet-badge status-pending" style={{ marginLeft: '8px', fontSize: '0.75rem' }}>
                                Pending
                              </span>
                            ) : null}
                          </div>
                          <div className="appointment-time">
                            {appt.appt_datetime.toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit', 
                              hour12: true 
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          </div>

          {/* Calendar & Scheduled Items */}
          <div className="calendar-scheduled-container">
            {/* Monthly Calendar */}
            <div className="calendar-section">
              <div className="calendar-header">
                <h3>
                  {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </h3>
                <div className="calendar-nav">
                  <button onClick={handlePrevMonth} className="calendar-nav-button">
                    <ChevronLeft size={20} color="#6c757d" />
                  </button>
                  <button onClick={handleNextMonth} className="calendar-nav-button">
                    <ChevronRight size={20} color="#6c757d" />
                  </button>
                </div>
              </div>

              <div className="calendar-weekdays">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="calendar-weekday">
                    {day}
                  </div>
                ))}
              </div>

              <div className="calendar-days">
                {Array.from({ length: firstDay }).map((_, idx) => (
                  <div key={`empty-${idx}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const isToday = day === selectedDate.getDate();
                  const hasReminder = reminderDates.has(day);
                  const hasAppointment = appointmentDates.has(day);
                  
                  return (
                    <button
                      key={day}
                      onClick={() => handleDayClick(day)}
                      className={`calendar-day ${isToday ? 'selected' : ''}`}
                    >
                      {day}
                      {(hasReminder || hasAppointment) && (
                        <div className="calendar-indicator-dot" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scheduled Items */}
            <div className="scheduled-section">
            <div className="scheduled-header">
              <h3>Reminders Scheduled</h3>
              <button 
                className="view-all-button"
                onClick={() => navigate('/petowner-reminders')}
              >
                View All
              </button>
            </div>
            
            <div className="scheduled-date-display">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

              <div className="reminders-list">
                {todaysReminders.length > 0 ? (
                  todaysReminders.map(reminder => (
                    <div key={reminder.rmd_id} className="reminder-item-dashboard">
                      <div className="reminder-info">
                        <span className="reminder-title">{reminder.rmd_title}</span>
                        {reminder.pet_name && (
                          <span className="reminder-pet">• {reminder.pet_name}</span>
                        )}
                      </div>
                      <span className="reminder-time-small">{formatTime(reminder.rmd_time)}</span>
                    </div>
                  ))
                ) : (
                  <div className="scheduled-empty">
                    No reminders today
                  </div>
                )}
              </div>

              <button 
                className="create-task-button"
                onClick={() => setShowCreateReminderModal(true)}
              >
                + Create Reminder
              </button>
            </div>
          </div>
        </div>

        {/* Book Appointment Modal */}
        {/* Book Appointment Modal */}
        {showBookingModal && registeredVet && (
          <div className="myvet-modal-overlay" onClick={() => setShowBookingModal(false)}>
            <div onClick={(e) => e.stopPropagation()}>
              <BookAppointment 
                clinicId={rescheduleData?.clinic_id || registeredVet.clinic_id}
                onClose={() => {
                  setShowBookingModal(false);
                  setRescheduleData(null);
                }}
                onBookingSuccess={handleBookingSuccess}
                rescheduleMode={!!rescheduleData}
                oldAppointmentId={rescheduleData?.appt_id}
                rescheduleData={rescheduleData}
                initialDescription={rescheduleData?.appt_description || ''}
                autoFillDescription={!!rescheduleData}
              />
            </div>
          </div>
        )}

        {/* Booking Toast */}
        {showBookingToast && bookingDetails && (
          <Toast
            type="pending"
            title="Awaiting Approval"
            message={`Booking pending for ${bookingDetails.time}`}
          />
        )}

        {/* Appointment Details Modal */}
        <AppointmentDetailsModal 
          showModal={showAppointmentModal}
          appointmentDetails={selectedAppointmentDetails}
          loading={loadingAppointmentDetails}
          onCancelAppointment={handleCancelAppointment}  // Add this
          onRescheduleRequest={handleRescheduleRequest}  // Add this
          onClose={() => {
            setShowAppointmentModal(false);
            setSelectedAppointmentDetails(null);
          }}
          formatDate={formatDateForModal}
          userRole="pp" // ✅ ADD THIS
          onContactVet={() => { // ✅ ADD THIS
            // Navigate to chat page
            window.location.href = '/petowner-chat';
          }}
        />

        {/* Create Reminder Modal */}
        {showCreateReminderModal && (
          <div className="modal-overlay" onClick={() => setShowCreateReminderModal(false)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Create New Reminder</h2>
                <button className="modal-close" onClick={() => setShowCreateReminderModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Reminder Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter reminder title"
                    value={newReminder.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assign to Pet</label>
                  <select
                    className="form-select"
                    value={newReminder.pet_id}
                    onChange={(e) => handleInputChange('pet_id', e.target.value)}
                  >
                    <option value="">None</option>
                    {userPets.map(pet => (
                      <option key={pet.pet_id} value={pet.pet_id}>
                        {pet.pet_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Remind me on... *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newReminder.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Select Time *</label>
                    <input
                      type="time"
                      className="form-input"
                      value={newReminder.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Add a Description (Optional)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Enter description"
                    rows="3"
                    value={newReminder.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-checkbox-label">
                    <input
                      type="checkbox"
                      className="form-checkbox-input"
                      checked={newReminder.recurring}
                      onChange={(e) => handleInputChange('recurring', e.target.checked)}
                    />
                    <span className="form-checkbox-text">Recurring</span>
                  </label>
                </div>

                {newReminder.recurring && (
                  <div className="form-group">
                    <label className="form-label">Remind every...</label>
                    <select
                      className="form-select"
                      value={newReminder.recurringPeriod}
                      onChange={(e) => handleInputChange('recurringPeriod', e.target.value)}
                    >
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                      <option value="year">Year</option>
                    </select>
                  </div>
                )}

                <div className="modal-actions">
                  <button className="modal-button-cancel" onClick={() => setShowCreateReminderModal(false)}>
                    Cancel
                  </button>
                  <button className="modal-button-save" onClick={handleCreateReminder}>
                    Create Reminder
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetOwnerDashboard;