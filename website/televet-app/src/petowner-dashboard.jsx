import React, { useState } from 'react';
import { Bell, ChevronLeft, ChevronRight, User, Plus } from 'lucide-react';
import './styles/petowner-dashboard.css';
import PawPattern from "./components/PawPattern";
import PetOwnerNavbar from './components/petowner-navbar';
import ProfileNotification from "./components/ProfileNotification";


const PetOwnerDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [firstName, setFirstName] = useState('');

  React.useEffect(() => {
    const storedName = localStorage.getItem('firstName');
    if (storedName) {
      setFirstName(storedName);
    }
  }, []);

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8am to 7pm

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

  return (
    <div className="dashboard-container">
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
              <button className="book-appointment-button">
                <Plus size={18} />
                Book Appointment
              </button>
            </div>

            <div className="schedule-timeline">
              {hours.map((hour) => (
                <div key={hour} className="time-slot">
                  <div className="time-label">
                    {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                  </div>
                  <div className="time-content">
                    {/* Tasks would appear here */}
                  </div>
                </div>
              ))}
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
                  return (
                    <button
                      key={day}
                      onClick={() => handleDayClick(day)}
                      className={`calendar-day ${isToday ? 'selected' : ''}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scheduled Items */}
            <div className="scheduled-section">
              <div className="scheduled-header">
                <h3>Scheduled</h3>
                <button className="view-all-button">
                  View All
                </button>
              </div>

              <div className="scheduled-empty">
                Nothing scheduled
              </div>

              <button className="create-task-button">
                + Create Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetOwnerDashboard;