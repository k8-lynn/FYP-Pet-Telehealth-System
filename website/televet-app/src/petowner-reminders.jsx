import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import './styles/petowner-reminders.css';
import PawPattern from "./components/PawPattern";
import PetOwnerNavbar from './components/petowner-navbar';
import ProfileNotification from "./components/ProfileNotification";

const RemindersPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [firstName, setFirstName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [newReminder, setNewReminder] = useState({
    title: '',
    pet: '',
    date: '',
    time: '',
    description: '',
    recurring: false,
    recurringPeriod: 'day'
  });
  const [todaysReminders, setTodaysReminders] = useState([
    { 
      id: 1, 
      task: 'Give Buddy his medication', 
      time: '9:00 AM', 
      completed: false,
      pet: 'Buddy',
      date: 'Oct 14, 2025',
      description: 'Give 1 tablet with food',
      recurring: true,
      recurringPeriod: 'day'
    },
    { 
      id: 2, 
      task: 'Walk Max in the park', 
      time: '2:30 PM', 
      completed: false,
      pet: 'Max',
      date: 'Oct 14, 2025',
      description: '',
      recurring: false,
      recurringPeriod: ''
    },
    { 
      id: 3, 
      task: 'Vet appointment reminder call', 
      time: '4:00 PM', 
      completed: false,
      pet: 'Luna',
      date: 'Oct 14, 2025',
      description: 'Call Dr. Smith to confirm appointment',
      recurring: false,
      recurringPeriod: ''
    }
  ]);

  React.useEffect(() => {
    const storedName = localStorage.getItem('firstName');
    if (storedName) {
      setFirstName(storedName);
    }
  }, []);

  const upcomingReminders = [
    { 
      id: 1, 
      title: 'Grooming appointment for Luna', 
      date: 'Tomorrow', 
      time: '10:00 AM',
      pet: 'Luna',
      description: 'Full grooming service at Pet Spa',
      recurring: false,
      recurringPeriod: ''
    },
    { 
      id: 2, 
      title: 'Buy dog food', 
      date: 'Oct 16, 2025', 
      time: '3:00 PM',
      pet: 'Buddy',
      description: 'Get large bag of Blue Buffalo',
      recurring: true,
      recurringPeriod: 'month'
    },
    { 
      id: 3, 
      title: 'Training session with Charlie', 
      date: 'Oct 18, 2025', 
      time: '11:30 AM',
      pet: 'Max',
      description: '',
      recurring: true,
      recurringPeriod: 'week'
    }
  ];

  const upcomingAppointments = [
    { id: 1, title: 'Annual checkup - Buddy', date: 'Oct 20, 2025', time: '2:00 PM' },
    { id: 2, title: 'Vaccination - Max', date: 'Oct 25, 2025', time: '9:30 AM' },
    { id: 3, title: 'Dental cleaning - Luna', date: 'Nov 2, 2025', time: '1:00 PM' }
  ];

  const daysWithReminders = [5, 12, 16, 18, 20, 25];

  const toggleReminder = (id, e) => {
    e.stopPropagation();
    setTodaysReminders(todaysReminders.map(reminder =>
      reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder
    ));
  };

  const handleReminderClick = (reminder) => {
    setSelectedReminder(reminder);
    setShowDetailsModal(true);
  };

  const handleUpcomingClick = (reminder) => {
    setSelectedReminder(reminder);
    setShowDetailsModal(true);
  };

  const handleDeleteReminder = () => {
    // Delete logic here
    handleCloseModal();
  };

  const handleCreateReminder = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setShowDetailsModal(false);
    setSelectedReminder(null);
    setNewReminder({
      title: '',
      pet: '',
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

  return (
    <div className="reminders-container">
      <PawPattern count={35} />
      
      {/* Sidebar Navigation Component */}
      <PetOwnerNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="main-content">
        {/* Header */}
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

              <button className="add-reminder-button" onClick={handleCreateReminder}>
                <Plus size={20} />
                Add Reminder
              </button>
            </div>

            {/* Today's Reminders Section */}
            <div className="todays-reminders-section">
              <div className="section-header">
                <h3 className="section-title">Today's Reminders</h3>
                <span className="reminder-count">
                  {todaysReminders.filter(r => !r.completed).length}
                </span>
              </div>

              <div className="reminders-list">
                {todaysReminders.length > 0 ? (
                  todaysReminders.map(reminder => (
                    <div
                      key={reminder.id}
                      className={`reminder-item ${reminder.completed ? 'completed' : ''}`}
                      onClick={() => handleReminderClick(reminder)}
                    >
                      <div 
                        className={`reminder-checkbox ${reminder.completed ? 'checked' : ''}`}
                        onClick={(e) => toggleReminder(reminder.id, e)}
                      />
                      <div className="reminder-details">
                        <span className="reminder-task">{reminder.task}</span>
                        <span className="reminder-time">{reminder.time}</span>
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
                      key={reminder.id} 
                      className="upcoming-item"
                      onClick={() => handleUpcomingClick(reminder)}
                    >
                      <div className="upcoming-info">
                        <div className="upcoming-title">{reminder.title}</div>
                        <div className="upcoming-date">{reminder.date}</div>
                      </div>
                      <div className="upcoming-time">{reminder.time}</div>
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
                <button className="book-appointment-button">
                  <Plus size={18} />
                  Book Appointment
                </button>
              </div>

              <div className="upcoming-list">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map(appointment => (
                    <div key={appointment.id} className="appointment-item">
                      <div className="upcoming-info">
                        <div className="upcoming-title">{appointment.title}</div>
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
                  <label className="form-label">Reminder Title</label>
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
                    value={newReminder.pet}
                    onChange={(e) => handleInputChange('pet', e.target.value)}
                  >
                    <option value="">Select a pet</option>
                    <option value="Buddy">Buddy</option>
                    <option value="Max">Max</option>
                    <option value="Luna">Luna</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Remind me on...</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newReminder.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Select Time</label>
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
                  <button className="modal-button-save">
                    Create Reminder
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reminder Details Modal */}
        {showDetailsModal && selectedReminder && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Reminder Details</h2>
                <button className="modal-close" onClick={handleCloseModal}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-group">
                  <label className="detail-label">Reminder Title</label>
                  <p className="detail-value">{selectedReminder.task || selectedReminder.title}</p>
                </div>

                <div className="detail-group">
                  <label className="detail-label">Assigned to Pet</label>
                  <p className="detail-value">{selectedReminder.pet}</p>
                </div>

                <div className="form-row">
                  <div className="detail-group">
                    <label className="detail-label">Date</label>
                    <p className="detail-value">{selectedReminder.date}</p>
                  </div>

                  <div className="detail-group">
                    <label className="detail-label">Time</label>
                    <p className="detail-value">{selectedReminder.time}</p>
                  </div>
                </div>

                {selectedReminder.description && (
                  <div className="detail-group">
                    <label className="detail-label">Description</label>
                    <p className="detail-value">{selectedReminder.description}</p>
                  </div>
                )}

                <div className="detail-group">
                  <label className="detail-label">Recurring</label>
                  <p className="detail-value">
                    {selectedReminder.recurring 
                      ? `Yes - Every ${selectedReminder.recurringPeriod}`
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
                    <button className="modal-button-save">
                      Edit Reminder
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemindersPage;