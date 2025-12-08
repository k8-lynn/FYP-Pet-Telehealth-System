//vetadmin-mypatients.jsx
import React, { useState, useEffect } from 'react';
import { Trash2, X, MapPin, Eye, MoreVertical, UserPlus, Search } from 'lucide-react';

import PawPattern from "./components/PawPattern";
import VetAdminNavbar from './components/vetadmin-navbar';
import ProfileNotification from "./components/ProfileNotification";
import './styles/vetadmin-mypatients.css';

const VetAdminMyPatients = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [patients, setPatients] = useState([]);
  const [veterinarians, setVeterinarians] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPetForAssign, setSelectedPetForAssign] = useState(null);
  const [selectedVetId, setSelectedVetId] = useState('');
  const [vaId, setVaId] = useState(null);
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

  // Fetch patients
  useEffect(() => {
    if (!clinicInfo.clinicName) return;

    console.log('🔍 Fetching patients for clinic:', clinicInfo.clinicName);
    
    fetch(`http://localhost:5000/api/patients/clinic/${encodeURIComponent(clinicInfo.clinicName)}`)
      .then(res => {
        console.log('📡 Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('📋 Patients data received:', data);
        console.log('📊 Number of patients:', data.length);
        setPatients(data);
      })
      .catch(err => {
        console.error('❌ Error fetching patients:', err);
      });
  }, [clinicInfo.clinicName]);

  // Fetch veterinarians for assignment
  useEffect(() => {
    if (!vaId) return;

    fetch(`http://localhost:5000/api/veterinarians/${vaId}`)
      .then(res => res.json())
      .then(data => setVeterinarians(data))
      .catch(err => console.error('Error fetching veterinarians:', err));
  }, [vaId]);

  const handleDelete = async (pet_id) => {
    if (!window.confirm('Are you sure you want to remove this patient from your clinic?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/patients/${pet_id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Patient removed successfully!');
        setPatients(prev => prev.filter(patient => patient.pet_id !== pet_id));
        setOpenMenuId(null);
      } else {
        alert('Failed to remove patient');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleView = async (patient) => {
    try {
      const response = await fetch(`http://localhost:5000/api/patients/${patient.pet_id}`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedPatient(data);
        setShowViewModal(true);
        setOpenMenuId(null);
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  const handleAssignClick = (patient) => {
    setSelectedPetForAssign(patient);
    setSelectedVetId('');
    setShowAssignModal(true);
    setOpenMenuId(null);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();

    if (!selectedVetId) {
      alert('Please select a veterinarian');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/patients/${selectedPetForAssign.pet_id}/assign-vet`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vt_id: selectedVetId }),
        }
      );

      if (response.ok) {
        alert('Veterinarian assigned successfully!');
        setShowAssignModal(false);
        
        // Refresh patients list
        const refreshResponse = await fetch(
          `http://localhost:5000/api/patients/clinic/${encodeURIComponent(clinicInfo.clinicName)}`
        );
        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok) setPatients(refreshData);
      } else {
        alert('Failed to assign veterinarian');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleMenu = (pet_id) => {
    setOpenMenuId(openMenuId === pet_id ? null : pet_id);
  };

  const getAssignedVetDisplay = (patient) => {
    // If has appointment but no vet assigned yet
    if (patient.appt_id && patient.appt_status === 'pending' && !patient.vet_name) {
      return 'pending';
    }
    
    // If vet is assigned
    if (patient.vet_name) {
      return `Dr. ${patient.vet_name}`;
    }
    
    // If no appointment at all
    return '-';
  };

  const shouldShowAssignButton = (patient) => {
    // Only show if patient has a pending appointment but no vet assigned
    return patient.appt_id && patient.appt_status === 'pending' && !patient.vet_name;
  };

  // Filter patients based on search
  const filteredPatients = patients.filter(patient => {
    if (!searchQuery.trim()) return true;
    
    const search = searchQuery.toLowerCase();
    return (
      patient.pet_name?.toLowerCase().includes(search) ||
      patient.pet_species?.toLowerCase().includes(search) ||
      patient.pet_breed?.toLowerCase().includes(search) ||
      patient.owner_firstName?.toLowerCase().includes(search) ||
      patient.owner_lastName?.toLowerCase().includes(search) ||
      (patient.vet_name && patient.vet_name.toLowerCase().includes(search))
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

        {/* Page Title */}
        <div className="mypatients-page-header">
          <div>
            <h1 className="mypatients-page-title">My Patients</h1>
            <p className="mypatients-page-subtitle">Manage your clinic's registered patients</p>
          </div>
          <div className="mypatients-stats">
            <div className="stat-card">
              <span className="stat-number">{patients.length}</span>
              <span className="stat-label">Total Patients</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {patients.filter(p => p.vet_name).length}
              </span>
              <span className="stat-label">Assigned</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {patients.filter(p => p.appt_id && p.appt_status === 'pending' && !p.vet_name).length}
              </span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mypatients-search-section" style={{ marginTop: '1.5rem' }}>
          <div className="mypatients-search-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search patients by name, species, breed, or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mypatients-search-input"
            />
          </div>
        </div>

        {/* Patients Table */}
        <div className="mypatients-table-section">
        {filteredPatients.length === 0 ? (
          searchQuery ? (
            <div className="mypatients-empty">
              <h3>No Results Found</h3>
              <p>No patients match your search "{searchQuery}"</p>
            </div>
          ) : (
            <div className="mypatients-empty">
              <h3>No Patient Records</h3>
              <p>Patients will appear here once they register with your clinic</p>
            </div>
          )
        ) : (
            <div className="mypatients-table">
              <div className="mypatients-table-header">
                <div className="table-cell-number">#</div>
                <div className="table-cell-pet-name">Pet Name</div>
                <div className="table-cell-species">Species</div>
                <div className="table-cell-age">Age</div>
                <div className="table-cell-gender">Gender</div>
                <div className="table-cell-owner">Owner</div>
                <div className="table-cell-vet">Assigned Vet</div>
                <div className="table-cell-date">Date Registered</div>
                <div className="table-cell-actions">Actions</div>
              </div>

              <div className="mypatients-table-body">
                {filteredPatients.map((patient, index) => (
                  <div key={patient.pet_id} className="mypatients-table-row">
                    <div className="table-cell-number">{index + 1}</div>
                    <div className="table-cell-pet-name">
                      <strong>{patient.pet_name}</strong>
                    </div>
                    <div className="table-cell-species">
                      {patient.pet_species}
                    </div>
                    <div className="table-cell-age">
                      {patient.pet_age} {patient.pet_age === 1 ? 'yr' : 'yrs'}
                    </div>
                    <div className="table-cell-gender">
                      <span className={`gender-badge gender-${patient.pet_gender}`}>
                        {patient.pet_gender === 'm' ? 'M' : 'F'}
                      </span>
                    </div>
                    <div className="table-cell-owner">
                      {patient.owner_firstName} {patient.owner_lastName}
                    </div>
                    <div className="table-cell-vet">
                    <span className={`vet-badge ${
                          patient.appt_id && patient.appt_status === 'pending' && !patient.vet_name 
                            ? 'vet-pending' 
                            : patient.vet_name 
                            ? 'vet-assigned' 
                            : 'vet-none'
                        }`}>
                        {getAssignedVetDisplay(patient)}
                      </span>
                    </div>
                    <div className="table-cell-date">
                      {new Date(patient.pp_createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="table-cell-actions">
                      {shouldShowAssignButton(patient) && (
                        <button 
                          className="assign-button"
                          onClick={() => handleAssignClick(patient)}
                        >
                          <UserPlus size={16} />
                          Assign to
                        </button>
                      )}
                      <div className="menu-wrapper">
                        <button 
                          className="menu-button"
                          onClick={() => toggleMenu(patient.pet_id)}
                        >
                          <MoreVertical size={18} />
                        </button>
                        {openMenuId === patient.pet_id && (
                          <div className="menu-dropdown">
                            <button 
                              className="menu-item"
                              onClick={() => handleView(patient)}
                            >
                              <Eye size={16} />
                              View Details
                            </button>
                            <button 
                              className="menu-item delete"
                              onClick={() => handleDelete(patient.pet_id)}
                            >
                              <Trash2 size={16} />
                              Remove
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

      {/* Assign Veterinarian Modal */}
      {showAssignModal && selectedPetForAssign && (
        <div className="mypatients-modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="mypatients-modal-content assign-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mypatients-modal-header">
              <h2 className="mypatients-modal-title">Assign Veterinarian</h2>
              <button className="mypatients-modal-close" onClick={() => setShowAssignModal(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="mypatients-modal-form">
              <div className="assign-info">
                <p><strong>Patient:</strong> {selectedPetForAssign.pet_name}</p>
                <p><strong>Owner:</strong> {selectedPetForAssign.owner_firstName} {selectedPetForAssign.owner_lastName}</p>
              </div>

              <div className="mypatients-form-group">
                <label>Select Veterinarian *</label>
                <select
                  value={selectedVetId}
                  onChange={(e) => setSelectedVetId(e.target.value)}
                  required
                >
                  <option value="">-- Choose a veterinarian --</option>
                  {veterinarians.map(vet => (
                    <option key={vet.vt_id} value={vet.vt_id}>
                      Dr. {vet.usr_firstName} {vet.usr_lastName} 
                      {vet.vt_specialization && ` - ${vet.vt_specialization}`}
                      {vet.vt_onDutyToday === 'yes' && ' (On Duty)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mypatients-modal-footer">
                <button 
                  type="button" 
                  className="mypatients-cancel-button"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="mypatients-submit-button">
                  Assign Veterinarian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Patient Details Modal */}
      {showViewModal && selectedPatient && (
        <div className="mypatients-modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="mypatients-modal-content view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mypatients-modal-header">
              <h2 className="mypatients-modal-title">Patient Details</h2>
              <button className="mypatients-modal-close" onClick={() => setShowViewModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="view-modal-body">
              <div className="view-section">
                <h3>Pet Information</h3>
                <div className="view-grid">
                  <div className="view-item">
                    <strong>Pet Name</strong>
                    {selectedPatient.pet_name}
                  </div>
                  <div className="view-item">
                    <strong>Species</strong>
                    {selectedPatient.pet_species}
                  </div>
                  <div className="view-item">
                    <strong>Breed</strong>
                    {selectedPatient.pet_breed || 'Not specified'}
                  </div>
                  <div className="view-item">
                    <strong>Age</strong>
                    {selectedPatient.pet_age} years
                  </div>
                  <div className="view-item">
                    <strong>Gender</strong>
                    {selectedPatient.pet_gender === 'm' ? 'Male' : 'Female'}
                  </div>
                  <div className="view-item">
                    <strong>Weight</strong>
                    {selectedPatient.pet_weight ? `${selectedPatient.pet_weight} kg` : 'Not specified'}
                  </div>
                </div>
              </div>

              <div className="view-section">
                <h3>Medical Information</h3>
                <div className="view-grid">
                  <div className="view-item">
                    <strong>Vaccination</strong>
                    {selectedPatient.pet_hasVaccination === 'yes' ? (
                      <>Yes {selectedPatient.pet_vaccinationDate && 
                        `(${new Date(selectedPatient.pet_vaccinationDate).toLocaleDateString()})`}</>
                    ) : 'No'}
                  </div>
                  <div className="view-item">
                    <strong>Medication</strong>
                    {selectedPatient.pet_hasMedication === 'yes' ? 'Yes' : 'No'}
                  </div>
                  {selectedPatient.pet_hasMedication === 'yes' && (
                    <div className="view-item full-width">
                      <strong>Medication Details</strong>
                      {selectedPatient.pet_medicationDetails || 'Not specified'}
                    </div>
                  )}
                  <div className="view-item">
                    <strong>Allergies</strong>
                    {selectedPatient.pet_hasAllergies === 'yes' ? 'Yes' : 'No'}
                  </div>
                  {selectedPatient.pet_hasAllergies === 'yes' && (
                    <div className="view-item full-width">
                      <strong>Allergy Details</strong>
                      {selectedPatient.pet_allergyDetails || 'Not specified'}
                    </div>
                  )}
                </div>
              </div>

              <div className="view-section">
                <h3>Diet & Behavior</h3>
                <div className="view-grid">
                  <div className="view-item full-width">
                    <strong>Diet Type</strong>
                    {selectedPatient.pet_dietType || 'Not specified'}
                  </div>
                  <div className="view-item full-width">
                    <strong>Behavioral Notes</strong>
                    {selectedPatient.pet_behavioralNotes || 'No notes recorded'}
                  </div>
                </div>
              </div>

              <div className="view-section">
                <h3>Owner Information</h3>
                <div className="view-grid">
                  <div className="view-item">
                    <strong>Owner Name</strong>
                    {selectedPatient.owner_firstName} {selectedPatient.owner_lastName}
                  </div>
                  <div className="view-item">
                    <strong>Email</strong>
                    {selectedPatient.owner_email}
                  </div>
                </div>
              </div>

              <div className="view-section">
                <h3>Assignment Information</h3>
                <div className="view-grid">
                  <div className="view-item">
                    <strong>Assigned Veterinarian</strong>
                    {selectedPatient.vet_name ? `Dr. ${selectedPatient.vet_name}` : 'Not assigned yet'}
                  </div>
                  <div className="view-item">
                    <strong>Date Registered</strong>
                    {new Date(selectedPatient.pp_createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
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

export default VetAdminMyPatients;