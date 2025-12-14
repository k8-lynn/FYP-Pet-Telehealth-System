//PatientProfileModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Activity, FileText, Scale, ChevronDown, Plus } from 'lucide-react';

const PatientProfileModal = ({
  petId,  // Just pass pet_id
  vtId,   // And vet_id
  viewMode = 'vet',
  onClose
}) => {
  // All state management inside the component
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeHealthTab, setActiveHealthTab] = useState('details');
  const [activeHealthView, setActiveHealthView] = useState(null);
  const [activeTrackingView, setActiveTrackingView] = useState(null);
  const [examinations, setExaminations] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState({
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
  const [expandedExam, setExpandedExam] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingModalType, setTrackingModalType] = useState(null);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [addRecordType, setAddRecordType] = useState(null);
  const [showAddTreatmentModal, setShowAddTreatmentModal] = useState(false);
  const [showAddPrescriptionModal, setShowAddPrescriptionModal] = useState(false);
  const [selectedApptId, setSelectedApptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allMedications, setAllMedications] = useState([]);
  const [allTreatments, setAllTreatments] = useState([]);
  const [soapNotes, setSoapNotes] = useState([]);

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

  // Fetch patient details
  const fetchPatientDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/patients/${petId}`);
      const data = await response.json();
      if (response.ok) {
        setSelectedPatient(data);
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  // Fetch health records
  const fetchHealthRecords = async () => {
    try {
      const [examRes, historyRes] = await Promise.all([
        fetch(`http://localhost:5000/api/pets/${petId}/examinations`),
        fetch(`http://localhost:5000/api/pets/${petId}/medical-history`)
      ]);

      const examinationsData = await examRes.json();
      const medicalHistoryData = await historyRes.json();

      setExaminations(examinationsData);
      setMedicalHistory({
        documents: medicalHistoryData.documents || [],
        vaccinations: medicalHistoryData.vaccinations || [],
        conditions: medicalHistoryData.conditions || [],
        currentMedications: medicalHistoryData.currentMedications || [],
        surgeries: medicalHistoryData.surgeries || []
      });
    } catch (error) {
      console.error('Error fetching health records:', error);
      setMedicalHistory({
        documents: [],
        vaccinations: [],
        conditions: [],
        currentMedications: [],
        surgeries: []
      });
    }
  };

  // Fetch tracking data
  const fetchTrackingData = async () => {
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

  // Fetch all medications
  const fetchAllMedications = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/pets/${petId}/all-medications`);
      const data = await response.json();
      setAllMedications(data);
    } catch (error) {
      console.error('Error fetching medications:', error);
      setAllMedications([]);
    }
  };

  // Fetch all treatments
  const fetchAllTreatments = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/pets/${petId}/all-treatments`);
      const data = await response.json();
      setAllTreatments(data);
    } catch (error) {
      console.error('Error fetching treatments:', error);
      setAllTreatments([]);
    }
  };

  // Fetch SOAP notes
  const fetchSoapNotes = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/pets/${petId}/soap-notes`);
      const data = await response.json();
      setSoapNotes(data);
    } catch (error) {
      console.error('Error fetching SOAP notes:', error);
      setSoapNotes([]);
    }
  };

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPatientDetails(),
        fetchHealthRecords(),
        fetchTrackingData(),
        fetchAllMedications(),  // ADD THIS LINE
        fetchAllTreatments(),  // ADD THIS
        fetchSoapNotes()        // ADD THIS
      ]);
      setLoading(false);
    };
  
    if (petId) {
      loadData();
    }
  }, [petId]);

  // Tracking Modal Handlers
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
  };

  const handleTrackingInputChange = (field, value) => {
    setNewTrackingEntry(prev => ({ ...prev, [field]: value }));
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
          endpoint = `http://localhost:5000/api/pets/${petId}/weight-log`;
          payload = {
            weight: newTrackingEntry.weight,
            rec_date: newTrackingEntry.date,
            notes: newTrackingEntry.notes
          };
          break;
        case 'activity':
          endpoint = `http://localhost:5000/api/pets/${petId}/activity-log`;
          payload = {
            activityType: newTrackingEntry.activityType,
            duration: newTrackingEntry.duration,
            activ_date: newTrackingEntry.date,
            notes: newTrackingEntry.notes
          };
          break;
        case 'symptoms':
          endpoint = `http://localhost:5000/api/pets/${petId}/symptom-log`;
          payload = {
            symptomTitle: newTrackingEntry.symptomTitle,
            symptomDescription: newTrackingEntry.symptomDescription,
            symp_date: newTrackingEntry.date
          };
          break;
        case 'behavior':
          endpoint = `http://localhost:5000/api/pets/${petId}/behavior-log`;
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
      fetchTrackingData();
    } catch (error) {
      console.error('Error adding tracking entry:', error);
      alert('Failed to add entry. Please try again.');
    }
  };

  // Health Record Modal Handlers
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
    setNewRecordData(prev => ({ ...prev, [field]: value }));
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
          endpoint = `http://localhost:5000/api/pets/${petId}/vaccinations`;
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
          endpoint = `http://localhost:5000/api/pets/${petId}/documents`;
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
          endpoint = `http://localhost:5000/api/pets/${petId}/conditions`;
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
          endpoint = `http://localhost:5000/api/pets/${petId}/surgeries`;
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
        fetchHealthRecords();
      } else {
        alert('Failed to add record');
      }
    } catch (error) {
      console.error('Error adding record:', error);
      alert('Failed to add record. Please try again.');
    }
  };

  // Treatment & Prescription Handlers
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
          pet_id: petId,
          treat_type: newTreatment.type,
          dose: newTreatment.dose,
          freq: newTreatment.frequency,
          duration: newTreatment.duration,
          notes: newTreatment.notes
        })
      });

      alert('Treatment added successfully!');
      setShowAddTreatmentModal(false);
      fetchHealthRecords();
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
          pet_id: petId,
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
      fetchHealthRecords();
    } catch (error) {
      console.error('Error adding prescription:', error);
      alert('Failed to add prescription');
    }
  };

  if (loading || !selectedPatient) {
    return (
      <div className="mypatients-modal-overlay" onClick={onClose}>
        <div className="mypatients-modal-content health-modal-large" onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Loading patient data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Modal */}
      <div className="mypatients-modal-overlay" onClick={onClose}>
        <div className="mypatients-modal-content health-modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="mypatients-modal-header">
            <div>
              <h2 className="mypatients-modal-title">{selectedPatient.pet_name}'s Complete Profile</h2>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>
                Patient details, health records, and tracking data
              </p>
            </div>
            <button className="mypatients-modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <div className="health-modal-tabs">
            <button
              className={`health-tab ${activeHealthTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveHealthTab('details')}
            >
              Patient Details
            </button>
            <button
              className={`health-tab ${activeHealthTab === 'records' ? 'active' : ''}`}
              onClick={() => setActiveHealthTab('records')}
            >
              Health Records
            </button>
            <button
              className={`health-tab ${activeHealthTab === 'tracking' ? 'active' : ''}`}
              onClick={() => setActiveHealthTab('tracking')}
            >
              Tracking & Monitoring
            </button>
          </div>

          <div className="health-modal-body">
            {/* Patient Details Tab */}
            {activeHealthTab === 'details' && (
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
              </div>
            )}

            {/* Health Records Tab */}
            {activeHealthTab === 'records' && (
              <div className="health-records-section">
                {!activeHealthView ? (
                  <div className="health-dashboard-grid">
                    <div className="health-card clickable" onClick={() => setActiveHealthView('examinations')}>
                      <Activity size={24} />
                      <h4>Examinations</h4>
                      <p>{examinations?.length || 0} records</p>
                    </div>
                    <div className="health-card clickable" onClick={() => setActiveHealthView('medications')}>
                      <Activity size={24} />
                      <h4>Prescriptions</h4>
                      <p>{allMedications?.length || 0} prescriptions</p>
                    </div>
                    <div className="health-card clickable" onClick={() => setActiveHealthView('treatments')}>
                      <Activity size={24} />
                      <h4>Treatments</h4>
                      <p>{allTreatments?.length || 0} treatments</p>
                    </div>
                    <div className="health-card clickable" onClick={() => setActiveHealthView('soap-notes')}>
                      <FileText size={24} />
                      <h4>Patient's SOAP Notes</h4>
                      <p>{soapNotes?.length || 0} notes</p>
                    </div>
                    <div className="health-card clickable" onClick={() => setActiveHealthView('documents')}>
                      <FileText size={24} />
                      <h4>Documents</h4>
                      <p>{medicalHistory.documents?.length || 0} files</p>
                      {viewMode === 'vet' && (
                        <button
                          className="btn-add-card"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddRecordModal('documents');
                          }}
                        >
                          <Plus size={16} /> Add
                        </button>
                      )}
                    </div>
                    <div className="health-card clickable" onClick={() => setActiveHealthView('vaccinations')}>
                      <Activity size={24} />
                      <h4>Vaccinations</h4>
                      <p>{medicalHistory.vaccinations?.length || 0} vaccines</p>
                      {viewMode === 'vet' && (
                        <button
                          className="btn-add-card"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddRecordModal('vaccinations');
                          }}
                        >
                          <Plus size={16} /> Add
                        </button>
                      )}
                    </div>
                    <div className="health-card clickable" onClick={() => setActiveHealthView('conditions')}>
                      <Activity size={24} />
                      <h4>Conditions</h4>
                      <p>{medicalHistory.conditions?.length || 0} conditions</p>
                      {viewMode === 'vet' && (
                        <button
                          className="btn-add-card"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddRecordModal('conditions');
                          }}
                        >
                          <Plus size={16} /> Add
                        </button>
                      )}
                    </div>
                    <div className="health-card clickable" onClick={() => setActiveHealthView('surgeries')}>
                      <Activity size={24} />
                      <h4>Surgeries</h4>
                      <p>{medicalHistory?.surgeries?.length || 0} surgeries</p>
                      {viewMode === 'vet' && (
                        <button
                          className="btn-add-card"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddRecordModal('surgeries');
                          }}
                        >
                          <Plus size={16} /> Add
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="detailed-view">
                    <button className="back-to-dashboard" onClick={() => setActiveHealthView(null)}>
                      ← Back to Dashboard
                    </button>

                    {/* Examinations View */}
                    {activeHealthView === 'examinations' && (
                      <>
                        <h3>Examinations & Treatment History</h3>
                        {examinations.length === 0 ? (
                          <p className="no-data">No examinations or treatments recorded yet.</p>
                        ) : (
                          <div className="examinations-list">
                            {examinations.map((exam) => (
                              <div key={exam.appt_id} className="examination-card">
                                <div className="exam-header" onClick={() => setExpandedExam(expandedExam === exam.appt_id ? null : exam.appt_id)}>
                                  <div className="exam-header-left">
                                    <span className={`exam-type exam-${exam.appt_type.toLowerCase().replace(/\s+/g, '-')}`}>
                                      {exam.appt_type}
                                    </span>
                                    <span className="exam-date">
                                      {new Date(exam.appt_date).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </span>
                                    <span className={`exam-status ${exam.appt_status}`}>
                                      {exam.appt_status}
                                    </span>
                                  </div>
                                  <ChevronDown
                                    size={20}
                                    className={`expand-icon ${expandedExam === exam.appt_id ? 'expanded' : ''}`}
                                  />
                                </div>

                                <div className="exam-summary">
                                  <p><strong>Vet:</strong> {exam.vet_name}</p>
                                  <p><strong>Clinic:</strong> {exam.clinic_name}</p>
                                  <p><strong>Type:</strong> {exam.consultation_type}</p>
                                  {exam.appt_description && <p><strong>Description:</strong> {exam.appt_description}</p>}
                                </div>

                                {expandedExam === exam.appt_id && (
                                  <div className="exam-details">
                                    {/* Treatments Section */}
                                    <div className="treatments-section">
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4>Treatments Administered</h4>
                                        <button
                                          className="btn-add-inline"
                                          onClick={() => handleOpenAddTreatmentModal(exam.appt_id)}
                                          style={{
                                            padding: '0.5rem 1rem',
                                            background: '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.875rem'
                                          }}
                                        >
                                          <Plus size={16} /> Add Treatment
                                        </button>
                                      </div>

                                      {exam.treatments && exam.treatments.length > 0 ? (
                                        <table className="data-table">
                                          <thead>
                                            <tr>
                                              <th>Type</th>
                                              <th>Dose</th>
                                              <th>Frequency</th>
                                              <th>Duration</th>
                                              <th>Notes</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {exam.treatments.map((treatment, idx) => (
                                              <tr key={idx}>
                                                <td>{treatment.type}</td>
                                                <td>{treatment.dose}</td>
                                                <td>{treatment.frequency}</td>
                                                <td>{treatment.duration}</td>
                                                <td>{treatment.notes}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      ) : (
                                        <p className="no-data">No treatments recorded for this examination.</p>
                                      )}
                                    </div>

                                    {/* Prescriptions Section */}
                                    <div className="prescriptions-section" style={{ marginTop: '2rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4>Prescriptions</h4>
                                        <button
                                          className="btn-add-inline"
                                          onClick={() => handleOpenAddPrescriptionModal(exam.appt_id)}
                                          style={{
                                            padding: '0.5rem 1rem',
                                            background: '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.875rem'
                                          }}
                                        >
                                          <Plus size={16} /> Add Prescription
                                        </button>
                                      </div>

                                      {exam.prescriptions && exam.prescriptions.length > 0 ? (
                                        <table className="data-table">
                                          <thead>
                                            <tr>
                                              <th>Medication</th>
                                              <th>Dose</th>
                                              <th>Frequency</th>
                                              <th>Duration</th>
                                              <th>Instructions</th>
                                              <th>Period</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {exam.prescriptions.map((rx, idx) => (
                                              <tr key={idx}>
                                                <td>{rx.medication}</td>
                                                <td>{rx.dose}</td>
                                                <td>{rx.frequency}</td>
                                                <td>{rx.duration}</td>
                                                <td>{rx.instructions}</td>
                                                <td>
                                                  {rx.start_date} {rx.end_date ? `to ${rx.end_date}` : '(Ongoing)'}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      ) : (
                                        <p className="no-data">No prescriptions recorded for this examination.</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Medications View */}
                    {activeHealthView === 'medications' && (
                      <>
                        <h3>All Medications & Prescriptions</h3>
                        {allMedications.length === 0 ? (
                          <p className="no-data">No medications or prescriptions recorded.</p>
                        ) : (
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Medication</th>
                                <th>Dose</th>
                                <th>Frequency</th>
                                <th>Duration</th>
                                <th>Instructions</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {allMedications.map((med, idx) => {
                                const isActive = !med.end_date || new Date(med.end_date) >= new Date();
                                return (
                                  <tr key={idx}>
                                    <td>{med.medication}</td>
                                    <td>{med.dose}</td>
                                    <td>{med.frequency}</td>
                                    <td>{med.duration}</td>
                                    <td>{med.instructions || 'N/A'}</td>
                                    <td>{med.start_date ? new Date(med.start_date).toLocaleDateString('en-GB') : 'N/A'}</td>
                                    <td>{med.end_date ? new Date(med.end_date).toLocaleDateString('en-GB') : 'Ongoing'}</td>
                                    <td>
                                      <span className={`badge ${isActive ? 'active' : 'resolved'}`}>
                                        {isActive ? 'Active' : 'Completed'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </>
                    )}

                    {/* Treatments View */}
                    {activeHealthView === 'treatments' && (
                      <>
                        <h3>All Treatments Administered</h3>
                        {allTreatments.length === 0 ? (
                          <p className="no-data">No treatments recorded.</p>
                        ) : (
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Dose</th>
                                <th>Frequency</th>
                                <th>Duration</th>
                                <th>Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {allTreatments.map((treatment, idx) => (
                                <tr key={idx}>
                                  <td>{treatment.admin_date ? new Date(treatment.admin_date).toLocaleDateString('en-GB') : 'N/A'}</td>
                                  <td>{treatment.type}</td>
                                  <td>{treatment.dose}</td>
                                  <td>{treatment.frequency || 'N/A'}</td>
                                  <td>{treatment.duration || 'N/A'}</td>
                                  <td>{treatment.notes || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </>
                    )}

                    {/* Documents View */}
                    {activeHealthView === 'documents' && (
                      <>
                        <h3>Documents & Attachments</h3>
                        {medicalHistory.documents.length === 0 ? (
                          <p className="no-data">No documents uploaded.</p>
                        ) : (
                          <div className="documents-grid">
                            {medicalHistory.documents.map((doc) => (
                              <div key={doc.id} className="document-card">
                                <div className="doc-icon">
                                  {doc.type === 'xray' ? <Activity size={24} color="#4f46e5" /> :
                                    doc.type === 'lab' ? <FileText size={24} color="#059669" /> :
                                      <FileText size={24} color="#64748b" />}
                                </div>
                                <div className="doc-info">
                                  <strong>{doc.title}</strong>
                                  <span className="doc-date">{new Date(doc.date).toLocaleDateString('en-GB')}</span>
                                </div>
                                <button className="doc-download">View</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {/* Vaccinations View */}
                    {activeHealthView === 'vaccinations' && (
                      <>
                        <h3>Vaccination History</h3>
                        {medicalHistory.vaccinations.length === 0 ? (
                          <p className="no-data">No vaccinations recorded.</p>
                        ) : (
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Vaccine</th>
                                <th>Last Given</th>
                                <th>Next Due</th>
                                <th>Veterinarian</th>
                                <th>Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {medicalHistory.vaccinations.map((vac, idx) => (
                                <tr key={idx} className={new Date(vac.next_date) < new Date() ? 'overdue' : ''}>
                                  <td>{vac.vaccine}</td>
                                  <td>{new Date(vac.vac_date).toLocaleDateString('en-GB')}</td>
                                  <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span>{new Date(vac.next_date).toLocaleDateString('en-GB')}</span>
                                      {new Date(vac.next_date) < new Date() && <span className="badge overdue-badge">Overdue</span>}
                                    </div>
                                  </td>
                                  <td>{vac.vet}</td>
                                  <td>{vac.notes}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </>
                    )}

                    {/* Conditions View */}
                    {activeHealthView === 'conditions' && (
                      <>
                        <h3>Chronic Conditions & Diagnoses</h3>
                        {medicalHistory.conditions.length === 0 ? (
                          <p className="no-data">No chronic conditions recorded.</p>
                        ) : (
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Condition</th>
                                <th>Diagnosed</th>
                                <th>Status</th>
                                <th>Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {medicalHistory.conditions.map((cond, idx) => (
                                <tr key={idx}>
                                  <td>{cond.condition}</td>
                                  <td>{new Date(cond.diag_date).toLocaleDateString('en-GB')}</td>
                                  <td><span className={`badge ${cond.status}`}>{cond.status}</span></td>
                                  <td>{cond.notes}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </>
                    )}

                    {/* Surgeries View */}
                    {activeHealthView === 'surgeries' && (
                      <>
                        <h3>Surgical History</h3>
                        {(!medicalHistory.surgeries || medicalHistory.surgeries.length === 0) ? (
                          <p className="no-data">No surgeries recorded.</p>
                        ) : (
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Surgery</th>
                                <th>Date</th>
                                <th>Veterinarian</th>
                                <th>Notes</th>
                                <th>Complications</th>
                              </tr>
                            </thead>
                            <tbody>
                              {medicalHistory.surgeries.map((surg, idx) => (
                                <tr key={idx}>
                                  <td>{surg.name}</td>
                                  <td>{new Date(surg.date).toLocaleDateString('en-GB')}</td>
                                  <td>{surg.vet || 'N/A'}</td>
                                  <td>{surg.notes || 'N/A'}</td>
                                  <td>{surg.complications || 'None'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </>
                    )}

                    {/* SOAP Notes View */}
                    {activeHealthView === 'soap-notes' && (
                      <>
                        <h3>Patient's SOAP Notes</h3>
                        {soapNotes.length === 0 ? (
                          <p className="no-data">No SOAP notes recorded.</p>
                        ) : (
                          <div className="soap-notes-list">
                            {soapNotes.map((note, idx) => (
                              <div key={idx} className="soap-note-card" style={{
                                background: 'white',
                                border: '2px solid #e8f0f7',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                marginBottom: '1rem'
                              }}>
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center',
                                  marginBottom: '1rem',
                                  paddingBottom: '0.75rem',
                                  borderBottom: '2px solid #e8f0f7'
                                }}>
                                  <h4 style={{ margin: 0, color: '#1a2e35' }}>
                                    {new Date(note.soap_date).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'long',
                                      year: 'numeric'
                                    })}
                                  </h4>
                                </div>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                  {note.subj && (
                                    <div>
                                      <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>Subjective:</strong>
                                      <p style={{ margin: '0.25rem 0 0 0' }}>{note.subj}</p>
                                    </div>
                                  )}
                                  {note.obj && (
                                    <div>
                                      <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>Objective:</strong>
                                      <p style={{ margin: '0.25rem 0 0 0' }}>{note.obj}</p>
                                    </div>
                                  )}
                                  {note.assess && (
                                    <div>
                                      <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>Assessment:</strong>
                                      <p style={{ margin: '0.25rem 0 0 0' }}>{note.assess}</p>
                                    </div>
                                  )}
                                  {note.plan && (
                                    <div>
                                      <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>Plan:</strong>
                                      <p style={{ margin: '0.25rem 0 0 0' }}>{note.plan}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tracking Tab */}
            {activeHealthTab === 'tracking' && (
              <div className="tracking-section">
                {!activeTrackingView ? (
                  <div className="health-dashboard-grid">
                    <div className="health-card clickable" onClick={() => setActiveTrackingView('weight')}>
                      <Scale size={24} />
                      <h4>Weight Tracking</h4>
                      <p>{trackingData.weightLog?.length || 0} entries</p>
                    </div>
                    <div className="health-card clickable" onClick={() => setActiveTrackingView('activity')}>
                      <Activity size={24} />
                      <h4>Activity Log</h4>
                      <p>{trackingData.activityLog?.length || 0} activities</p>
                    </div>
                    <div className="health-card clickable" onClick={() => setActiveTrackingView('symptoms')}>
                      <FileText size={24} />
                      <h4>Symptoms</h4>
                      <p>{trackingData.symptomLog?.length || 0} logs</p>
                    </div>
                    <div className="health-card clickable" onClick={() => setActiveTrackingView('behavior')}>
                      <Activity size={24} />
                      <h4>Behavior</h4>
                      <p>{trackingData.behaviorLog?.length || 0} notes</p>
                    </div>
                  </div>
                ) : (
                  <div className="detailed-view">
                    <button className="back-to-dashboard" onClick={() => setActiveTrackingView(null)}>
                      ← Back to Dashboard
                    </button>

                    {/* Weight Tracking Full View */}
                    {activeTrackingView === 'weight' && (
                      <>
                        <div className="tracking-header">
                          <h3>Weight Tracking - All Entries</h3>
                          <button className="btn-add-section" onClick={() => handleOpenTrackingModal('weight')}>
                            <Plus size={16} /> Add Entry
                          </button>
                        </div>
                        <div className="weight-chart">
                          {trackingData.weightLog.map((log, idx) => (
                            <div key={idx} className="weight-entry">
                              <span className="weight-value">{log.weight} kg</span>
                              <span className="weight-date">{new Date(log.rec_date).toLocaleDateString('en-GB')}</span>
                              {log.notes && <span className="weight-notes">{log.notes}</span>}
                            </div>
                          ))}
                          {trackingData.weightLog.length === 0 && <p className="no-data">No weight entries yet</p>}
                        </div>
                      </>
                    )}

                    {/* Activity Log Full View */}
                    {activeTrackingView === 'activity' && (
                      <>
                        <div className="tracking-header">
                          <h3>Activity Log - All Entries</h3>
                          <button className="btn-add-section" onClick={() => handleOpenTrackingModal('activity')}>
                            <Plus size={16} /> Add Activity
                          </button>
                        </div>
                        <div className="activity-list">
                          {trackingData.activityLog.map((activity, idx) => (
                            <div key={idx} className="activity-entry">
                              <span className="activity-type">{activity.activ_type}</span>
                              <span className="activity-duration">{activity.duration_min} mins</span>
                              <span className="activity-date">{new Date(activity.activ_date).toLocaleDateString('en-GB')}</span>
                              {activity.notes && <span className="activity-notes">{activity.notes}</span>}
                            </div>
                          ))}
                          {trackingData.activityLog.length === 0 && <p className="no-data">No activities logged yet. Click "Add Activity" to start tracking.</p>}
                        </div>
                      </>
                    )}

                    {/* Symptom Diary Full View */}
                    {activeTrackingView === 'symptoms' && (
                      <>
                        <div className="tracking-header">
                          <h3>Symptom Diary - All Entries</h3>
                          <button className="btn-add-section" onClick={() => handleOpenTrackingModal('symptoms')}>
                            <Plus size={16} /> Add Entry
                          </button>
                        </div>
                        <div className="symptom-list">
                          {trackingData.symptomLog.map((symptom, idx) => (
                            <div key={idx} className="symptom-entry">
                              <div className="symptom-header">
                                <span className="symptom-title">{symptom.symp_title}</span>
                                <span className="symptom-date">{new Date(symptom.symp_date).toLocaleDateString('en-GB')}</span>
                              </div>
                              <p className="symptom-description">{symptom.symp_desc}</p>
                            </div>
                          ))}
                          {trackingData.symptomLog.length === 0 && <p className="no-data">No symptoms recorded yet. Click "Add Entry" to start tracking.</p>}
                        </div>
                      </>
                    )}

                    {/* Behavioral Notes Full View */}
                    {activeTrackingView === 'behavior' && (
                      <>
                        <div className="tracking-header">
                          <h3>Behavioral Notes - All Entries</h3>
                          <button className="btn-add-section" onClick={() => handleOpenTrackingModal('behavior')}>
                            <Plus size={16} /> Add Note
                          </button>
                        </div>
                        <div className="behavior-list">
                          {trackingData.behaviorLog.map((behavior, idx) => (
                            <div key={idx} className="behavior-entry">
                              <span className="behavior-type">{behavior.behav_type}</span>
                              <span className="behavior-note">{behavior.behav_note}</span>
                              <span className="behavior-date">{new Date(behavior.behav_date).toLocaleDateString('en-GB')}</span>
                            </div>
                          ))}
                          {trackingData.behaviorLog.length === 0 && <p className="no-data">No behavioral notes yet. Click "Add Note" to start tracking.</p>}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tracking Entry Modal */}
      {showTrackingModal && (
        <div className="mypatients-modal-overlay" onClick={handleCloseTrackingModal}>
          <div className="mypatients-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="mypatients-modal-header">
              <h2 className="mypatients-modal-title">
                {trackingModalType === 'weight' && 'Add Weight Entry'}
                {trackingModalType === 'activity' && 'Add Activity Entry'}
                {trackingModalType === 'symptoms' && 'Add Symptom Entry'}
                {trackingModalType === 'behavior' && 'Add Behavioral Note'}
              </h2>
              <button className="mypatients-modal-close" onClick={handleCloseTrackingModal}>
                <X size={24} />
              </button>
            </div>

            <div className="view-modal-body">
              {/* Weight Entry Form */}
              {trackingModalType === 'weight' && (
                <>
                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Date *</label>
                    <input
                      type="date"
                      style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                      value={newTrackingEntry.date}
                      onChange={(e) => handleTrackingInputChange('date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Weight (kg) *</label>
                    <input
                      type="number"
                      step="0.1"
                      style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                      placeholder="0.0"
                      value={newTrackingEntry.weight}
                      onChange={(e) => handleTrackingInputChange('weight', e.target.value)}
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Notes (Optional)</label>
                    <textarea
                      style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                      placeholder="E.g., After meal, morning weigh-in..."
                      rows="3"
                      value={newTrackingEntry.notes}
                      onChange={(e) => handleTrackingInputChange('notes', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Activity Entry Form */}
              {trackingModalType === 'activity' && (
                <>
                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Date *</label>
                    <input
                      type="date"
                      style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                      value={newTrackingEntry.date}
                      onChange={(e) => handleTrackingInputChange('date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Activity Type *</label>
                    <select
                      style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                      value={newTrackingEntry.activityType}
                      onChange={(e) => handleTrackingInputChange('activityType', e.target.value)}
                      required
                    >
                      <option value="">Select activity type</option>
                      <option value="Walk">Walk</option>
                      <option value="Run">Run</option>
                      <option value="Playtime">Playtime</option>
                      <option value="Training">Training</option>
                      <option value="Swimming">Swimming
                      </option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Duration (minutes) *</label>
                    <input
                      type="number"
                      style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                      placeholder="0"
                      value={newTrackingEntry.duration}
                      onChange={(e) => handleTrackingInputChange('duration', e.target.value)}
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Notes (Optional)</label>
                    <textarea
                      style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                      placeholder="E.g., High energy, enjoyed the activity..."
                      rows="3"
                      value={newTrackingEntry.notes}
                      onChange={(e) => handleTrackingInputChange('notes', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Symptom Entry Form */}
              {trackingModalType === 'symptoms' && (
                <>
                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Date *</label>
                    <input
                      type="date"
                      style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                      value={newTrackingEntry.date}
                      onChange={(e) => handleTrackingInputChange('date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Symptom Title *</label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                      placeholder="E.g., Vomiting, Limping, Loss of appetite..."
                      value={newTrackingEntry.symptomTitle}
                      onChange={(e) => handleTrackingInputChange('symptomTitle', e.target.value)}
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Description *</label>
                    <textarea
                      style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                      placeholder="Describe the symptom in detail..."
                      rows="4"
                      value={newTrackingEntry.symptomDescription}
                      onChange={(e) => handleTrackingInputChange('symptomDescription', e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {/* Behavioral Note Form */}
              {trackingModalType === 'behavior' && (
                <>
                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Date *</label>
                    <input
                      type="date"
                      style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                      value={newTrackingEntry.date}
                      onChange={(e) => handleTrackingInputChange('date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Behavior Type *</label>
                    <select
                      style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                      value={newTrackingEntry.behaviorType}
                      onChange={(e) => handleTrackingInputChange('behaviorType', e.target.value)}
                      required
                    >
                      <option value="">Select behavior type</option>
                      <option value="Positive">Positive</option>
                      <option value="Normal">Normal</option>
                      <option value="Anxiety">Anxiety</option>
                      <option value="Aggression">Aggression</option>
                      <option value="Alert">Alert</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Behavioral Note *</label>
                    <textarea
                      style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                      placeholder="Describe the behavior..."
                      rows="4"
                      value={newTrackingEntry.behaviorNote}
                      onChange={(e) => handleTrackingInputChange('behaviorNote', e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  onClick={handleCloseTrackingModal}
                  style={{ padding: '0.5rem 1.5rem', background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitTrackingEntry}
                  style={{ padding: '0.5rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Save Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Health Record Modal */}
      {showAddRecordModal && (
        <div className="mypatients-modal-overlay" onClick={handleCloseAddRecordModal}>
          <div className="mypatients-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="mypatients-modal-header">
              <h2 className="mypatients-modal-title">
                {addRecordType === 'vaccinations' && 'Add Vaccination Record'}
                {addRecordType === 'documents' && 'Add Document'}
                {addRecordType === 'conditions' && 'Add Condition'}
                {addRecordType === 'surgeries' && 'Add Surgery Record'}
              </h2>
              <button className="mypatients-modal-close" onClick={handleCloseAddRecordModal}>
                <X size={24} />
              </button>
            </div>

            <div className="view-modal-body">
              {/* Vaccination Form */}
              {addRecordType === 'vaccinations' && (
                <>
                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Vaccine Name *</label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                      placeholder="E.g., Rabies, DHPP, Bordetella..."
                      value={newRecordData.vac_name}
                      onChange={(e) => handleRecordInputChange('vac_name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Date Given *</label>
                    <input
                      type="date"
                      style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                      value={newRecordData.vac_date}
                      onChange={(e) => handleRecordInputChange('vac_date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Next Due Date</label>
                    <input
                      type="date"
                      style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                      value={newRecordData.next_date}
                      onChange={(e) => handleRecordInputChange('next_date', e.target.value)}
                    />
                  </div>

                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Notes</label>
                    <textarea
                      style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                      placeholder="Any additional notes..."
                      rows="3"
                      value={newRecordData.vac_notes}
                      onChange={(e) => handleRecordInputChange('vac_notes', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Document Form */}
              {addRecordType === 'documents' && (
                <>
                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Document Title *</label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                      placeholder="E.g., Blood Test Results, X-Ray..."
                      value={newRecordData.doc_title}
                      onChange={(e) => handleRecordInputChange('doc_title', e.target.value)}
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Document Type *</label>
                    <select
                      style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                      value={newRecordData.doc_type}
                      onChange={(e) => handleRecordInputChange('doc_type', e.target.value)}
                      required
                    >
                      <option value="report">Report</option>
                      <option value="xray">X-Ray</option>
                      <option value="lab">Lab Result</option>
                      <option value="rx">Prescription</option>
                      <option value="photo">Photo</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>File URL (Optional)</label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                      placeholder="https://..."
                      value={newRecordData.file_url}
                      onChange={(e) => handleRecordInputChange('file_url', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Condition Form */}
              {addRecordType === 'conditions' && (
                <>
                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Condition Name *</label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                      placeholder="E.g., Diabetes, Arthritis, Heart Disease..."
                      value={newRecordData.cond_name}
                      onChange={(e) => handleRecordInputChange('cond_name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Diagnosis Date</label>
                    <input
                      type="date"
                      style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                      value={newRecordData.diag_date}
                      onChange={(e) => handleRecordInputChange('diag_date', e.target.value)}
                    />
                  </div>

                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Status *</label>
                    <select
                      style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                      value={newRecordData.status}
                      onChange={(e) => handleRecordInputChange('status', e.target.value)}
                      required
                    >
                      <option value="active">Active</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Notes</label>
                    <textarea
                      style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                      placeholder="Treatment plan, management notes..."
                      rows="3"
                      value={newRecordData.cond_notes}
                      onChange={(e) => handleRecordInputChange('cond_notes', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Surgery Form */}
              {addRecordType === 'surgeries' && (
                <>
                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Surgery Name *</label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                      placeholder="E.g., Spay/Neuter, Tumor Removal..."
                      value={newRecordData.surg_name}
                      onChange={(e) => handleRecordInputChange('surg_name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Surgery Date *</label>
                    <input
                      type="date"
                      style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                      value={newRecordData.surg_date}
                      onChange={(e) => handleRecordInputChange('surg_date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Surgery Notes</label>
                    <textarea
                      style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                      placeholder="Procedure details..."
                      rows="3"
                      value={newRecordData.surg_notes}
                      onChange={(e) => handleRecordInputChange('surg_notes', e.target.value)}
                    />
                  </div>

                  <div className="view-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Complications (if any)</label>
                    <textarea
                      style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                      placeholder="None / Describe any complications..."
                      rows="2"
                      value={newRecordData.complications}
                      onChange={(e) => handleRecordInputChange('complications', e.target.value)}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  onClick={handleCloseAddRecordModal}
                  className="mypatients-cancel-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRecord}
                  className="mypatients-submit-button"
                >
                  Save Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Treatment Modal */}
      {showAddTreatmentModal && (
        <div className="mypatients-modal-overlay" onClick={() => setShowAddTreatmentModal(false)}>
          <div className="mypatients-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="mypatients-modal-header">
              <h2 className="mypatients-modal-title">Add Treatment</h2>
              <button className="mypatients-modal-close" onClick={() => setShowAddTreatmentModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="view-modal-body">
              <div className="view-section">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Treatment Type *</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                  placeholder="E.g., IV Fluids, Antibiotics..."
                  value={newTreatment.type}
                  onChange={(e) => setNewTreatment({ ...newTreatment, type: e.target.value })}
                />
              </div>
              <div className="view-section">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Dose *</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                  placeholder="E.g., 500mg, 10ml..."
                  value={newTreatment.dose}
                  onChange={(e) => setNewTreatment({ ...newTreatment, dose: e.target.value })}
                />
              </div>
              <div className="view-section">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Frequency</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                  placeholder="E.g., Once daily, Twice daily..."
                  value={newTreatment.frequency}
                  onChange={(e) => setNewTreatment({ ...newTreatment, frequency: e.target.value })}
                />
              </div>
              <div className="view-section">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Duration</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                  placeholder="E.g., 7 days, 2 weeks..."
                  value={newTreatment.duration}
                  onChange={(e) => setNewTreatment({ ...newTreatment, duration: e.target.value })}
                />
              </div>
              <div className="view-section">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Notes</label>
                <textarea
                  style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                  rows="3"
                  value={newTreatment.notes}
                  onChange={(e) => setNewTreatment({ ...newTreatment, notes: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button onClick={() => setShowAddTreatmentModal(false)} className="mypatients-cancel-button">
                  Cancel
                </button>
                <button onClick={handleSubmitTreatment} className="mypatients-submit-button">
                  Save Treatment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Prescription Modal */}
      {showAddPrescriptionModal && (
        <div className="mypatients-modal-overlay" onClick={() => setShowAddPrescriptionModal(false)}>
          <div className="mypatients-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="mypatients-modal-header">
              <h2 className="mypatients-modal-title">Add Prescription</h2>
              <button className="mypatients-modal-close" onClick={() => setShowAddPrescriptionModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="view-modal-body">
              <div className="view-section">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Medication Name *</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                  placeholder="E.g., Amoxicillin, Carprofen..."
                  value={newPrescription.medication}
                  onChange={(e) => setNewPrescription({ ...newPrescription, medication: e.target.value })}
                />
              </div>
              <div className="view-section">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Dose *</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                  placeholder="E.g., 250mg, 5ml..."
                  value={newPrescription.dose}
                  onChange={(e) => setNewPrescription({ ...newPrescription, dose: e.target.value })}
                />
              </div>
              <div className="view-section">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Frequency *</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                  placeholder="E.g., Twice daily, Every 8 hours..."
                  value={newPrescription.frequency}
                  onChange={(e) => setNewPrescription({ ...newPrescription, frequency: e.target.value })}
                />
              </div>
              <div className="view-section">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Duration</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                  placeholder="E.g., 10 days, 2 weeks..."
                  value={newPrescription.duration}
                  onChange={(e) => setNewPrescription({ ...newPrescription, duration: e.target.value })}
                />
              </div>
              <div className="view-section">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Instructions</label>
                <textarea
                  style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                  rows="3"
                  placeholder="E.g., Give with food, avoid dairy..."
                  value={newPrescription.instructions}
                  onChange={(e) => setNewPrescription({ ...newPrescription, instructions: e.target.value })}
                />
              </div>
              <div className="view-section">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Start Date *</label>
                <input
                  type="date"
                  style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                  value={newPrescription.start_date}
                  onChange={(e) => setNewPrescription({ ...newPrescription, start_date: e.target.value })}
                />
              </div>
              <div className="view-section">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>End Date (Optional)</label>
                <input
                  type="date"
                  style={{ width: '100%', padding: '0.875rem', border: '2px solid #e8f0f7', borderRadius: '12px', marginBottom: '1rem' }}
                  value={newPrescription.end_date}
                  onChange={(e) => setNewPrescription({ ...newPrescription, end_date: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button onClick={() => setShowAddPrescriptionModal(false)} className="mypatients-cancel-button">
                  Cancel
                </button>
                <button onClick={handleSubmitPrescription} className="mypatients-submit-button">
                  Save Prescription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PatientProfileModal;