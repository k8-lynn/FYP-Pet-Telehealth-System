import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, MapPin, Eye, MoreVertical, UserPlus } from 'lucide-react';
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
        alert(data.error || 'Failed to register veterinarian');
      }
    } catch (error) {
      console.error('Error:', error);
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

  const handleView = (vet) => {
    setSelectedVet(vet);
    setShowViewModal(true);
    setOpenMenuId(null);
  };

  const toggleMenu = (vt_id) => {
    setOpenMenuId(openMenuId === vt_id ? null : vt_id);
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

        {/* Veterinarians Table */}
        <div className="myveterinarians-table-section">
          {veterinarians.length === 0 ? (
            <div className="myveterinarians-empty">
              <h3>No Veterinarians Records</h3>
              <p>Start by registering your first veterinarian</p>
            </div>
          ) : (
            <div className="myveterinarians-table">
              <div className="myveterinarians-table-header">
                <div className="table-cell-number">#</div>
                <div className="table-cell-name">Name</div>
                <div className="table-cell-specialization">Specialization</div>
                <div className="table-cell-patients">Patients Assigned</div>
                <div className="table-cell-duty">On Duty Today</div>
                <div className="table-cell-actions">Actions</div>
              </div>

              <div className="myveterinarians-table-body">
                {veterinarians.map((vet, index) => (
                  <div key={vet.vt_id} className="myveterinarians-table-row">
                    <div className="table-cell-number">{index + 1}</div>
                    <div className="table-cell-name">
                      <strong>Dr. {vet.usr_firstName} {vet.usr_lastName}</strong>
                    </div>
                    <div className="table-cell-specialization">
                      {vet.vt_specialization || 'General Practice'}
                    </div>
                    <div className="table-cell-patients">
                      {vet.vt_patientsAssigned || 0}
                    </div>
                    <div className="table-cell-duty">
                      <span className={`duty-badge ${vet.vt_onDutyToday === 'yes' ? 'duty-yes' : 'duty-no'}`}>
                        {vet.vt_onDutyToday === 'yes' ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="table-cell-actions">
                      <button className="assign-button">
                        <UserPlus size={16} />
                        Assign to
                      </button>
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
                    <label>Years of Practice</label>
                    <input
                        type="number"
                        name="yearsOfPractice"
                        value={formData.yearsOfPractice}
                        onChange={handleInputChange}
                        min="0"
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
    </div>
  );
};

export default VetAdminMyVeterinarians;