//vetadmin-myveterinarians.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, MapPin, Eye, MoreVertical, UserPlus, CheckCircle, Users, Search } from 'lucide-react';
import { Building, Phone, Mail } from 'lucide-react';

import PawPattern from "./components/PawPattern";
import VetAdminNavbar from './components/vetadmin-navbar';
import ProfileNotification from "./components/ProfileNotification";
import './styles/vetadmin-myveterinarians.css';

const VetAdminMyVeterinarians = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [veterinarians, setVeterinarians] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedVet, setSelectedVet] = useState(null);
  const [vaId, setVaId] = useState(null);
  const [clinicInfo, setClinicInfo] = useState({});
  const [userid, setUserid] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedVetForAssignment, setSelectedVetForAssignment] = useState(null);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [selectedVetAppointments, setSelectedVetAppointments] = useState([]);
  const [loadingVetAppointments, setLoadingVetAppointments] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load from sessionStorage
  useEffect(() => {
    const storedName = sessionStorage.getItem('firstName');
    const storedUserId = sessionStorage.getItem('userid');
    
    if (storedName) setFirstName(storedName);
    if (storedUserId) setUserid(storedUserId);
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    licenseNumber: '',
    licensingAuthority: '',
    yearsOfPractice: '',
    specialization: '',
    onDutyToday: 'no'
  });

  // Fetch vet admin info
  useEffect(() => {
    const fetchVetAdminInfo = async () => {
      if (!userid) return;

      try {
        const response = await fetch(`http://localhost:5000/api/profile/${userid}`);
        const data = await response.json();

        if (response.ok) {
          setVaId(data.va_id);
          setClinicInfo({
            vetLocation: data.va_vetLocation,
            clinicName: data.va_clinicName,
            clinicPhone: data.va_clinicPhone,
            clinicEmail: data.va_clinicEmail
          });
        }
      } catch (error) {
        console.error('Error fetching vet admin info:', error);
      }
    };

    fetchVetAdminInfo();
  }, [userid]);

  // Fetch veterinarians
  useEffect(() => {
    if (!vaId) return;

    fetch(`http://localhost:5000/api/veterinarians/${vaId}`)
      .then(res => res.json())
      .then(data => setVeterinarians(data))
      .catch(err => console.error('Error fetching veterinarians:', err));
  }, [vaId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch('http://localhost:5000/api/veterinarians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          va_id: vaId,
          ...clinicInfo
        }),
      });
  
      // ✅ CRITICAL: Parse JSON response BEFORE checking if response.ok
      const data = await response.json();
  
      if (response.ok) {
        alert('Veterinarian registered successfully!');
        setShowModal(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          licenseNumber: '',
          licensingAuthority: '',
          yearsOfPractice: '',
          specialization: '',
          onDutyToday: 'no'
        });
  
        // Refresh list
        const refreshResponse = await fetch(`http://localhost:5000/api/veterinarians/${vaId}`);
        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok) setVeterinarians(refreshData);
      } else {
        // ✅ Now data is already parsed, just use it directly
        console.log('❌ Error response:', data); // Debug log
        if (data.error && data.error.toLowerCase().includes('email')) {
          alert('Email already exists. Please use a different email address.');
        } else {
          alert(data.error || 'Failed to register veterinarian');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while registering the veterinarian. Please try again.');
    }
  };

  const handleDelete = async (vt_id) => {
    if (!window.confirm('Are you sure you want to delete this veterinarian?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/veterinarians/${vt_id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Veterinarian deleted successfully!');
        setVeterinarians(prev => prev.filter(vet => vet.vt_id !== vt_id));
        setOpenMenuId(null);
      } else {
        alert('Failed to delete veterinarian');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Add this function to fetch clinic_id
  const fetchClinicId = async () => {
    if (!vaId) return null;
    
    try {
      const res = await fetch(`http://localhost:5000/api/clinic/${vaId}`);
      const data = await res.json();
      return res.ok ? data.clinic_id : null;
    } catch (error) {
      console.error('Error fetching clinic_id:', error);
      return null;
    }
  };

  // Add this function to handle duty toggle
  const handleToggleDuty = async (vt_id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/veterinarians/${vt_id}/toggle-duty`, {
        method: 'PUT'
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setVeterinarians(prev => 
          prev.map(vet => 
            vet.vt_id === vt_id 
              ? { ...vet, vt_onDutyToday: data.vt_onDutyToday }
              : vet
          )
        );
      } else {
        alert('Failed to update duty status');
      }
    } catch (error) {
      console.error('Error toggling duty:', error);
      alert('An error occurred');
    }
  };

  // Add this function to handle assignment button click
  const handleAssignClick = async (vet) => {
    setSelectedVetForAssignment(vet);
    setLoadingAppointments(true);
    
    const clinic_id = await fetchClinicId();
    if (!clinic_id) {
      alert('Could not fetch clinic information');
      setLoadingAppointments(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/pending-appointments/${clinic_id}`);
      const data = await res.json();
      
      if (res.ok) {
        setPendingAppointments(data);
        setShowAssignModal(true);
      } else {
        alert('Failed to fetch pending appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      alert('An error occurred');
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Add this function to handle assignment submission
  const handleConfirmAssignment = async () => {
    if (!selectedAppointment) {
      alert('Please select an appointment');
      return;
    }

    try {
      const assignVetRes = await fetch(
        `http://localhost:5000/api/patients/${selectedAppointment.pet_id}/assign-vet`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vt_id: selectedVetForAssignment.vt_id })
        }
      );

      if (assignVetRes.ok) {
        alert('Appointment assigned successfully!');
        setShowAssignModal(false);
        setSelectedAppointment(null);
        setSelectedVetForAssignment(null);
        
        // Refresh veterinarians list
        const refreshResponse = await fetch(`http://localhost:5000/api/veterinarians/${vaId}`);
        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok) setVeterinarians(refreshData);
      } else {
        alert('Failed to assign veterinarian');
      }
    } catch (error) {
      console.error('Error assigning vet:', error);
      alert('An error occurred');
    }
  };

  const handleViewAppointments = async (vet) => {
    setSelectedVet(vet);
    setShowAppointmentsModal(true);
    setLoadingVetAppointments(true);
  
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/vet/${vet.vt_id}`);
      const data = await res.json();
      
      if (res.ok) {
        const sortedData = data.sort((a, b) => new Date(b.appt_date) - new Date(a.appt_date));
        setSelectedVetAppointments(sortedData);
      } else {
        alert('Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching vet appointments:', error);
      alert('An error occurred');
    } finally {
      setLoadingVetAppointments(false);
    }
  };

  const handleView = (vet) => {
    setSelectedVet(vet);
    setShowViewModal(true);
    setOpenMenuId(null);
  };

  const toggleMenu = (vt_id) => {
    setOpenMenuId(openMenuId === vt_id ? null : vt_id);
  };

  // Filter veterinarians based on search
  const filteredVeterinarians = veterinarians.filter(vet => {
    if (!searchQuery.trim()) return true;
    
    const search = searchQuery.toLowerCase();
    return (
      vet.usr_firstName?.toLowerCase().includes(search) ||
      vet.usr_lastName?.toLowerCase().includes(search) ||
      vet.vt_specialization?.toLowerCase().includes(search) ||
      vet.usr_email?.toLowerCase().includes(search) ||
      vet.vt_licenseNumber?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="vetadmin-dashboard-container">
      <PawPattern count={35} />
      <VetAdminNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="vetadmin-main-content">
        {/* Header */}
        <div className="vetadmin-header">
          <div className="location-info">
            <MapPin size={20} className="location-icon" />
            <span className="location-text">{clinicInfo.clinicName || 'PawCare Veterinary Clinic'}</span>
          </div>
          <ProfileNotification firstName={firstName} />
        </div>

        {/* Page Title & Action */}
        <div className="myveterinarians-page-header">
          <div>
            <h1 className="myveterinarians-page-title">My Veterinarians</h1>
            <p className="myveterinarians-page-subtitle">Manage your clinic's veterinary team</p>
          </div>
          <button className="myveterinarians-add-button" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            Register New Veterinarian
          </button>
        </div>

        {/* Search Bar */}
        <div className="mypatients-search-section" style={{ marginTop: '1.5rem' }}>
          <div className="mypatients-search-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search veterinarians by name, specialization, or license..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mypatients-search-input"
            />
          </div>
        </div>

        {/* Veterinarians Table */}
        <div className="myveterinarians-table-section">
        {filteredVeterinarians.length === 0 ? (
            searchQuery ? (
              <div className="myveterinarians-empty">
                <h3>No Results Found</h3>
                <p>No veterinarians match your search "{searchQuery}"</p>
              </div>
            ) : (
              <div className="myveterinarians-empty">
                <h3>No Veterinarians Records</h3>
                <p>Start by registering your first veterinarian</p>
              </div>
            )
          ) : (
            <div className="myveterinarians-table">
              <div className="myveterinarians-table-header">
                <div className="table-cell-number">#</div>
                <div className="table-cell-name">Name</div>
                <div className="table-cell-specialization">Specialization</div>
                <div className="table-cell-patients">Appointments Assigned</div>
                <div className="table-cell-duty">On Duty Today</div>
                <div className="table-cell-actions">Actions</div>
              </div>

              <div className="myveterinarians-table-body">
              {filteredVeterinarians.map((vet, index) => (
                <div key={vet.vt_id} className="myveterinarians-table-row">
                  <div className="table-cell-number">{index + 1}</div>
                  <div className="table-cell-name">
                    <strong>Dr. {vet.usr_firstName} {vet.usr_lastName}</strong>
                  </div>
                  <div className="table-cell-specialization">
                    {vet.vt_specialization || 'General Practice'}
                  </div>
                  <div className="table-cell-patients">
                    <button 
                      className={`view-appointments-count-btn ${vet.vt_patientsAssigned > 0 ? 'has-appointments' : 'empty'}`}
                      onClick={() => handleViewAppointments(vet)}
                      disabled={!vet.vt_patientsAssigned || vet.vt_patientsAssigned === 0}
                    >
                      {vet.vt_patientsAssigned || 0}
                    </button>
                  </div>
                  <div className="table-cell-duty">
                    <button
                      className={`duty-badge ${vet.vt_onDutyToday === 'yes' ? 'duty-yes' : 'duty-no'}`}
                      onClick={() => handleToggleDuty(vet.vt_id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {vet.vt_onDutyToday === 'yes' ? 'Yes' : 'No'}
                    </button>
                  </div>
                  <div className="table-cell-actions">
                    {vet.vt_onDutyToday === 'yes' && (
                      <button 
                        className="assign-button"
                        onClick={() => handleAssignClick(vet)}
                      >
                        <UserPlus size={16} />
                        Assign to
                      </button>
                    )}
                    <div className="menu-wrapper">
                      <button 
                        className="menu-button"
                        onClick={() => toggleMenu(vet.vt_id)}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {openMenuId === vet.vt_id && (
                        <div className="menu-dropdown">
                          <button 
                            className="menu-item"
                            onClick={() => handleView(vet)}
                          >
                            <Eye size={16} />
                            View Details
                          </button>
                          <button 
                            className="menu-item delete"
                            onClick={() => handleDelete(vet.vt_id)}
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
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

      {/* Add Veterinarian Modal */}
      {showModal && (
        <div className="myveterinarians-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="myveterinarians-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="myveterinarians-modal-header">
              <h2 className="myveterinarians-modal-title">Register New Veterinarian</h2>
              <button className="myveterinarians-modal-close" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="myveterinarians-modal-form">
              <div className="myveterinarians-form-section">
                  <h3 className="myveterinarians-form-section-title">Personal Information</h3>
                  <div className="myveterinarians-form-row">
                    <div className="myveterinarians-form-group">
                      <label>First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="myveterinarians-form-group">
                      <label>Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                <div className="myveterinarians-form-row">
                  <div className="myveterinarians-form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="myveterinarians-form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="myveterinarians-form-section">
                <h3 className="myveterinarians-form-section-title">Professional Details</h3>
                <div className="myveterinarians-form-row">
                <div className="myveterinarians-form-group">
                    <label>License Number *</label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      pattern="^MY-VET-\d{4}-\d{4}$"
                      title="License number must follow format: MY-VET-YYYY-XXXX (e.g., MY-VET-2022-0147)"
                      placeholder="e.g., MY-VET-2022-0147"
                      required
                    />
                  </div>
                  <div className="myveterinarians-form-group">
                    <label>Licensing Authority *</label>
                    <input
                      type="text"
                      name="licensingAuthority"
                      value={formData.licensingAuthority}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="myveterinarians-form-row">
                    <div className="myveterinarians-form-group">
                        <label>Years of Practice</label>
                        <input
                            type="number"
                            name="yearsOfPractice"
                            value={formData.yearsOfPractice}
                            onChange={handleInputChange}
                            min="0"
                            step="1"
                        />
                        </div>
                        <div className="myveterinarians-form-group">
                        <label>Specialization *</label>
                        <input
                            type="text"
                            name="specialization"
                            value={formData.specialization}
                            onChange={handleInputChange}
                            placeholder="e.g., Surgery, Dentistry"
                            required
                        />
                    </div>
                </div>

                <div className="myveterinarians-form-row">
                  <div className="myveterinarians-form-group">
                    <label>On Duty Today *</label>
                    <select
                      name="onDutyToday"
                      value={formData.onDutyToday}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="myveterinarians-clinic-info">
                <h3 className="myveterinarians-form-section-title">Clinic Information (Auto-filled)</h3>
                <div className="myveterinarians-clinic-grid">
                    <div className="myveterinarians-clinic-item">
                    <Building size={16} />
                    <span><strong>Clinic:</strong> {clinicInfo.clinicName || 'Loading...'}</span>
                    </div>
                    <div className="myveterinarians-clinic-item">
                    <MapPin size={16} />
                    <span><strong>Location:</strong> {clinicInfo.vetLocation || 'Loading...'}</span>
                    </div>
                    <div className="myveterinarians-clinic-item">
                    <Phone size={16} />
                    <span><strong>Phone:</strong> {clinicInfo.clinicPhone || 'Loading...'}</span>
                    </div>
                    <div className="myveterinarians-clinic-item">
                    <Mail size={16} />
                    <span><strong>Email:</strong> {clinicInfo.clinicEmail || 'Loading...'}</span>
                    </div>
                </div>
                </div>

              <div className="myveterinarians-modal-footer">
                <button 
                  type="button" 
                  className="myveterinarians-cancel-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="myveterinarians-submit-button">
                  Register Veterinarian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Veterinarian Modal */}
      {showViewModal && selectedVet && (
        <div className="myveterinarians-modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="myveterinarians-modal-content view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="myveterinarians-modal-header">
              <h2 className="myveterinarians-modal-title">Veterinarian Details</h2>
              <button className="myveterinarians-modal-close" onClick={() => setShowViewModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="view-modal-body">
              <div className="view-section">
                <h3>Personal Information</h3>
                <div className="view-grid">
                  <div className="view-item">
                    <strong>Name:</strong> Dr. {selectedVet.usr_firstName} {selectedVet.usr_lastName}
                  </div>
                  <div className="view-item">
                    <strong>Email:</strong> {selectedVet.usr_email}
                  </div>
                </div>
              </div>

              <div className="view-section">
                <h3>Professional Information</h3>
                <div className="view-grid">
                  <div className="view-item">
                    <strong>License Number:</strong> {selectedVet.vt_licenseNumber}
                  </div>
                  <div className="view-item">
                    <strong>Licensing Authority:</strong> {selectedVet.vt_licensingAuthority}
                  </div>
                  <div className="view-item">
                    <strong>Years of Practice:</strong> {selectedVet.vt_yearsOfPractice} years
                  </div>
                  <div className="view-item">
                    <strong>Specialization:</strong> {selectedVet.vt_specialization || 'General Practice'}
                  </div>
                </div>
              </div>

              <div className="view-section">
                <h3>Work Status</h3>
                <div className="view-grid">
                  <div className="view-item">
                    <strong>Patients Assigned:</strong> {selectedVet.vt_patientsAssigned || 0}
                  </div>
                  <div className="view-item">
                    <strong>On Duty Today:</strong> {selectedVet.vt_onDutyToday === 'yes' ? 'Yes' : 'No'}
                  </div>
                  <div className="view-item">
                    <strong>Joined:</strong> {new Date(selectedVet.vt_createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="view-section">
                <h3>Clinic Information</h3>
                <div className="view-grid">
                  <div className="view-item">
                    <strong>Clinic:</strong> {selectedVet.vt_clinicName}
                  </div>
                  <div className="view-item">
                    <strong>Location:</strong> {selectedVet.vt_vetLocation}
                  </div>
                  <div className="view-item">
                    <strong>Phone:</strong> {selectedVet.vt_clinicPhone}
                  </div>
                  <div className="view-item">
                    <strong>Email:</strong> {selectedVet.vt_clinicEmail}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Assignment Modal */}
      {showAssignModal && selectedVetForAssignment && (
        <div className="myveterinarians-modal-overlay" onClick={() => {
          setShowAssignModal(false);
          setSelectedAppointment(null);
        }}>
          <div className="schedule-approval-modal" onClick={(e) => e.stopPropagation()}>
            <button className="myveterinarians-modal-close" onClick={() => {
              setShowAssignModal(false);
              setSelectedAppointment(null);
            }}>
              <X size={24} />
            </button>

            <div className="schedule-approval-header">
              <UserPlus size={48} />
              <h2>Assign Veterinarian to Appointment</h2>
              <p>Dr. {selectedVetForAssignment.usr_firstName} {selectedVetForAssignment.usr_lastName}</p>
            </div>

            <div className="schedule-approval-body">
            {loadingAppointments ? (
                <div className="schedule-approval-empty">
                  <p>Loading appointments...</p>
                </div>
              ) : pendingAppointments.length === 0 ? (
                <div className="schedule-approval-empty">
                  <p>No pending appointments found</p>
                </div>
              ) : (
                <>
                  <div className="schedule-vet-selection">
                    <label className="schedule-vet-label">
                      <Users size={20} />
                      Select Pending Appointment
                    </label>
                    
                    <div className="schedule-vets-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {pendingAppointments.map((appt) => (
                        <div
                          key={appt.appt_id}
                          className={`schedule-vet-card ${selectedAppointment?.appt_id === appt.appt_id ? 'selected' : ''}`}
                          onClick={() => setSelectedAppointment(appt)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="schedule-vet-info">
                            <div className="schedule-vet-name">
                              {appt.pet_name} ({appt.pet_species})
                            </div>
                            <div className="schedule-vet-specialization">
                              Owner: {appt.owner_firstName} {appt.owner_lastName}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                              Type: {appt.appt_type} | {appt.consultation_type === 'online' ? 'Online' : 'Physical'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                              Date: {new Date(appt.appt_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </div>
                            {appt.appt_description && (
                              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                                {appt.appt_description}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="schedule-approval-actions">
                    <button 
                      className="schedule-approval-cancel"
                      onClick={() => {
                        setShowAssignModal(false);
                        setSelectedAppointment(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="schedule-approval-confirm"
                      onClick={handleConfirmAssignment}
                      disabled={!selectedAppointment}
                    >
                      <CheckCircle size={20} />
                      Confirm Assignment
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Appointments Modal */}
      {showAppointmentsModal && selectedVet && (
        <div className="myveterinarians-modal-overlay" onClick={() => setShowAppointmentsModal(false)}>
          <div className="schedule-approval-modal" onClick={(e) => e.stopPropagation()}>
            <button className="myveterinarians-modal-close" onClick={() => setShowAppointmentsModal(false)}>
              <X size={24} />
            </button>

            <div className="schedule-approval-header">
              <Users size={48} />
              <h2>Appointments Assigned</h2>
              <p>Dr. {selectedVet.usr_firstName} {selectedVet.usr_lastName}</p>
            </div>

            <div className="schedule-approval-body">
              {loadingVetAppointments ? (
                <div className="schedule-approval-empty">
                  <p>Loading appointments...</p>
                </div>
              ) : selectedVetAppointments.length === 0 ? (
                <div className="schedule-approval-empty">
                  <p>No appointments assigned yet</p>
                </div>
              ) : (
                <div className="schedule-vets-list" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {selectedVetAppointments.map((appt) => (
                    <div key={appt.appt_id} className="schedule-vet-card">
                      <div className="schedule-vet-info">
                        <div className="schedule-vet-name">
                          {appt.pet_name} ({appt.pet_species})
                        </div>
                        <div className="schedule-vet-specialization">
                          Owner: {appt.owner_firstName} {appt.owner_lastName}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                          Type: {appt.appt_type} | {appt.consultation_type === 'online' ? 'Online' : 'Physical'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                          Date: {new Date(appt.appt_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </div>
                        {appt.appt_description && (
                          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                            Description: {appt.appt_description}
                          </div>
                        )}
                        <div style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: '700',
                          marginTop: '0.5rem',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '6px',
                          display: 'inline-block',
                          background: appt.appt_status === 'scheduled' ? '#d1fae520' : 
                                    appt.appt_status === 'completed' ? '#dbeafe20' : 
                                    appt.appt_status === 'cancelled' ? '#fee2e220' : '#fef3c720',
                          color: appt.appt_status === 'scheduled' ? '#10b981' : 
                                appt.appt_status === 'completed' ? '#3b82f6' : 
                                appt.appt_status === 'cancelled' ? '#ef4444' : '#f59e0b',
                          border: `2px solid ${
                            appt.appt_status === 'scheduled' ? '#10b98140' : 
                            appt.appt_status === 'completed' ? '#3b82f640' : 
                            appt.appt_status === 'cancelled' ? '#ef444440' : '#f59e0b40'
                          }`
                        }}>
                          Status: {appt.appt_status.charAt(0).toUpperCase() + appt.appt_status.slice(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VetAdminMyVeterinarians;