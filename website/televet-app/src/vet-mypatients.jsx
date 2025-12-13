//vet-mypatients.jsx
import React, { useState, useEffect } from 'react';
import { Trash2, X, MapPin, Eye, MoreVertical, Search, Activity, FileText, Plus, Scale, ChevronDown, Syringe, AlertCircle, Pill, Scissors } from 'lucide-react';

import PawPattern from "./components/PawPattern";
import VetNavbar from './components/vet-navbar';
import ProfileNotification from "./components/ProfileNotification";
import './styles/vetadmin-mypatients.css';
import PatientProfileModal from './components/PatientProfileModal';

const VetMyPatients = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [patients, setPatients] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [vtId, setVtId] = useState(null);
  const [clinicInfo, setClinicInfo] = useState({});
  const [userid, setUserid] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthRecordsData, setHealthRecordsData] = useState({
    examinations: [],
    documents: [],
    vaccinations: [],
    conditions: [],
    currentMedications: [],
    surgeries: []
  });
  const [trackingData, setTrackingData] = useState({
    weightLog: [],
    activityLog: [],
    symptomLog: [],
    behaviorLog: []
  });
  const [activeHealthTab, setActiveHealthTab] = useState('records'); // 'records' or 'tracking'
  const [activeHealthView, setActiveHealthView] = useState(null);
  const [activeTrackingView, setActiveTrackingView] = useState(null);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [addRecordType, setAddRecordType] = useState(null); // 'examination', 'vaccination', etc.
  const [examinations, setExaminations] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState({
    documents: [],
    vaccinations: [],
    conditions: [],
    currentMedications: [],
    surgeries: []
  });
  const [expandedExam, setExpandedExam] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingModalType, setTrackingModalType] = useState(null);
  const [newTrackingEntry, setNewTrackingEntry] = useState({
    date: '',
    weight: '',
    notes: '',
    activityType: '',
    duration: '',
    symptomTitle: '',
    symptomDescription: '',
    behaviorType: '',
    behaviorNote: ''
  });

  const [newRecordData, setNewRecordData] = useState({
    // Vaccination
    vac_name: '',
    vac_date: '',
    next_date: '',
    vac_notes: '',
    
    // Document
    doc_title: '',
    doc_type: 'report',
    file_url: '',
    
    // Condition
    cond_name: '',
    diag_date: '',
    status: 'active',
    cond_notes: '',
    
    // Surgery
    surg_name: '',
    surg_date: '',
    surg_notes: '',
    complications: ''
  });
  const [showAddTreatmentModal, setShowAddTreatmentModal] = useState(false);
  const [showAddPrescriptionModal, setShowAddPrescriptionModal] = useState(false);
  const [selectedApptId, setSelectedApptId] = useState(null);
  const [newTreatment, setNewTreatment] = useState({
    type: '',
    dose: '',
    frequency: '',
    duration: '',
    notes: ''
  });
  const [newPrescription, setNewPrescription] = useState({
    medication: '',
    dose: '',
    frequency: '',
    duration: '',
    instructions: '',
    start_date: '',
    end_date: ''
  });

  const handleOpenAddTreatmentModal = (apptId) => {
    setSelectedApptId(apptId);
    setShowAddTreatmentModal(true);
    setNewTreatment({
      type: '',
      dose: '',
      frequency: '',
      duration: '',
      notes: ''
    });
  };
  
  const handleOpenAddPrescriptionModal = (apptId) => {
    setSelectedApptId(apptId);
    setShowAddPrescriptionModal(true);
    setNewPrescription({
      medication: '',
      dose: '',
      frequency: '',
      duration: '',
      instructions: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: ''
    });
  };
  
  const handleSubmitTreatment = async () => {
    if (!newTreatment.type || !newTreatment.dose) {
      alert('Please fill in treatment type and dose');
      return;
    }
  
    try {
      await fetch(`http://localhost:5000/api/examinations/${selectedApptId}/treatments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_id: selectedPatient.pet_id,
          treat_type: newTreatment.type,
          dose: newTreatment.dose,
          freq: newTreatment.frequency,
          duration: newTreatment.duration,
          notes: newTreatment.notes
        })
      });
  
      alert('Treatment added successfully!');
      setShowAddTreatmentModal(false);
      fetchHealthRecords(selectedPatient.pet_id);
    } catch (error) {
      console.error('Error adding treatment:', error);
      alert('Failed to add treatment');
    }
  };
  
  const handleSubmitPrescription = async () => {
    if (!newPrescription.medication || !newPrescription.dose) {
      alert('Please fill in medication name and dose');
      return;
    }
  
    try {
      await fetch(`http://localhost:5000/api/examinations/${selectedApptId}/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_id: selectedPatient.pet_id,
          med_name: newPrescription.medication,
          dose: newPrescription.dose,
          freq: newPrescription.frequency,
          duration: newPrescription.duration,
          instructions: newPrescription.instructions,
          start_date: newPrescription.start_date,
          end_date: newPrescription.end_date || null
        })
      });
  
      alert('Prescription added successfully!');
      setShowAddPrescriptionModal(false);
      fetchHealthRecords(selectedPatient.pet_id);
    } catch (error) {
      console.error('Error adding prescription:', error);
      alert('Failed to add prescription');
    }
  };

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

  // Fetch health records for selected patient
  const fetchHealthRecords = async (petId) => {
    try {
      const [examRes, historyRes] = await Promise.all([
        fetch(`http://localhost:5000/api/pets/${petId}/examinations`),
        fetch(`http://localhost:5000/api/pets/${petId}/medical-history`)
      ]);
      
      const examinationsData = await examRes.json();
      const medicalHistoryData = await historyRes.json();
      
      console.log('📋 Examinations:', examinationsData);
      console.log('📋 Medical History:', medicalHistoryData);
      
      setExaminations(examinationsData);
      
      // ✅ Ensure all properties exist with default empty arrays
      setMedicalHistory({
        documents: medicalHistoryData.documents || [],
        vaccinations: medicalHistoryData.vaccinations || [],
        conditions: medicalHistoryData.conditions || [],
        currentMedications: medicalHistoryData.currentMedications || [],
        surgeries: medicalHistoryData.surgeries || []  // ✅ Add fallback
      });
    } catch (error) {
      console.error('Error fetching health records:', error);
      // ✅ Set empty arrays on error
      setMedicalHistory({
        documents: [],
        vaccinations: [],
        conditions: [],
        currentMedications: [],
        surgeries: []
      });
    }
  };

  // Fetch tracking data for selected patient
  const fetchTrackingData = async (petId) => {
    try {
      const [weightRes, activityRes, symptomRes, behaviorRes] = await Promise.all([
        fetch(`http://localhost:5000/api/pets/${petId}/weight-log`),
        fetch(`http://localhost:5000/api/pets/${petId}/activity-log`),
        fetch(`http://localhost:5000/api/pets/${petId}/symptom-log`),
        fetch(`http://localhost:5000/api/pets/${petId}/behavior-log`)
      ]);

      setTrackingData({
        weightLog: await weightRes.json(),
        activityLog: await activityRes.json(),
        symptomLog: await symptomRes.json(),
        behaviorLog: await behaviorRes.json()
      });
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    }
  };

  // Open health records modal
  const handleViewHealthRecords = async (patient) => {
    setSelectedPatient(patient);
    setActiveHealthTab('details'); // Start with details tab
    await Promise.all([
      fetchHealthRecords(patient.pet_id),
      fetchTrackingData(patient.pet_id)
    ]);
    setShowHealthModal(true);
    setOpenMenuId(null);
  };

  const handleOpenTrackingModal = (type) => {
    setTrackingModalType(type);
    setShowTrackingModal(true);
    setNewTrackingEntry({
      date: new Date().toISOString().split('T')[0],
      weight: '',
      notes: '',
      activityType: '',
      duration: '',
      symptomTitle: '',
      symptomDescription: '',
      behaviorType: '',
      behaviorNote: ''
    });
  };
  
  const handleCloseTrackingModal = () => {
    setShowTrackingModal(false);
    setTrackingModalType(null);
    setNewTrackingEntry({
      date: '',
      weight: '',
      notes: '',
      activityType: '',
      duration: '',
      symptomTitle: '',
      symptomDescription: '',
      behaviorType: '',
      behaviorNote: ''
    });
  };
  
  const handleTrackingInputChange = (field, value) => {
    setNewTrackingEntry(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmitTrackingEntry = async () => {
    // Validation
    if (trackingModalType === 'weight' && (!newTrackingEntry.weight || !newTrackingEntry.date)) {
      alert('Please fill in all required fields');
      return;
    }
    if (trackingModalType === 'activity' && (!newTrackingEntry.activityType || !newTrackingEntry.duration || !newTrackingEntry.date)) {
      alert('Please fill in all required fields');
      return;
    }
    if (trackingModalType === 'symptoms' && (!newTrackingEntry.symptomTitle || !newTrackingEntry.date)) {
      alert('Please fill in all required fields');
      return;
    }
    if (trackingModalType === 'behavior' && (!newTrackingEntry.behaviorType || !newTrackingEntry.behaviorNote || !newTrackingEntry.date)) {
      alert('Please fill in all required fields');
      return;
    }
  
    try {
      let endpoint = '';
      let payload = {};
  
      switch (trackingModalType) {
        case 'weight':
          endpoint = `http://localhost:5000/api/pets/${selectedPatient.pet_id}/weight-log`;
          payload = {
            weight: newTrackingEntry.weight,
            rec_date: newTrackingEntry.date,
            notes: newTrackingEntry.notes
          };
          break;
        case 'activity':
          endpoint = `http://localhost:5000/api/pets/${selectedPatient.pet_id}/activity-log`;
          payload = {
            activityType: newTrackingEntry.activityType,
            duration: newTrackingEntry.duration,
            activ_date: newTrackingEntry.date,
            notes: newTrackingEntry.notes
          };
          break;
        case 'symptoms':
          endpoint = `http://localhost:5000/api/pets/${selectedPatient.pet_id}/symptom-log`;
          payload = {
            symptomTitle: newTrackingEntry.symptomTitle,
            symptomDescription: newTrackingEntry.symptomDescription,
            symp_date: newTrackingEntry.date
          };
          break;
        case 'behavior':
          endpoint = `http://localhost:5000/api/pets/${selectedPatient.pet_id}/behavior-log`;
          payload = {
            behaviorType: newTrackingEntry.behaviorType,
            behaviorNote: newTrackingEntry.behaviorNote,
            behav_date: newTrackingEntry.date
          };
          break;
      }
  
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      alert('Entry added successfully!');
      handleCloseTrackingModal();
      
      // Refresh tracking data
      fetchTrackingData(selectedPatient.pet_id);
    } catch (error) {
      console.error('Error adding tracking entry:', error);
      alert('Failed to add entry. Please try again.');
    }
  };

  const handleOpenAddRecordModal = (type) => {
    setAddRecordType(type);
    setShowAddRecordModal(true);
    setNewRecordData({
      vac_name: '',
      vac_date: '',
      next_date: '',
      vac_notes: '',
      doc_title: '',
      doc_type: 'report',
      file_url: '',
      cond_name: '',
      diag_date: '',
      status: 'active',
      cond_notes: '',
      surg_name: '',
      surg_date: '',
      surg_notes: '',
      complications: ''
    });
  };
  
  const handleCloseAddRecordModal = () => {
    setShowAddRecordModal(false);
    setAddRecordType(null);
  };
  
  const handleRecordInputChange = (field, value) => {
    setNewRecordData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmitRecord = async () => {
    try {
      let endpoint = '';
      let payload = {};
  
      switch (addRecordType) {
        case 'vaccinations':
          if (!newRecordData.vac_name || !newRecordData.vac_date) {
            alert('Please fill in vaccine name and date');
            return;
          }
          endpoint = `http://localhost:5000/api/pets/${selectedPatient.pet_id}/vaccinations`;
          payload = {
            vac_name: newRecordData.vac_name,
            vac_date: newRecordData.vac_date,
            next_date: newRecordData.next_date,
            vt_id: vtId,
            notes: newRecordData.vac_notes
          };
          break;
  
        case 'documents':
          if (!newRecordData.doc_title || !newRecordData.doc_type) {
            alert('Please fill in document title and type');
            return;
          }
          endpoint = `http://localhost:5000/api/pets/${selectedPatient.pet_id}/documents`;
          payload = {
            doc_title: newRecordData.doc_title,
            doc_type: newRecordData.doc_type,
            file_url: newRecordData.file_url
          };
          break;
  
        case 'conditions':
          if (!newRecordData.cond_name) {
            alert('Please fill in condition name');
            return;
          }
          endpoint = `http://localhost:5000/api/pets/${selectedPatient.pet_id}/conditions`;
          payload = {
            cond_name: newRecordData.cond_name,
            diag_date: newRecordData.diag_date,
            status: newRecordData.status,
            notes: newRecordData.cond_notes
          };
          break;
  
        case 'surgeries':
          if (!newRecordData.surg_name || !newRecordData.surg_date) {
            alert('Please fill in surgery name and date');
            return;
          }
          endpoint = `http://localhost:5000/api/pets/${selectedPatient.pet_id}/surgeries`;
          payload = {
            surg_name: newRecordData.surg_name,
            surg_date: newRecordData.surg_date,
            vt_id: vtId,
            notes: newRecordData.surg_notes,
            complications: newRecordData.complications
          };
          break;
      }
  
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  
      if (response.ok) {
        alert('Record added successfully!');
        handleCloseAddRecordModal();
        // Refresh health records
        fetchHealthRecords(selectedPatient.pet_id);
      } else {
        alert('Failed to add record');
      }
    } catch (error) {
      console.error('Error adding record:', error);
      alert('Failed to add record. Please try again.');
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
                              onClick={() => handleView(patient)}
                            >
                              <Eye size={16} />
                              View Details
                            </button>
                            <button 
                              className="menu-item"
                              onClick={() => handleViewHealthRecords(patient)}
                            >
                              <Activity size={16} />
                              Health Records
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