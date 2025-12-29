//vet-dashboard.jsx
import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, MessageCircle, Eye } from 'lucide-react';
import PawPattern from "./components/PawPattern";
import VetNavbar from './components/vet-navbar';
import ProfileNotification from "./components/ProfileNotification";
import './styles/vet-dashboard.css';
import AppointmentDetailsModal from './components/AppointmentDetailsModal';

const VetDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [userid, setUserid] = useState(null);
  const [vt_id, setVtId] = useState(null);
  const [clinicInfo, setClinicInfo] = useState(null);
  const [clinicId, setClinicId] = useState(null);

  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    totalPatients: 0,
    unreadMessages: 0
  });
  
  const [todaysAppointments, setTodaysAppointments] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [loadingAppointment, setLoadingAppointment] = useState(false);

  // Load from sessionStorage
  useEffect(() => {
    const storedName = sessionStorage.getItem('firstName');
    const storedUserId = sessionStorage.getItem('userid');
    
    if (storedName) setFirstName(storedName);
    if (storedUserId) setUserid(storedUserId);
  }, []);

  // Fetch vet info
  useEffect(() => {
    const fetchVetInfo = async () => {
      if (!userid) return;

      try {
        console.log('🔍 Fetching vet profile for userid:', userid);
        const response = await fetch(`http://localhost:5000/api/profile/${userid}`);
        const data = await response.json();

        if (response.ok) {
          console.log('✅ Vet data:', data);
          setVtId(data.vt_id);
          setClinicInfo({
            vetLocation: data.vt_vetLocation,
            clinicName: data.vt_clinicName,
            clinicPhone: data.vt_clinicPhone,
            clinicEmail: data.vt_clinicEmail
          });
        }
      } catch (error) {
        console.error('❌ Error fetching vet info:', error);
      }
    };

    fetchVetInfo();
  }, [userid]);

  // Fetch clinic_id using vt_id
  useEffect(() => {
    const fetchClinicId = async () => {
      if (!vt_id) return;

      try {
        console.log('🔍 Fetching clinic_id for vt_id:', vt_id);
        const response = await fetch(`http://localhost:5000/api/clinic-by-vet/${vt_id}`);
        const data = await response.json();

        if (response.ok) {
          console.log('✅ Clinic data:', data);
          setClinicId(data.clinic_id);
        }
      } catch (error) {
        console.error('❌ Error fetching clinic_id:', error);
      }
    };

    fetchClinicId();
  }, [vt_id]);

  // Fetch dashboard data when we have all required IDs
  useEffect(() => {
    if (!vt_id || !clinicId) return;

    console.log('📊 Fetching dashboard data with:', { vt_id, clinicId });
    fetchDashboardData();
  }, [vt_id, clinicId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching data for vet:', vt_id);

      // 1. Fetch appointments for this vet
      console.log('📅 Fetching appointments for vt_id:', vt_id);
      const appointmentsRes = await fetch(`http://localhost:5000/api/appointments/vet/${vt_id}`);
      const appointments = await appointmentsRes.json();
      console.log('✅ All appointments:', appointments);

      // Filter today's appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayAppts = appointments.filter(appt => {
        const apptDate = new Date(appt.appt_date);
        return apptDate >= today && apptDate < tomorrow && appt.appt_status !== 'cancelled';
      }).sort((a, b) => new Date(a.appt_date) - new Date(b.appt_date));
      console.log('✅ Today\'s appointments:', todayAppts);
      setTodaysAppointments(todayAppts);

      // Count upcoming appointments (scheduled AND pending, not cancelled/completed)
      const upcomingCount = appointments.filter(appt => {
        const apptDate = new Date(appt.appt_date);
        apptDate.setHours(0, 0, 0, 0);
        return apptDate >= today && (appt.appt_status === 'scheduled' || appt.appt_status === 'pending');
      }).length;
      console.log('✅ Upcoming appointments count:', upcomingCount);

      // 2. Count unread messages
      console.log('💬 Fetching unread messages for vt_id:', vt_id);
      const unreadRes = await fetch(`http://localhost:5000/api/vet-unread-messages/${vt_id}`);
      const unreadData = await unreadRes.json();
      const unreadCount = unreadData.unread_count || 0;
      console.log('✅ Unread messages count:', unreadCount);

      // 3. Fetch patients assigned to this vet
      console.log('👥 Fetching patients for vt_id:', vt_id);
      const patientsRes = await fetch(`http://localhost:5000/api/patients/vet/${vt_id}`);
      const patients = await patientsRes.json();
      console.log('✅ Patients:', patients);

      setStats({
        upcomingAppointments: upcomingCount,
        totalPatients: patients.length,
        unreadMessages: unreadCount
      });

      // 4. Generate recent activities
      const recentAppts = appointments
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6)
      .map(appt => {
        let action = '';
        let details = '';
        
        // Handle all possible statuses
        if (appt.appt_status === 'scheduled') {
          action = 'Appointment scheduled';
          details = `${appt.pet_name} - ${appt.appt_type}`;
        } else if (appt.appt_status === 'completed') {
          action = 'Appointment completed';
          details = `${appt.pet_name} - ${appt.appt_type}`;
        } else if (appt.appt_status === 'pending') {
          action = 'New appointment request';
          details = `${appt.pet_name} - ${appt.appt_type}`;
        } else if (appt.appt_status === 'cancelled') {
          action = 'Appointment cancelled';
          details = `${appt.pet_name} - ${appt.appt_type}`;
        } else {
          // Fallback for any other status
          action = `Appointment ${appt.appt_status}`;
          details = `${appt.pet_name} - ${appt.appt_type}`;
        }

        const timeDiff = Date.now() - new Date(appt.created_at).getTime();
        const minutes = Math.floor(timeDiff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        let timeText = '';
        if (days > 0) timeText = `${days} day${days > 1 ? 's' : ''} ago`;
        else if (hours > 0) timeText = `${hours} hour${hours > 1 ? 's' : ''} ago`;
        else if (minutes > 0) timeText = `${minutes} min${minutes > 1 ? 's' : ''} ago`;
        else timeText = 'Just now';

        return {
          id: appt.appt_id,
          action,
          details,
          time: timeText
        };
      })
      .filter(activity => activity.action && activity.details); // Filter out empty activities

      console.log('✅ Recent activities generated:', recentAppts);
      setRecentActivities(recentAppts);

      console.log('✅ Stats set:', {
        upcomingAppointments: upcomingCount,
        totalPatients: patients.length,
        unreadMessages: unreadCount
      });

    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      id: 1,
      title: 'Upcoming Appointments',
      value: (stats?.upcomingAppointments ?? 0).toString(),
      subtitle: 'Scheduled',
      icon: Calendar,
      color: '#a8ceff'
    },
    {
      id: 2,
      title: 'Total Patients',
      value: (stats?.totalPatients ?? 0).toString(),
      subtitle: 'Assigned to you',
      icon: Users,
      color: '#91befe'
    },
    {
      id: 3,
      title: 'Unread Messages',
      value: (stats?.unreadMessages ?? 0).toString(),
      subtitle: 'From patients',
      icon: MessageCircle,
      color: '#ffd666'
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

  const formatAppointmentTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
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

  const fetchAppointmentDetails = async (appt_id, showModal = false) => {
    try {
      setLoadingAppointment(true);
      const response = await fetch(`http://localhost:5000/api/appointment-details/${appt_id}`);
      
      if (response.status === 404) {
        console.log('Appointment not found');
        setAppointmentDetails(null);
        setLoadingAppointment(false);
        if (showModal) {
          alert('Appointment not found');
        }
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAppointmentDetails(data);
      if (showModal) {
        setShowAppointmentModal(true);
      }
      setLoadingAppointment(false);
    } catch (error) {
      console.error('❌ Error fetching appointment:', error);
      setAppointmentDetails(null);
      setLoadingAppointment(false);
      if (showModal) {
        alert('Failed to fetch appointment details');
      }
    }
  };

  // Add this function in your parent component
  const handleCancelAppointment = async (apptId, cancelReason) => {
    const cancelledBy = 'veterinarian';
    
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

const handleRescheduleRequest = async (apptId, rescheduleReason) => {
  const requestedBy = 'veterinarian'; // Fixed: hardcode it since this is petowner-chat
  
  try {
    const response = await fetch(`http://localhost:5000/api/appointments/${apptId}/reschedule-request`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rescheduleReason,
        requestedBy: requestedBy
      })
    });

    if (!response.ok) {
      throw new Error('Failed to request reschedule');
    }

    const data = await response.json();
    alert('Reschedule request sent successfully');
    
    // Refresh appointment details
    if (currentChat?.petData?.pet_id) {
      fetchAppointmentDetails(currentChat.petData.pet_id);
    }
    
    return data;
  } catch (error) {
    console.error('Error requesting reschedule:', error);
    throw error;
  }
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
            <span className="location-text">{clinicInfo?.clinicName || 'Loading...'}</span>
          </div>
          <ProfileNotification firstName={firstName} />
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {statsData.map(stat => (
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

            {loading ? (
              <div className="empty-state">
                <p>Loading appointments...</p>
              </div>
            ) : todaysAppointments.length === 0 ? (
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
                  <div className="table-cell">Status</div>
                  <div className="table-cell">Action</div>
                </div>

                <div className="table-body">
                  {todaysAppointments.map(appointment => (
                    <div key={appointment.appt_id} className="table-row">
                      <div className="table-cell">
                        <span className="appointment-time">{formatAppointmentTime(appointment.appt_date)}</span>
                      </div>
                      <div className="table-cell">
                        <span className="pet-name-table">{appointment.pet_name}</span>
                      </div>
                      <div className="table-cell">
                        <span className="owner-name">{appointment.owner_firstName} {appointment.owner_lastName}</span>
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
                        <span className={`status-badge ${appointment.resched_flag === 'yes' ? 'status-rescheduled' : ''}`}>
                          {appointment.resched_flag === 'yes' ? 'rescheduled' : appointment.appt_status}
                        </span>
                      </div>
                      <div className="table-cell">
                        <button 
                          className="view-button"
                          onClick={() => fetchAppointmentDetails(appointment.appt_id, true)}
                          disabled={loadingAppointment}
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

            {loading ? (
              <div className="empty-state">
                <p>Loading activities...</p>
              </div>
            ) : recentActivities.length === 0 ? (
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

      <AppointmentDetailsModal 
        showModal={showAppointmentModal}
        appointmentDetails={appointmentDetails}
        onClose={() => setShowAppointmentModal(false)}
        formatDate={formatDate}
        userRole="vt"
        onCancelAppointment={handleCancelAppointment}  // Add this
        onRescheduleRequest={handleRescheduleRequest}  // Add this
      />
    </div>
  );
};

export default VetDashboard;