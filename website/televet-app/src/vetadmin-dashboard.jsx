import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Calendar, Users, Stethoscope, Clock, Eye } from 'lucide-react';
import PawPattern from "./components/PawPattern";
import VetAdminNavbar from './components/vetadmin-navbar';
import ProfileNotification from "./components/ProfileNotification";
import AppointmentDetailsModal from './components/AppointmentDetailsModal';
import './styles/vetadmin-dashboard.css';
import axios from 'axios';

const VetAdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [clinicId, setClinicId] = useState(null);
  const [vaId, setVaId] = useState(null);
  const [clinicInfo, setClinicInfo] = useState(null);
  
  // Stats state
  const [appointmentCounts, setAppointmentCounts] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  });
  const [totalPatients, setTotalPatients] = useState(0);
  const [activeVets, setActiveVets] = useState(0);
  const [pendingAppointments, setPendingAppointments] = useState(0);
  
  // Data state
  const [todaysAppointments, setTodaysAppointments] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const generateRecentActivities = useCallback((appointments) => {
    const activities = [];
    const sortedAppointments = [...appointments].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );

    sortedAppointments.slice(0, 6).forEach(appt => {
      let action = '';
      let details = `${appt.pet_name} - ${appt.appt_type}`;
      
      if (appt.vet_name) {
        details += ` with ${appt.vet_name}`;
      }

      switch (appt.appt_status) {
        case 'pending':
          action = 'New appointment booked';
          break;
        case 'scheduled':
          action = 'Appointment scheduled';
          break;
        case 'completed':
          action = 'Appointment completed';
          break;
        case 'cancelled':
          action = 'Appointment cancelled';
          break;
        default:
          action = 'Appointment updated';
      }

      const time = getTimeAgo(new Date(appt.created_at));

      activities.push({
        id: appt.appt_id,
        action,
        details,
        time
      });
    });

    setRecentActivities(activities);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!clinicId || !vaId) return;

    try {
      // Fetch appointment counts
      const countsResponse = await axios.get(`http://localhost:5000/api/clinic-appointments-count/${clinicId}`);
      setAppointmentCounts(countsResponse.data);

      // Fetch all appointments for clinic
      const appointmentsResponse = await axios.get(`http://localhost:5000/api/appointments/clinic/${clinicId}`);
      const allAppointments = appointmentsResponse.data;

      // Filter today's appointments
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const todayAppts = allAppointments.filter(appt => {
        const apptDate = new Date(appt.appt_date).toISOString().split('T')[0];
        return apptDate === todayStr && appt.appt_status === 'scheduled';
      });
      setTodaysAppointments(todayAppts);

      // Count pending appointments
      const pending = allAppointments.filter(appt => appt.appt_status === 'pending').length;
      setPendingAppointments(pending);

      // Fetch patients count
      if (clinicInfo && clinicInfo.clinic_name) {
        const patientsResponse = await axios.get(
          `http://localhost:5000/api/patients/clinic/${encodeURIComponent(clinicInfo.clinic_name)}`
        );
        setTotalPatients(patientsResponse.data.length);
        
        console.log('✅ Patients count:', patientsResponse.data.length);
      }

      // Fetch veterinarians
      const vetsResponse = await axios.get(`http://localhost:5000/api/veterinarians/${vaId}`);
      const onDutyVets = vetsResponse.data.filter(vet => vet.vt_onDutyToday === 'yes').length;
      setActiveVets(onDutyVets);

      // Generate recent activities from appointments
      generateRecentActivities(allAppointments);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, [clinicId, vaId, clinicInfo, generateRecentActivities]);

  const fetchClinicData = useCallback(async (vaId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/clinic/${vaId}`);
      const clinicData = response.data;
      
      setClinicId(clinicData.clinic_id);
      console.log('✅ Clinic ID set:', clinicData.clinic_id);
    } catch (error) {
      console.error('❌ Error fetching clinic data:', error);
    }
  }, []);

  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/profile/${userId}`);
      const userData = response.data;
      
      console.log('✅ User profile data:', userData);
      
      if (userData.va_id) {
        setVaId(userData.va_id);
        setClinicInfo({
          clinic_name: userData.va_clinicName,
          clinic_location: userData.va_vetLocation,
          clinic_phone: userData.va_clinicPhone,
          clinic_email: userData.va_clinicEmail
        });
        
        // Fetch full clinic data with clinic_id
        fetchClinicData(userData.va_id);
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
    }
  }, [fetchClinicData]);

  useEffect(() => {
    const storedName = sessionStorage.getItem('firstName');
    const storedUserId = sessionStorage.getItem('userid');
    const storedVaId = sessionStorage.getItem('va_id');
    
    if (storedName) setFirstName(storedName);
    
    if (storedVaId) {
      setVaId(storedVaId);
      fetchClinicData(storedVaId);
    } else if (storedUserId) {
      fetchUserProfile(storedUserId);
    }
  }, [fetchUserProfile, fetchClinicData]);

  useEffect(() => {
    if (clinicId) {
      fetchDashboardData();
    }
  }, [clinicId, fetchDashboardData]);

  useEffect(() => {
    console.log('📊 State update:', {
      vaId,
      clinicId,
      clinicInfo,
      appointmentCounts,
      totalPatients,
      activeVets
    });
  }, [vaId, clinicId, clinicInfo, appointmentCounts, totalPatients, activeVets]);

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return `${diff} secs ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  const stats = [
    {
      id: 1,
      title: 'Today\'s Appointments',
      value: appointmentCounts.today.toString(),
      subtitle: 'Scheduled for today',
      icon: Calendar,
      color: '#a8ceff'
    },
    {
      id: 2,
      title: 'All Patients',
      value: totalPatients.toString(),
      subtitle: 'Total registered',
      icon: Users,
      color: '#91befe'
    },
    {
      id: 3,
      title: 'Active Veterinarians',
      value: activeVets.toString(),
      subtitle: 'On duty today',
      icon: Stethoscope,
      color: '#ffd666'
    },
    {
      id: 4,
      title: 'Pending Requests',
      value: pendingAppointments.toString(),
      subtitle: 'Awaiting approval',
      icon: Clock,
      color: '#ffb088'
    }
  ];

  const getTypeColor = (type) => {
    const colors = {
      'Check-up': '#a8ceff',
      'Follow-up': '#91befe',
      'Behavioral Consultation': '#ffd666',
      'Nutrition & Diet': '#a8e6cf',
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
      <VetAdminNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="vetadmin-main-content">
        {/* Header */}
        <div className="vetadmin-header">
          <div className="location-info">
            <MapPin size={20} className="location-icon" />
            <span className="location-text">
              {clinicInfo ? clinicInfo.clinic_name : 'Loading...'}
            </span>
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

            {todaysAppointments.length === 0 ? (
              <div className="empty-state">
                <p>No appointments scheduled for today</p>
              </div>
            ) : (
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
                    <div key={appointment.appt_id} className="table-row">
                      <div className="table-cell">
                        <span className="appointment-time">{formatTime(appointment.appt_date)}</span>
                      </div>
                      <div className="table-cell">
                        <span className="pet-name">{appointment.pet_name}</span>
                      </div>
                      <div className="table-cell">
                        <span className="owner-name">
                          {appointment.owner_firstName} {appointment.owner_lastName}
                        </span>
                      </div>
                      <div className="table-cell">
                        <span 
                          className="appointment-type"
                          style={{ 
                            background: `${getTypeColor(appointment.appt_type)}20`,
                            color: getTypeColor(appointment.appt_type),
                            border: `2px solid ${getTypeColor(appointment.appt_type)}40`
                          }}
                        >
                          {appointment.appt_type}
                        </span>
                      </div>
                      <div className="table-cell">
                        <span className="vet-name">
                          {appointment.vet_name || 'Not assigned'}
                        </span>
                      </div>
                      <div className="table-cell">
                        <button 
                          className="view-button"
                          onClick={() => handleViewAppointment(appointment)}
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="activity-section">
            <div className="section-header">
              <h3 className="section-title">Recent Activity</h3>
            </div>

            {recentActivities.length === 0 ? (
              <div className="empty-state">
                <p>No recent activities</p>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        showModal={showModal}
        appointmentDetails={selectedAppointment}
        onClose={() => setShowModal(false)}
        formatDate={formatDate}
        userRole="vetAdmin"
      />
    </div>
  );
};

export default VetAdminDashboard;