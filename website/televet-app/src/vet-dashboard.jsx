import React, { useState, useEffect } from 'react';
import { PawPrint, Plus, Trash2, ChevronDown, X, Bell, MapPin, Calendar, Users, Stethoscope, Clock, Eye, UserCheck } from 'lucide-react';
import PawPattern from "./components/PawPattern";
import VetNavbar from './components/vet-navbar';
import ProfileNotification from "./components/ProfileNotification";
import './styles/vet-dashboard.css';

const VetDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    const storedName = sessionStorage.getItem('firstName');
    if (storedName) {
      setFirstName(storedName);
    }
  }, []);

  const stats = [
    {
      id: 1,
      title: 'Upcoming Appointments',
      value: '8',
      subtitle: 'Your schedule',
      icon: Calendar,
      color: '#a8ceff'
    },
    {
      id: 2,
      title: 'All Patients',
      value: '127',
      subtitle: 'Under your care',
      icon: Users,
      color: '#91befe'
    },
    {
      id: 3,
      title: 'Follow-ups Due',
      value: '5',
      subtitle: 'This week',
      icon: UserCheck,
      color: '#ffd666'
    }
  ];

  const todaysAppointments = [
    {
      id: 1,
      time: '9:00 AM',
      petName: 'Buddy',
      ownerName: 'John Smith',
      type: 'Check-up',
      status: 'Scheduled'
    },
    {
      id: 2,
      time: '9:30 AM',
      petName: 'Luna',
      ownerName: 'Sarah Johnson',
      type: 'Vaccination',
      status: 'Scheduled'
    },
    {
      id: 3,
      time: '10:00 AM',
      petName: 'Max',
      ownerName: 'David Lee',
      type: 'Dental',
      status: 'In Progress'
    },
    {
      id: 4,
      time: '10:30 AM',
      petName: 'Charlie',
      ownerName: 'Emma Wilson',
      type: 'Surgery',
      status: 'Scheduled'
    },
    {
      id: 5,
      time: '11:00 AM',
      petName: 'Bella',
      ownerName: 'Michael Chen',
      type: 'Check-up',
      status: 'Scheduled'
    },
    {
      id: 6,
      time: '2:00 PM',
      petName: 'Rocky',
      ownerName: 'Lisa Martinez',
      type: 'Vaccination',
      status: 'Scheduled'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      action: 'Appointment completed',
      details: 'Max - Dental cleaning',
      time: '15 mins ago'
    },
    {
      id: 2,
      action: 'Prescription issued',
      details: 'Bella - Pain medication prescribed',
      time: '30 mins ago'
    },
    {
      id: 3,
      action: 'Lab results reviewed',
      details: 'Rocky - Blood test results normal',
      time: '1 hour ago'
    },
    {
      id: 4,
      action: 'Follow-up scheduled',
      details: 'Luna - Vaccination follow-up in 3 weeks',
      time: '2 hours ago'
    },
    {
      id: 5,
      action: 'Medical notes updated',
      details: 'Buddy - Added allergy information',
      time: '3 hours ago'
    },
    {
      id: 6,
      action: 'Surgery completed',
      details: 'Charlie - Successful spay procedure',
      time: '4 hours ago'
    }
  ];

  const getTypeColor = (type) => {
    const colors = {
      'Check-up': '#a8ceff',
      'Vaccination': '#91befe',
      'Dental': '#ffd666',
      'Surgery': '#ffb088',
      'Emergency': '#ff8b8b'
    };
    return colors[type] || '#cbd5e1';
  };

  return (
    <div className="vet-dashboard-container">
      <PawPattern count={35} />
      <VetNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="vet-main-content">
        {/* Header */}
        <div className="vet-header">
          <div className="location-info">
            <MapPin size={20} className="location-icon" />
            <span className="location-text">PawCare Veterinary Clinic</span>
          </div>
          <ProfileNotification firstName={firstName} />
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {stats.map(stat => (
            <div key={stat.id} className="stat-card">
              <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                <stat.icon size={24} />
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stat.value}</h3>
                <p className="stat-title">{stat.title}</p>
                <p className="stat-subtitle">{stat.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-content">
          {/* Today's Appointments */}
          <div className="appointments-section">
            <div className="section-header">
              <h3 className="section-title">Today's Appointments</h3>
              <span className="appointment-count">{todaysAppointments.length}</span>
            </div>

            <div className="appointments-table">
              <div className="table-header">
                <div className="table-cell">Time</div>
                <div className="table-cell">Pet Name</div>
                <div className="table-cell">Owner Name</div>
                <div className="table-cell">Type</div>
                <div className="table-cell">Status</div>
                <div className="table-cell">Action</div>
              </div>

              <div className="table-body">
                {todaysAppointments.map(appointment => (
                  <div key={appointment.id} className="table-row">
                    <div className="table-cell">
                      <span className="appointment-time">{appointment.time}</span>
                    </div>
                    <div className="table-cell">
                      <span className="pet-name">{appointment.petName}</span>
                    </div>
                    <div className="table-cell">
                      <span className="owner-name">{appointment.ownerName}</span>
                    </div>
                    <div className="table-cell">
                      <span 
                        className="appointment-type"
                        style={{ 
                          background: `${getTypeColor(appointment.type)}20`,
                          color: getTypeColor(appointment.type),
                          border: `2px solid ${getTypeColor(appointment.type)}40`
                        }}
                      >
                        {appointment.type}
                      </span>
                    </div>
                    <div className="table-cell">
                      <span className="status-badge">{appointment.status}</span>
                    </div>
                    <div className="table-cell">
                      <button className="view-button">
                        <Eye size={16} />
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="activity-section">
            <div className="section-header">
              <h3 className="section-title">Recent Activity</h3>
            </div>

            <div className="activity-list">
              {recentActivities.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-dot"></div>
                  <div className="activity-content">
                    <p className="activity-action">{activity.action}</p>
                    <p className="activity-details">{activity.details}</p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VetDashboard;