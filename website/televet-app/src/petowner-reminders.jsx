//petowner-reminders.jsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import './styles/petowner-reminders.css';
import PawPattern from "./components/PawPattern";
import PetOwnerNavbar from './components/petowner-navbar';
import ProfileNotification from "./components/ProfileNotification";
import AppointmentDetailsModal from './components/AppointmentDetailsModal';

const RemindersPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [firstName, setFirstName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [todaysReminders, setTodaysReminders] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [daysWithReminders, setDaysWithReminders] = useState([]);
  const [userPets, setUserPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ppId, setPpId] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState(null);
  
  const [newReminder, setNewReminder] = useState({
    title: '',
    pet_id: '',
    date: '',
    time: '',
    description: '',
    recurring: false,
    recurringPeriod: 'day'
  });

  // Load user data and fetch reminders
  useEffect(() => {
    const storedName = sessionStorage.getItem('firstName');
    const storedUserId = sessionStorage.getItem('userid');

    if (storedName) setFirstName(storedName);
    
    if (storedUserId) {
      fetchPetParentInfo(storedUserId);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update reminders when selected date changes
  useEffect(() => {
    if (ppId) {
      fetchRemindersForSelectedDate(ppId, selectedDate);
    }
  }, [selectedDate, ppId]);

  // Fetch pet parent info to get pp_id
  const fetchPetParentInfo = async (usr_id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/petparent/${usr_id}`);
      const data = await response.json();

      if (response.ok && data.pp_id) {
        setPpId(data.pp_id);
        await Promise.all([
          fetchUserPets(usr_id),
          fetchTodaysReminders(data.pp_id),
          fetchUpcomingReminders(data.pp_id),
          fetchReminderDates(data.pp_id, currentDate.getFullYear(), currentDate.getMonth() + 1),
          fetchUpcomingAppointments(usr_id)
        ]);
      }
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching pet parent info:', error);
      setLoading(false);
    }
  };

  // Fetch user's pets for the dropdown
  const fetchUserPets = async (usr_id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/user-pets/${usr_id}`);
      const data = await response.json();
      setUserPets(data);
    } catch (error) {
      console.error('❌ Error fetching pets:', error);
    }
  };

  // Fetch today's reminders
  const fetchTodaysReminders = async (pp_id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/reminders/${pp_id}/today`);
      const data = await response.json();
      setTodaysReminders(data);
    } catch (error) {
      console.error('❌ Error fetching today\'s reminders:', error);
    }
  };

  // Fetch reminders for selected date
  const fetchRemindersForSelectedDate = async (pp_id, date) => {
    try {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      console.log('📅 Fetching reminders for date:', dateStr);
      
      const response = await fetch(`http://localhost:5000/api/reminders/${pp_id}/by-date/${dateStr}`);
      const data = await response.json();
      
      console.log('✅ Received reminders:', data);
      setTodaysReminders(data);
    } catch (error) {
      console.error('❌ Error fetching reminders for selected date:', error);
    }
  };

  // Fetch upcoming reminders
  const fetchUpcomingReminders = async (pp_id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/reminders/${pp_id}/upcoming`);
      const data = await response.json();
      setUpcomingReminders(data);
    } catch (error) {
      console.error('❌ Error fetching upcoming reminders:', error);
    }
  };

  // Fetch reminder dates for calendar
  const fetchReminderDates = async (pp_id, year, month) => {
    try {
      const response = await fetch(`http://localhost:5000/api/reminders/${pp_id}/dates/${year}/${month}`);
      const data = await response.json();
      setDaysWithReminders(data.days || []);
    } catch (error) {
      console.error('❌ Error fetching reminder dates:', error);
    }
  };

  // Fetch upcoming appointments
  const fetchUpcomingAppointments = async (usr_id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/user-appointments/${usr_id}`);
      
      if (!response.ok) {
        console.error('Failed to fetch appointments');
        return;
      }

      const appointments = await response.json();
      
      console.log('📅 Fetched appointments:', appointments);
      
      // Transform appointments data
      const formattedAppointments = appointments.map(appt => ({
        id: appt.appt_id,
        title: `${appt.appt_type} - ${appt.pet_name}`,
        consultationType: appt.consultation_type,
        date: new Date(appt.appt_date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        time: new Date(appt.appt_date).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        }),
        rawDate: new Date(appt.appt_date) // For sorting
      }));
      
      // Sort by date (earliest first)
      formattedAppointments.sort((a, b) => a.rawDate - b.rawDate);
      
      setUpcomingAppointments(formattedAppointments);
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
    }
  };

  const fetchAppointmentDetailsById = async (appt_id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/appointment-details/${appt_id}`);
  
      if (response.status === 404) {
        console.log('Appointment not found');
        setSelectedAppointmentDetails(null);
        alert('Appointment not found');
        return;
      }
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      setSelectedAppointmentDetails(data);
      setShowAppointmentModal(true);
    } catch (error) {
      console.error('❌ Error fetching appointment details:', error);
      setSelectedAppointmentDetails(null);
      alert('Failed to fetch appointment details');
    }
  };

  // Update calendar when month changes
  useEffect(() => {
    if (ppId) {
      fetchReminderDates(ppId, currentDate.getFullYear(), currentDate.getMonth() + 1);
    }
  }, [currentDate, ppId]);

  // Toggle reminder completion
  const toggleReminder = async (rmd_id, e) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(`http://localhost:5000/api/reminders/${rmd_id}/toggle`, {
        method: 'PUT'
      });

      if (response.ok) {
        fetchTodaysReminders(ppId);
      }
    } catch (error) {
      console.error('❌ Error toggling reminder:', error);
    }
  };

  // Create new reminder
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
        handleCloseModal();
        await Promise.all([
          fetchTodaysReminders(ppId),
          fetchUpcomingReminders(ppId),
          fetchReminderDates(ppId, currentDate.getFullYear(), currentDate.getMonth() + 1)
        ]);
      } else {
        alert('Failed to create reminder');
      }
    } catch (error) {
      console.error('❌ Error creating reminder:', error);
      alert('Failed to create reminder');
    }
  };

  // Update existing reminder
  const handleUpdateReminder = async () => {
    if (!selectedReminder.rmd_title || !selectedReminder.rmd_date || !selectedReminder.rmd_time) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/reminders/${selectedReminder.rmd_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_id: selectedReminder.pet_id || null,
          rmd_title: selectedReminder.rmd_title,
          rmd_desc: selectedReminder.rmd_desc,
          rmd_date: selectedReminder.rmd_date,
          rmd_time: selectedReminder.rmd_time,
          rmd_repeat: selectedReminder.rmd_repeat,
          rmd_repeat_period: selectedReminder.rmd_repeat_period || ''
        })
      });

      if (response.ok) {
        setShowEditModal(false);
        setShowDetailsModal(false);
        await Promise.all([
          fetchTodaysReminders(ppId),
          fetchUpcomingReminders(ppId),
          fetchReminderDates(ppId, currentDate.getFullYear(), currentDate.getMonth() + 1)
        ]);
      } else {
        alert('Failed to update reminder');
      }
    } catch (error) {
      console.error('❌ Error updating reminder:', error);
      alert('Failed to update reminder');
    }
  };

  // Delete reminder
  const handleDeleteReminder = async () => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/reminders/${selectedReminder.rmd_id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        handleCloseModal();
        await Promise.all([
          fetchTodaysReminders(ppId),
          fetchUpcomingReminders(ppId),
          fetchReminderDates(ppId, currentDate.getFullYear(), currentDate.getMonth() + 1)
        ]);
      } else {
        alert('Failed to delete reminder');
      }
    } catch (error) {
      console.error('❌ Error deleting reminder:', error);
      alert('Failed to delete reminder');
    }
  };

  const handleReminderClick = (reminder) => {
    setSelectedReminder(reminder);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setShowDetailsModal(false);
    setShowEditModal(false);
    setSelectedReminder(null);
    setNewReminder({
      title: '',
      pet_id: '',
      date: '',
      time: '',
      description: '',
      recurring: false,
      recurringPeriod: 'day'
    });
  };

  const handleInputChange = (field, value) => {
    setNewReminder(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day) => {
    return day === selectedDate.getDate() && 
           currentDate.getMonth() === selectedDate.getMonth() &&
           currentDate.getFullYear() === selectedDate.getFullYear();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
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

  if (loading) {
    return (
      <div className="reminders-container">
        <PawPattern count={35} />
        <PetOwnerNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="main-content">
          <ProfileNotification firstName={firstName} />
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>Loading reminders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reminders-container">
      <PawPattern count={35} />
      
      <PetOwnerNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="main-content">
        <ProfileNotification firstName={firstName} />

        <div className="reminders-content">
          {/* Left Column */}
          <div className="left-column">
            {/* Calendar Section */}
            <div className="calendar-section">
              <div className="calendar-nav">
                <h3 className="calendar-month">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <div className="calendar-nav-buttons">
                  <button className="calendar-nav-button" onClick={previousMonth}>
                    <ChevronLeft size={20} />
                  </button>
                  <button className="calendar-nav-button" onClick={nextMonth}>
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              <div className="calendar-weekdays">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="calendar-weekday">{day}</div>
                ))}
              </div>

              <div className="calendar-days">
                {[...Array(firstDay)].map((_, i) => (
                  <div key={`empty-${i}`} className="calendar-day" style={{ visibility: 'hidden' }} />
                ))}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  return (
                    <button
                      key={day}
                      className={`calendar-day ${isToday(day) ? 'today' : ''} ${isSelected(day) ? 'selected' : ''} ${daysWithReminders.includes(day) ? 'has-reminder' : ''}`}
                      onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <button className="add-reminder-button" onClick={() => setShowCreateModal(true)}>
                <Plus size={20} />
                Add Reminder
              </button>
            </div>

            {/* Today's Reminders Section */}
            <div className="todays-reminders-section">
            <div className="section-header">
              <h3 className="section-title">
                {isToday(selectedDate.getDate()) && 
                selectedDate.getMonth() === new Date().getMonth() && 
                selectedDate.getFullYear() === new Date().getFullYear()
                  ? "Today's Reminders"
                  : `${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} Reminders`}
              </h3>
              <span className="reminder-count">
                {todaysReminders.filter(r => r.rmd_done === 'no').length}
              </span>
            </div>

              <div className="reminders-list">
                {todaysReminders.length > 0 ? (
                  todaysReminders.map(reminder => (
                    <div
                      key={reminder.rmd_id}
                      className={`reminder-item ${reminder.rmd_done === 'yes' ? 'completed' : ''}`}
                      onClick={() => handleReminderClick(reminder)}
                    >
                      <div 
                        className={`reminder-checkbox ${reminder.rmd_done === 'yes' ? 'checked' : ''}`}
                        onClick={(e) => toggleReminder(reminder.rmd_id, e)}
                      />
                      <div className="reminder-details">
                        <span className="reminder-task">{reminder.rmd_title}</span>
                        <span className="reminder-time">{formatTime(reminder.rmd_time)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No reminders for today</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="right-column">
            {/* Upcoming Reminders Section */}
            <div className="upcoming-reminders-section">
              <div className="section-header">
                <h3 className="section-title">Upcoming Reminders</h3>
              </div>

              <div className="upcoming-list">
                {upcomingReminders.length > 0 ? (
                  upcomingReminders.map(reminder => (
                    <div 
                      key={reminder.rmd_id} 
                      className="upcoming-item"
                      onClick={() => handleReminderClick(reminder)}
                    >
                      <div className="upcoming-info">
                        <div className="upcoming-title">{reminder.rmd_title}</div>
                        <div className="upcoming-date">{formatDate(reminder.rmd_date)}</div>
                      </div>
                      <div className="upcoming-time">{formatTime(reminder.rmd_time)}</div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No upcoming reminders</div>
                )}
              </div>
            </div>
            {/* Upcoming Appointments Section */}
            <div className="upcoming-appointments-section">
              <div className="section-header">
                <h3 className="section-title">Upcoming Appointments</h3>
              </div>

              <div className="upcoming-list">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map(appointment => (
                    <div 
                      key={appointment.id} 
                      className="appointment-item"
                      onClick={() => fetchAppointmentDetailsById(appointment.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="upcoming-info">
                        <div className="upcoming-title">
                          {appointment.title}
                          <span className={`consultation-badge ${appointment.consultationType === 'online' ? 'online' : 'physical'}`}>
                            {appointment.consultationType === 'online' ? 'Online' : 'Physical'}
                          </span>
                        </div>
                        <div className="upcoming-date">{appointment.date}</div>
                      </div>
                      <div className="upcoming-time">{appointment.time}</div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No upcoming appointments</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create Reminder Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Create New Reminder</h2>
                <button className="modal-close" onClick={handleCloseModal}>×</button>
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
                  <button className="modal-button-cancel" onClick={handleCloseModal}>
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

        {/* Reminder Details Modal */}
        {showDetailsModal && selectedReminder && !showEditModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Reminder Details</h2>
                <button className="modal-close" onClick={handleCloseModal}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-group">
                  <label className="detail-label">Reminder Title</label>
                  <p className="detail-value">{selectedReminder.rmd_title}</p>
                </div>

                <div className="detail-group">
                  <label className="detail-label">Assigned to Pet</label>
                  <p className="detail-value">{selectedReminder.pet_name || 'None'}</p>
                </div>

                <div className="form-row">
                  <div className="detail-group">
                    <label className="detail-label">Date</label>
                    <p className="detail-value">{formatDate(selectedReminder.rmd_date)}</p>
                  </div>

                  <div className="detail-group">
                    <label className="detail-label">Time</label>
                    <p className="detail-value">{formatTime(selectedReminder.rmd_time)}</p>
                  </div>
                </div>

                {selectedReminder.rmd_desc && (
                  <div className="detail-group">
                    <label className="detail-label">Description</label>
                    <p className="detail-value">{selectedReminder.rmd_desc}</p>
                  </div>
                )}

                <div className="detail-group">
                  <label className="detail-label">Recurring</label>
                  <p className="detail-value">
                    {selectedReminder.rmd_repeat === 'yes'
                      ? `Yes - Every ${selectedReminder.rmd_repeat_period}`
                      : 'No'}
                  </p>
                </div>

                <div className="modal-actions">
                  <button className="modal-button-delete" onClick={handleDeleteReminder}>
                    Delete
                  </button>
                  <div className="modal-actions-right">
                    <button className="modal-button-cancel" onClick={handleCloseModal}>
                      Close
                    </button>
                    <button className="modal-button-save" onClick={() => setShowEditModal(true)}>
                      Edit Reminder
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Reminder Modal */}
        {showEditModal && selectedReminder && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Edit Reminder</h2>
                <button className="modal-close" onClick={handleCloseModal}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Reminder Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={selectedReminder.rmd_title}
                    onChange={(e) => setSelectedReminder({...selectedReminder, rmd_title: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assign to Pet</label>
                  <select
                    className="form-select"
                    value={selectedReminder.pet_id || ''}
                    onChange={(e) => setSelectedReminder({...selectedReminder, pet_id: e.target.value})}
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
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={selectedReminder.rmd_date}
                      onChange={(e) => setSelectedReminder({...selectedReminder, rmd_date: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Time *</label>
                    <input
                      type="time"
                      className="form-input"
                      value={selectedReminder.rmd_time}
                      onChange={(e) => setSelectedReminder({...selectedReminder, rmd_time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={selectedReminder.rmd_desc || ''}
                    onChange={(e) => setSelectedReminder({...selectedReminder, rmd_desc: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-checkbox-label">
                    <input
                      type="checkbox"
                      className="form-checkbox-input"
                      checked={selectedReminder.rmd_repeat === 'yes'}
                      onChange={(e) => setSelectedReminder({
                        ...selectedReminder, 
                        rmd_repeat: e.target.checked ? 'yes' : 'no'
                      })}
                    />
                    <span className="form-checkbox-text">Recurring</span>
                  </label>
                </div>

                {selectedReminder.rmd_repeat === 'yes' && (
                  <div className="form-group">
                    <label className="form-label">Remind every...</label>
                    <select
                      className="form-select"
                      value={selectedReminder.rmd_repeat_period || 'day'}
                      onChange={(e) => setSelectedReminder({...selectedReminder, rmd_repeat_period: e.target.value})}
                    >
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                      <option value="year">Year</option>
                    </select>
                  </div>
                )}

                <div className="modal-actions">
                  <button className="modal-button-cancel" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button className="modal-button-save" onClick={handleUpdateReminder}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appointment Details Modal */}
        <AppointmentDetailsModal 
          showModal={showAppointmentModal}
          appointmentDetails={selectedAppointmentDetails}
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
      </div>
    </div>
    );
    };

export default RemindersPage;