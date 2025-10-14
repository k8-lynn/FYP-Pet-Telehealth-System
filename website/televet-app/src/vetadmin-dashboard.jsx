import React, { useState, useEffect } from 'react';
import { PawPrint, Plus, Trash2, ChevronDown, X, Bell, MapPin, Calendar, Users, Stethoscope, Clock, Eye } from 'lucide-react';
import PawPattern from "./components/PawPattern";
import ProfileNotification from "./components/ProfileNotification";
import './styles/vetadmin-dashboard.css';

const VetAdminDashboard = () => {
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    const storedName = localStorage.getItem('firstName');
    if (storedName) {
      setFirstName(storedName);
    }
  }, []);

  const stats = [
    {
      id: 1,
      title: 'Upcoming Appointments',
      value: '24',
      subtitle: 'For all vet doctors',
      icon: Calendar,
      color: '#a8ceff'
    },
    {
      id: 2,
      title: 'All Patients',
      value: '342',
      subtitle: 'Total registered',
      icon: Users,
      color: '#91befe'
    },
    {
      id: 3,
      title: 'Active Veterinarians',
      value: '8',
      subtitle: 'On duty today',
      icon: Stethoscope,
      color: '#ffd666'
    },
    {
      id: 4,
      title: 'Pending Requests',
      value: '12',
      subtitle: 'Awaiting approval',
      icon: Clock,
      color: '#ffb088'
    }
  ];

  const todaysAppointments = [
    {
      id: 1,
      time: '9:00 AM',
      petName: 'Buddy',
      ownerName: 'John Smith',
      type: 'Check-up',
      vetDoctor: 'Dr. Emily Chen'
    },
    {
      id: 2,
      time: '9:30 AM',
      petName: 'Luna',
      ownerName: 'Sarah Johnson',
      type: 'Vaccination',
      vetDoctor: 'Dr. Michael Brown'
    },
    {
      id: 3,
      time: '10:00 AM',
      petName: 'Max',
      ownerName: 'David Lee',
      type: 'Dental',
      vetDoctor: 'Dr. Emily Chen'
    },
    {
      id: 4,
      time: '10:30 AM',
      petName: 'Charlie',
      ownerName: 'Emma Wilson',
      type: 'Surgery',
      vetDoctor: 'Dr. James Rodriguez'
    },
    {
      id: 5,
      time: '11:00 AM',
      petName: 'Bella',
      ownerName: 'Michael Chen',
      type: 'Check-up',
      vetDoctor: 'Dr. Michael Brown'
    },
    {
      id: 6,
      time: '2:00 PM',
      petName: 'Rocky',
      ownerName: 'Lisa Martinez',
      type: 'Vaccination',
      vetDoctor: 'Dr. Emily Chen'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      action: 'New appointment booked',
      details: 'Buddy - Check-up with Dr. Emily Chen',
      time: '5 mins ago'
    },
    {
      id: 2,
      action: 'Appointment completed',
      details: 'Max - Dental cleaning by Dr. Brown',
      time: '15 mins ago'
    },
    {
      id: 3,
      action: 'New patient registered',
      details: 'Luna - Owner: Sarah Johnson',
      time: '30 mins ago'
    },
    {
      id: 4,
      action: 'Appointment rescheduled',
      details: 'Charlie - Surgery moved to 2:00 PM',
      time: '1 hour ago'
    },
    {
      id: 5,
      action: 'Prescription issued',
      details: 'Bella - Medication prescribed',
      time: '2 hours ago'
    },
    {
      id: 6,
      action: 'Lab results uploaded',
      details: 'Rocky - Blood test results available',
      time: '3 hours ago'
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
    <div className="vetadmin-dashboard-container">
      <PawPattern count={35} />

      <div className="vetadmin-main-content">
        {/* Header */}
        <div className="vetadmin-header">
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
                <div className="table-cell">Assigned To</div>
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
                      <span className="vet-name">{appointment.vetDoctor}</span>
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

export default VetAdminDashboard;