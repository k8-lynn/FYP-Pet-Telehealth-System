//vet-appointments.jsx
import React, { useState, useEffect } from 'react';
import { X, MapPin, Eye, MoreVertical, Search, MessageCircle } from 'lucide-react';

import PawPattern from "./components/PawPattern";
import VetNavbar from './components/vet-navbar';
import ProfileNotification from "./components/ProfileNotification";
import './styles/vetadmin-mypatients.css';
import './styles/vet-appointments.css';
import showStyledAlert from './utils/styledAlert';
import AppointmentDetailsModal from './components/AppointmentDetailsModal';

const VetAppointments = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [vtId, setVtId] = useState(null);
  const [clinicInfo, setClinicInfo] = useState({});
  const [userid, setUserid] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
        const response = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/profile/${userid}`);
        const data = await response.json();

        if (response.ok) {
          setVtId(data.vt_id);
          setClinicInfo({
            vetLocation: data.vt_vetLocation,
            clinicName: data.vt_clinicName,
            clinicPhone: data.vt_clinicPhone,
            clinicEmail: data.vt_clinicEmail
          });
        }
      } catch (error) {
        console.error('Error fetching vet info:', error);
      }
    };

    fetchVetInfo();
  }, [userid]);

  // Fetch appointments assigned to this vet
  useEffect(() => {
    if (!vtId) return;

    console.log('🔍 Fetching appointments for vet:', vtId);
    
    fetch(`https://fyp-pet-telehealth-system.onrender.com/api/appointments/vet/${vtId}`)
      .then(res => {
        console.log('📡 Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('📋 Appointments data received:', data);
        console.log('📊 Number of appointments:', data.length);

        const sortedData = data.sort((a, b) => new Date(b.appt_date) - new Date(a.appt_date));
        setAppointments(sortedData);

        setAppointments(data);
      })
      .catch(err => {
        console.error('❌ Error fetching appointments:', err);
      });
  }, [vtId]);

  const handleView = (appointment) => {
    setSelectedAppointment(appointment);
    setShowViewModal(true);
    setOpenMenuId(null);
  };

  const handleMarkCompleted = async (appt_id) => {
    try {
      const response = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/appointments/${appt_id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
  
      if (response.ok) {
        // Update local state
        setAppointments(prev => 
          prev.map(appt => 
            appt.appt_id === appt_id 
              ? { ...appt, appt_status: 'completed' }
              : appt
          )
        );
        setOpenMenuId(null);
      } else {
        console.error('Failed to update appointment status');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };
  
  const handleRemoveAppointment = async (appt_id) => {
    if (!window.confirm('Are you sure you want to remove this cancelled appointment?')) {
      return;
    }
  
    try {
      const response = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/appointments/${appt_id}`, {
        method: 'DELETE'
      });
  
      if (response.ok) {
        // Remove from local state
        setAppointments(prev => prev.filter(appt => appt.appt_id !== appt_id));
        setOpenMenuId(null);
        showStyledAlert('Appointment removed successfully');
      } else {
        console.error('Failed to remove appointment');
        showStyledAlert('Failed to remove appointment');
      }
    } catch (error) {
      console.error('Error removing appointment:', error);
      showStyledAlert('Failed to remove appointment');
    }
  };
  
  const handleContactPatient = (appointment) => {
    // Navigate to vet-chat with pet_id
    window.location.href = `/vet-chat?pet_id=${appointment.pet_id}`;
    setOpenMenuId(null);
  };

  const handleNavigateToChat = (appointment) => {
    // Navigate to vet-chat with pet_id
    window.location.href = `/vet-chat?pet_id=${appointment.pet_id}`;
  };

  const toggleMenu = (appt_id) => {
    setOpenMenuId(openMenuId === appt_id ? null : appt_id);
  };

  const getAppointmentTypeBadgeClass = (type) => {
    switch (type) {
      case 'Check-up':
        return 'appt-type-checkup';
      case 'Follow-up':
        return 'appt-type-follow-up';
      case 'Behavioral Consultation':
        return 'appt-type-behavioral-consultation';
      case 'Nutrition & Diet':
        return 'appt-type-nutrition-diet';
      case 'Vaccination':
        return 'appt-type-vaccination';
      case 'Dental':
        return 'appt-type-dental';
      case 'Surgery':
        return 'appt-type-surgery';
      case 'Emergency':
        return 'appt-type-emergency';
      default:
        return 'appt-type-checkup';
    }
  };

  const getStatusBadgeClass = (status, reschedFlag) => {
    if (reschedFlag === 'yes') {
      return 'status-reschedule-requested';
    }
    switch (status) {
      case 'scheduled':
        return 'status-scheduled';
      case 'pending':
        return 'status-pending';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Filter appointments based on search
const filteredAppointments = appointments.filter(appointment => {
  if (!searchQuery.trim()) return true;
  
  const search = searchQuery.toLowerCase();
  return (
    appointment.pet_name?.toLowerCase().includes(search) ||
    appointment.pet_species?.toLowerCase().includes(search) ||
    appointment.owner_firstName?.toLowerCase().includes(search) ||
    appointment.owner_lastName?.toLowerCase().includes(search) ||
    appointment.appt_type?.toLowerCase().includes(search) ||
    appointment.appt_description?.toLowerCase().includes(search) ||
    appointment.appt_status?.toLowerCase().includes(search)
  );
});

// Add this function in your parent component
const handleCancelAppointment = async (apptId, cancelReason) => {
  const cancelledBy = 'veterinarian';
  
  try {
    const response = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/appointments/${apptId}/cancel`, {
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
    showStyledAlert('Appointment cancelled successfully');
    
    // Close the modal and refresh appointments
    setShowViewModal(false);
    setSelectedAppointment(null);

    // Refresh appointments for this vet
    if (vtId) {
      const res = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/appointments/vet/${vtId}`);
      const data = await res.json();
      setAppointments(data);
    }
    
    return data;
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    throw error;
  }
};

const handleRescheduleRequest = async (apptId, rescheduleReason) => {
  const requestedBy = 'veterinarian'; // Fixed: this is vet-dashboard
  
  try {
    const response = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/appointments/${apptId}/reschedule-request`, {
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
    showStyledAlert('Reschedule request sent successfully');
    
    // Refresh dashboard data after reschedule request
    if (vtId) {
      const res = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/appointments/vet/${vtId}`);
      const data = await res.json();
      setAppointments(data);
    }
    
    return data;
  } catch (error) {
    console.error('Error requesting reschedule:', error);
    showStyledAlert('Failed to request reschedule');
    throw error;
  }
};

  return (
    <div className="vetadmin-dashboard-container">
      <PawPattern count={35} />
      <VetNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="vetadmin-main-content">
        {/* Header */}
        <div className="vetadmin-header">
          <div className="location-info">
            <MapPin size={20} className="location-icon" />
            <span className="location-text">{clinicInfo.clinicName || 'Clinic'}</span>
          </div>
          <ProfileNotification firstName={firstName} />
        </div>

        {/* Page Title */}
        <div className="mypatients-page-header">
          <div>
            <h1 className="mypatients-page-title">My Appointments</h1>
            <p className="mypatients-page-subtitle">Manage your assigned appointments</p>
          </div>
          <div className="mypatients-stats appointments-stats">
            <div className="stat-card">
              <span className="stat-number">
                {appointments.filter(a => a.appt_status === 'scheduled').length}
              </span>
              <span className="stat-label">Scheduled</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {appointments.filter(a => a.appt_status === 'completed').length}
              </span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mypatients-search-section" style={{ marginTop: '1.5rem' }}>
          <div className="mypatients-search-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search appointments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mypatients-search-input"
            />
          </div>
        </div>

        {/* Appointments Table */}
        <div className="mypatients-table-section appointments-table-section">
        {filteredAppointments.length === 0 ? (
          searchQuery ? (
            <div className="mypatients-empty">
              <h3>No Results Found</h3>
              <p>No appointments match your search "{searchQuery}"</p>
            </div>
          ) : (
            <div className="mypatients-empty">
              <h3>No Appointments</h3>
              <p>Appointments will appear here once they are assigned to you</p>
            </div>
          )
        ) : (
            <div className="mypatients-table">
              <div className="mypatients-table-header appointments-table-header">
                <div className="table-cell-number">#</div>
                <div className="table-cell-pet-name">Pet Name</div>
                <div className="table-cell-species">Species</div>
                <div className="table-cell-owner">Owner</div>
                <div className="table-cell-appt-type">Appointment Type</div>
                <div className="table-cell-consultation">Consultation Type</div>
                <div className="table-cell-description">Description</div>
                <div className="table-cell-date-wide">Date</div>
                <div className="table-cell-vet">Status</div>
                <div className="table-cell-actions">Actions</div>
              </div>

              <div className="mypatients-table-body">
                {filteredAppointments.map((appointment, index) => (
                  <div key={appointment.appt_id} className="mypatients-table-row appointments-table-row">
                    <div className="table-cell-number">{index + 1}</div>
                    <div 
                      className="table-cell-pet-name"
                      onClick={() => handleNavigateToChat(appointment)}
                    >
                      <strong>{appointment.pet_name}</strong>
                    </div>
                    <div className="table-cell-species">
                      {appointment.pet_species}
                    </div>
                    <div className="table-cell-owner">
                      {appointment.owner_firstName} {appointment.owner_lastName}
                    </div>
                    <div className="table-cell-appt-type">
                      <span className={`appt-type-badge ${getAppointmentTypeBadgeClass(appointment.appt_type)}`}>
                        {appointment.appt_type}
                      </span>
                    </div>
                    <div className="table-cell-consultation">
                      <span className={`consultation-badge consultation-${appointment.consultation_type}`}>
                        {appointment.consultation_type === 'online' ? 'Online' : 'Physical'}
                      </span>
                    </div>
                    <div className="table-cell-description">
                      {appointment.appt_description || 'No description'}
                    </div>
                    <div className="table-cell-date-wide">
                      {formatDate(appointment.appt_date)}
                    </div>
                    <div className="table-cell-vet">
                    <span className={`vet-badge ${getStatusBadgeClass(appointment.appt_status, appointment.resched_flag)}`}>
                      {appointment.resched_flag === 'yes' ? 'rescheduled' : appointment.appt_status}
                    </span>
                    </div>
                    <div className="table-cell-actions">
                      <div className="menu-wrapper">
                        <button 
                          className="menu-button"
                          onClick={() => toggleMenu(appointment.appt_id)}
                        >
                          <MoreVertical size={18} />
                        </button>
                        {openMenuId === appointment.appt_id && (
                          <div className="menu-dropdown">
                            <button 
                              className="menu-item"
                              onClick={() => handleView(appointment)}
                            >
                              <Eye size={16} />
                              View Details
                            </button>
                            {appointment.appt_status === 'cancelled' && (
                              <button 
                                className="menu-item"
                                onClick={() => handleRemoveAppointment(appointment.appt_id)}
                              >
                                <svg 
                                  width="16" 
                                  height="16" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2"
                                >
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                Remove
                              </button>
                            )}
                            {appointment.resched_flag === 'yes' && appointment.appt_status !== 'cancelled' && (
                              <button 
                                className="menu-item"
                                onClick={() => handleContactPatient(appointment)}
                              >
                                <MessageCircle size={16} />
                                Contact Patient
                              </button>
                            )}
                            {appointment.appt_status !== 'completed' && 
                            appointment.appt_status !== 'cancelled' && 
                            appointment.resched_flag !== 'yes' && (
                              <button 
                                className="menu-item"
                                onClick={() => handleMarkCompleted(appointment.appt_id)}
                              >
                                <svg 
                                  width="16" 
                                  height="16" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2"
                                >
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Mark as Completed
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Appointment Details Modal */}
      {showViewModal && selectedAppointment && (
        <AppointmentDetailsModal 
          showModal={showViewModal}
          appointmentDetails={selectedAppointment}
          onClose={() => setShowViewModal(false)}
          formatDate={formatDate}
          userRole="vt"
          onContactVet={() => handleNavigateToChat(selectedAppointment)}
          onCancelAppointment={handleCancelAppointment}
          onRescheduleRequest={handleRescheduleRequest}
        />
      )}
    </div>
  );
};

export default VetAppointments;