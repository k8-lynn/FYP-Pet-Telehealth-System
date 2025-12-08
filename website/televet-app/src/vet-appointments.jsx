//vet-appointments.jsx
import React, { useState, useEffect } from 'react';
import { X, MapPin, Eye, MoreVertical, Search } from 'lucide-react';

import PawPattern from "./components/PawPattern";
import VetNavbar from './components/vet-navbar';
import ProfileNotification from "./components/ProfileNotification";
import './styles/vetadmin-mypatients.css';
import './styles/vet-appointments.css';

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
        const response = await fetch(`http://localhost:5000/api/profile/${userid}`);
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
    
    fetch(`http://localhost:5000/api/appointments/vet/${vtId}`)
      .then(res => {
        console.log('📡 Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('📋 Appointments data received:', data);
        console.log('📊 Number of appointments:', data.length);
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
      const response = await fetch(`http://localhost:5000/api/appointments/${appt_id}/status`, {
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

  const getStatusBadgeClass = (status) => {
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

  return (
    <div className="vetadmin-dashboard-container">
      <PawPattern count={35} />
      <VetNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="vetadmin-main-content">
        {/* Header */}
        <div className="vetadmin-header">
          <div className="location-info">
            <MapPin size={20} className="location-icon" />
            <span className="location-text">{clinicInfo.clinicName || 'PawCare Veterinary Clinic'}</span>
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
                {appointments.filter(a => a.appt_status === 'pending').length}
              </span>
              <span className="stat-label">Pending</span>
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
                      <span className={`vet-badge ${getStatusBadgeClass(appointment.appt_status)}`}>
                        {appointment.appt_status}
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
                            {appointment.appt_status !== 'completed' && (
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
        <div className="mypatients-modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="mypatients-modal-content view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mypatients-modal-header">
              <h2 className="mypatients-modal-title">Appointment Details</h2>
              <button className="mypatients-modal-close" onClick={() => setShowViewModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="view-modal-body">
              <div className="view-section">
                <h3>Appointment Information</h3>
                <div className="view-grid">
                  <div className="view-item">
                    <strong>Appointment ID</strong>
                    #{selectedAppointment.appt_id}
                  </div>
                  <div className="view-item">
                    <strong>Date & Time</strong>
                    {formatDate(selectedAppointment.appt_date)}
                  </div>
                  <div className="view-item">
                    <strong>Appointment Type</strong>
                    {selectedAppointment.appt_type}
                  </div>
                  <div className="view-item">
                    <strong>Consultation Type</strong>
                    {selectedAppointment.consultation_type === 'online' ? 'Online' : 'Physical'}
                  </div>
                  <div className="view-item">
                    <strong>Status</strong>
                    <span className={`vet-badge ${getStatusBadgeClass(selectedAppointment.appt_status)}`}>
                      {selectedAppointment.appt_status}
                    </span>
                  </div>
                  <div className="view-item">
                    <strong>Created At</strong>
                    {formatDate(selectedAppointment.created_at)}
                  </div>
                  <div className="view-item full-width">
                    <strong>Description</strong>
                    {selectedAppointment.appt_description || 'No description provided'}
                  </div>
                </div>
              </div>

              <div className="view-section">
                <h3>Pet Information</h3>
                <div className="view-grid">
                  <div className="view-item">
                    <strong>Pet Name</strong>
                    {selectedAppointment.pet_name}
                  </div>
                  <div className="view-item">
                    <strong>Species</strong>
                    {selectedAppointment.pet_species}
                  </div>
                  <div className="view-item">
                    <strong>Breed</strong>
                    {selectedAppointment.pet_breed || 'Not specified'}
                  </div>
                  <div className="view-item">
                    <strong>Age</strong>
                    {selectedAppointment.pet_age} years
                  </div>
                  <div className="view-item">
                    <strong>Gender</strong>
                    {selectedAppointment.pet_gender === 'm' ? 'Male' : 'Female'}
                  </div>
                </div>
              </div>

              <div className="view-section">
                <h3>Owner Information</h3>
                <div className="view-grid">
                  <div className="view-item">
                    <strong>Owner Name</strong>
                    {selectedAppointment.owner_firstName} {selectedAppointment.owner_lastName}
                  </div>
                  <div className="view-item">
                    <strong>Email</strong>
                    {selectedAppointment.owner_email}
                  </div>
                </div>
              </div>

              <div className="view-section">
                <h3>Veterinarian Information</h3>
                <div className="view-grid">
                  <div className="view-item">
                    <strong>Assigned Veterinarian</strong>
                    {selectedAppointment.vet_name ? `Dr. ${selectedAppointment.vet_name}` : 'Not assigned yet'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VetAppointments;