//vet-mypatients.jsx
import React, { useState, useEffect } from 'react';
import { MapPin, Eye, MoreVertical, Search } from 'lucide-react';

import PawPattern from "./components/PawPattern";
import VetNavbar from './components/vet-navbar';
import ProfileNotification from "./components/ProfileNotification";
import './styles/vetadmin-mypatients.css';
import PatientProfileModal from './components/PatientProfileModal';

const VetMyPatients = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [vtId, setVtId] = useState(null);
  const [clinicInfo, setClinicInfo] = useState({});
  const [userid, setUserid] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHealthModal, setShowHealthModal] = useState(false);

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

  // Fetch patients assigned to this vet
  useEffect(() => {
    if (!vtId) return;

    console.log('🔍 Fetching patients for vet:', vtId);
    
    fetch(`http://localhost:5000/api/patients/vet/${vtId}`)
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
  }, [vtId]);

  const toggleMenu = (pet_id) => {
    setOpenMenuId(openMenuId === pet_id ? null : pet_id);
  };

  const getStatusDisplay = (patient) => {
    // If has appointment and status is scheduled (vet already assigned)
    if (patient.appt_id && patient.appt_status === 'scheduled') {
      return 'assigned';
    }
    
    // If has appointment but status is still pending
    if (patient.appt_id && patient.appt_status === 'pending') {
      return 'pending';
    }
    
    // If no appointment but vet is assigned
    if (patient.vet_name) {
      return 'assigned';
    }
    
    // Default
    return 'assigned';
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

  // Open health records modal
  const handleViewHealthRecords = async (patient) => {
    setSelectedPatient(patient);
    setShowHealthModal(true);
    setOpenMenuId(null);
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
            <span className="location-text">{clinicInfo.clinicName || 'PawCare Veterinary Clinic'}</span>
          </div>
          <ProfileNotification firstName={firstName} />
        </div>

        {/* Page Title */}
        <div className="mypatients-page-header">
          <div>
            <h1 className="mypatients-page-title">My Patients</h1>
            <p className="mypatients-page-subtitle">Manage your assigned registered patients</p>
          </div>
          <div className="mypatients-stats">
            <div className="stat-card">
              <span className="stat-number">
                {patients.filter(p => getStatusDisplay(p) === 'assigned').length}
              </span>
              <span className="stat-label">Assigned</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {patients.filter(p => getStatusDisplay(p) === 'pending').length}
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
                <div className="table-cell-vet">Status</div>
                <div className="table-cell-date">Date Registered</div>
                <div className="table-cell-actions">Actions</div>
              </div>

              <div className="mypatients-table-body">
                {filteredPatients.map((patient, index) => (
                  <div key={patient.pet_id} className="mypatients-table-row">
                    <div className="table-cell-number">{index + 1}</div>
                    <div className="table-cell-mypatients-pet-name">
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
                        getStatusDisplay(patient) === 'assigned' ? 'vet-assigned' : 'vet-pending'
                      }`}>
                        {getStatusDisplay(patient)}
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
                              onClick={() => handleViewHealthRecords(patient)}
                            >
                              <Eye size={16} />
                              View Health Records
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


      {/* Health Records & Tracking Modal */}
      {showHealthModal && selectedPatient && (
        <PatientProfileModal
          petId={selectedPatient.pet_id}
          vtId={vtId}
          onClose={() => setShowHealthModal(false)}
        />
      )}
      
    </div>
  );
};

export default VetMyPatients;