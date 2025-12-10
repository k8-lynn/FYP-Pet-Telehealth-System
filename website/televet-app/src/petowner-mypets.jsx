// petowner-mypets.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PawPrint, Plus, Trash2, ChevronDown, X, FileText, Activity, Syringe, AlertCircle, Pill, Scale, Scissors } from 'lucide-react';
import './styles/petowner-mypets.css';
import PawPattern from "./components/PawPattern";
import PetOwnerNavbar from './components/petowner-navbar';
import ProfileNotification from "./components/ProfileNotification";



const PetOwnerMyPets = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPet, setSelectedPet] = useState(null);
  const [activeTab, setActiveTab] = useState('examinations');
  const [showCard, setShowCard] = useState(true);
  const [pets, setPets] = useState([]);
  const [showAddPet, setShowAddPet] = useState(false);
  const [addPetStep, setAddPetStep] = useState(1);
  const [message, setMessage] = useState(null); // ✅ for styled notification
  const [confirmDelete, setConfirmDelete] = useState(null); // ✅ for delete confirmation
  const [newPetData, setNewPetData] = useState({
    animalType: '',
    petName: '',
    breed: '',
    age: '',
    gender: '',
    hasVaccination: '',
    vaccinationDate: '',
    hasMedication: '',
    medicationDetails: '',
    hasAllergies: '',
    allergies: '',
    dietType: '',
    weight: '',
    behavioralNotes: ''
  });

  // Mock data for examinations & treatment
const [mockExaminations] = useState([
  {
    appt_id: 1,
    appt_type: 'Check-up',
    consultation_type: 'physical',
    appt_description: 'Annual wellness examination',
    appt_date: '2024-11-15T10:00:00',
    appt_status: 'completed',
    created_at: '2024-11-10T09:00:00',
    updated_at: '2024-11-15T11:30:00',
    vet_name: 'Dr. Sarah Johnson',
    clinic_name: 'Happy Paws Veterinary Clinic',
    soap: {
      subjective: 'Owner reports pet has been eating well, active, no vomiting or diarrhea. Occasional scratching noted.',
      objective: 'Temperature: 38.5°C, Heart Rate: 110 bpm, Respiratory Rate: 28 breaths/min, Weight: 12.5 kg. Coat appears healthy, no external parasites observed. Ears clean, teeth show mild tartar buildup.',
      assessment: 'Overall healthy pet. Mild dental tartar. No immediate concerns.',
      plan: 'Recommend dental cleaning in 3-6 months. Continue current diet. Recheck in 1 year for annual exam.'
    },
    treatments: [
      { type: 'Vaccination', dose: '1ml', frequency: 'Annual', duration: 'Single dose', notes: 'Rabies booster administered' },
      { type: 'Deworming', dose: '250mg', frequency: 'Single dose', duration: '1 day', notes: 'Broad spectrum dewormer' }
    ],
    prescriptions: [
      { 
        medication: 'Dental treats', 
        dose: '1 treat', 
        frequency: 'Daily', 
        duration: 'Ongoing',
        instructions: 'Give after evening meal',
        start_date: '2024-11-15',
        end_date: null
      }
    ]
  },
  {
    appt_id: 2,
    appt_type: 'Vaccination',
    consultation_type: 'physical',
    appt_description: 'Booster vaccinations',
    appt_date: '2024-08-20T14:30:00',
    appt_status: 'completed',
    created_at: '2024-08-15T10:00:00',
    updated_at: '2024-08-20T15:00:00',
    vet_name: 'Dr. Michael Chen',
    clinic_name: 'Happy Paws Veterinary Clinic',
    soap: {
      subjective: 'Routine vaccination visit. No complaints from owner.',
      objective: 'Vitals normal. Weight: 12.3 kg. No abnormalities detected.',
      assessment: 'Healthy, ready for vaccinations.',
      plan: 'Administered DHPP and Bordetella vaccines. Monitor for any reactions. Next vaccines due in 1 year.'
    },
    treatments: [
      { type: 'Vaccination', dose: '1ml', frequency: 'Annual', duration: 'Single dose', notes: 'DHPP combo vaccine' },
      { type: 'Vaccination', dose: '1ml', frequency: 'Annual', duration: 'Single dose', notes: 'Bordetella vaccine' }
    ],
    prescriptions: []
  }
]);

// Mock data for medical history
const [mockMedicalHistory] = useState({
  documents: [
    { id: 1, title: 'Blood Test Results', type: 'lab', date: '2024-11-15', url: '#' },
    { id: 2, title: 'X-Ray - Right Hip', type: 'xray', date: '2024-06-10', url: '#' },
    { id: 3, title: 'Annual Health Report', type: 'report', date: '2024-11-15', url: '#' }
  ],
  vaccinations: [
    { vaccine: 'Rabies', vac_date: '2024-11-15', next_date: '2025-11-15', vet: 'Dr. Sarah Johnson', notes: 'No adverse reactions' },
    { vaccine: 'DHPP', vac_date: '2024-08-20', next_date: '2025-08-20', vet: 'Dr. Michael Chen', notes: 'Annual booster' },
    { vaccine: 'Bordetella', vac_date: '2024-08-20', next_date: '2025-08-20', vet: 'Dr. Michael Chen', notes: 'Kennel cough prevention' }
  ],
  conditions: [
    { condition: 'Mild Dental Tartar', diag_date: '2024-11-15', status: 'active', notes: 'Monitor and schedule cleaning' }
  ],
  currentMedications: [
    { 
      medication: 'Dental treats', 
      dose: '1 treat', 
      frequency: 'Daily', 
      duration: 'Ongoing',
      instructions: 'Give after evening meal',
      start_date: '2024-11-15',
      end_date: null
    }
  ],
  weightLog: [
    { weight: 12.5, date: '2024-11-15', notes: 'Annual checkup' },
    { weight: 12.3, date: '2024-08-20', notes: 'Vaccination visit' },
    { weight: 12.0, date: '2024-05-10', notes: 'Routine checkup' },
    { weight: 11.8, date: '2024-02-15', notes: 'Post-spay checkup' }
  ],
  surgeries: [
    { 
      name: 'Spay Surgery', 
      date: '2024-02-01', 
      vet: 'Dr. Sarah Johnson', 
      notes: 'Routine ovariohysterectomy',
      complications: 'None'
    }
  ]
});

const [expandedExam, setExpandedExam] = useState(null);

const [expandedSections, setExpandedSections] = useState({
  documents: true,
  vaccinations: true,
  conditions: true,
  medications: true,
  weight: true,
  surgeries: true
});

const toggleSection = (section) => {
  setExpandedSections(prev => ({
    ...prev,
    [section]: !prev[section]
  }));
};

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      const userId = sessionStorage.getItem('userid');

      if (!userId) {
        console.error('No user ID found in localStorage');
        return;
      }

      const response = await axios.get(`http://localhost:5000/api/pets/${userId}`);

      // ✅ Map database field names to consistent frontend keys
      const formattedPets = response.data.map(p => ({
        id: p.pet_id,
        name: p.pet_name,
        species: p.pet_species,
        breed: p.pet_breed,
        age: p.pet_age,
        gender: p.pet_gender,
        hasVaccination: p.pet_hasVaccination,
        vaccinationDate: p.pet_vaccinationDate,
        hasMedication: p.pet_hasMedication,
        medicationDetails: p.pet_medicationDetails,
        hasAllergies: p.pet_hasAllergies,
        allergyDetails: p.pet_allergyDetails,
        dietType: p.pet_dietType,
        weight: p.pet_weight,
        behavioralNotes: p.pet_behavioralNotes,
        updatedAt: p.pet_lastUpdated,
      }));

      setPets(formattedPets);
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  };


  const handlePetClick = (pet) => {
    setSelectedPet(pet);
    setShowCard(false);
    setShowAddPet(false);
  };

  const toggleCard = () => {
    setShowCard(true);
    setSelectedPet(null);
    setShowAddPet(false);
  };

  const handleAddPetClick = () => {
    setShowAddPet(true);
    setShowCard(false);
    setSelectedPet(null);
    setAddPetStep(1);
    setNewPetData({
      animalType: '',
      petName: '',
      breed: '',
      age: '',
      gender: '',
      hasVaccination: '',
      vaccinationDate: '',
      hasMedication: '',
      medicationDetails: '',
      hasAllergies: '',
      allergies: '',
      dietType: '',
      weight: '',
      behavioralNotes: ''
    });
  };

  const handleNewPetChange = (e) => {
    const { name, value } = e.target;
    setNewPetData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddPetNext = (e) => {
    e.preventDefault();
    if (addPetStep < 2) {
      setAddPetStep(prev => prev + 1);
    }
  };

  const handleAddPetBack = () => {
    if (addPetStep > 1) {
      setAddPetStep(prev => prev - 1);
    }
  };

  const handleSubmitNewPet = async (e) => {
    e.preventDefault();
    
    try {
      const userId = sessionStorage.getItem('userid');

      if (!userId) {
        console.error('User not logged in');
        return;
      }

      const response = await axios.post('http://localhost:5000/api/add-pet', {
        userId,
        ...newPetData,
        gender: newPetData.gender === 'Male' ? 'm' : 'f'
      });


      // ✅ Removed popup alerts
      console.log(response.data.message || 'Pet added successfully');
      
      fetchPets(); // Refresh the pet list
      setShowAddPet(false);
      setShowCard(true);
    } catch (error) {
      console.error('Error adding pet:', error);
      // Removed alert for failure too (you can log or handle silently)
    }
  };
const handleDeletePet = (petId) => {
  // Instead of immediate deletion, show confirmation modal
  setConfirmDelete(petId);
  setMessage({
    type: 'confirm',
    text: 'Are you sure you want to delete this pet?',
  });
};

const confirmDeletePet = async (confirm) => {
  if (!confirm) {
    setMessage(null);
    setConfirmDelete(null);
    return;
  }

  try {
    await axios.delete(`http://localhost:5000/api/pets/${confirmDelete}`);

    setMessage({
      type: 'success',
      text: 'Pet deleted successfully!',
    });

    fetchPets();
    setSelectedPet(null);
    setShowCard(true);

    // Auto-hide message
    setTimeout(() => setMessage(null), 1000);
  } catch (error) {
    console.error('Error deleting pet:', error);
    setMessage({
      type: 'error',
      text: 'Failed to delete pet. Please try again.',
    });
  } finally {
    setConfirmDelete(null);
  }
};


const handleUpdatePet = async () => {
  if (!selectedPet) return;

  const requiredFields = ['name', 'species', 'breed', 'gender', 'age', 'weight', 'dietType'];
  const emptyFields = requiredFields.filter(
    (field) => !selectedPet[field] || selectedPet[field].toString().trim() === ''
  );

  if (emptyFields.length > 0) {
    setMessage({
      type: 'error',
      text: 'Please fill in all required fields before saving.',
    });
    return;
  }

  try {
    const updatedAt = new Date().toISOString();

    // 🟢 FIXED: Match backend column names
    const payload = {
      pet_name: selectedPet.name,
      pet_species: selectedPet.species,
      pet_breed: selectedPet.breed,
      pet_age: selectedPet.age,
      pet_gender: selectedPet.gender,
      pet_hasVaccination: selectedPet.hasVaccination,
      pet_vaccinationDate: selectedPet.vaccinationDate
        ? new Date(selectedPet.vaccinationDate).toISOString().split('T')[0]
        : null,
      pet_hasMedication: selectedPet.hasMedication,
      pet_medicationDetails: selectedPet.medicationDetails,
      pet_hasAllergies: selectedPet.hasAllergies,
      pet_allergyDetails: selectedPet.allergyDetails,
      pet_dietType: selectedPet.dietType,
      pet_weight: selectedPet.weight,
      pet_behavioralNotes: selectedPet.behavioralNotes,
    };

    await axios.put(`http://localhost:5000/api/pets/${selectedPet.id}`, payload);

    // ✅ Instantly update local state so UI reflects change
    setSelectedPet((prev) => ({ ...prev, updatedAt }));

    setMessage({
      type: 'success',
      text: 'Pet profile updated successfully!',
    });

    fetchPets();
    setIsEditing(false);

    setTimeout(() => setMessage(null), 1000);
  } catch (error) {
    console.error("Error updating pet:", error);
    setMessage({
      type: 'error',
      text: 'Failed to update pet. Please try again.',
    });
  }
};



const [isEditing, setIsEditing] = useState(false);

  // ✅ Add this right before your `return`
  const formattedDate = selectedPet?.updatedAt
    ? new Date(selectedPet.updatedAt).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : 'N/A';





  return (
    
    <div className="mypets-container">
    <PawPattern count={35} />
    <PetOwnerNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

    {/* ✅ Global Notification Overlay (with Yes/Cancel for delete) */}
    {message && (
      <div className="notification-overlay">
        <div className={`notification-modal ${message.type}`}>
          <p>{message.text}</p>

          {/* Show Yes/Cancel only for delete confirmation */}
          {message.type === 'confirm' && (
            <div className="notification-buttons">
              <button
                className="confirm-btn yes"
                onClick={() => confirmDeletePet(true)}
              >
                Yes
              </button>
              <button
                className="confirm-btn cancel"
                onClick={() => confirmDeletePet(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    )}


      <div className="mypets-content">
        <ProfileNotification firstName={sessionStorage.getItem("firstName")} />

        {/* Pet Cards */}
        {showCard && (
          <div className="pet-cards-row">
            {pets.map((pet, index) => (
              <div
                key={index}
                className="pet-card"
                onClick={() => handlePetClick(pet)}
              >
                <div className="pet-card-image">
                  <PawPrint size={64} color="#888" />
                </div>
                <div className="pet-card-name">{pet.name}</div>
                <div className="pet-card-details">
                  <div className="detail-box">
                    {pet.gender === 'm' ? 'Male' : pet.gender === 'f' ? 'Female' : pet.gender}
                  </div>
                  <div className="detail-box">{pet.age} years</div>
                  <div className="detail-box">{pet.weight} kg</div>
                </div>
              </div>
            ))}

            <div className="pet-card add-pet-card" onClick={handleAddPetClick}>
              <Plus size={32} color="#888" />
              <div className="add-pet-text">Add Pet</div>
            </div>
          </div>
        )}

        {/* Toggle Arrow */}
        {(selectedPet || showAddPet) && !showCard && (
          <div className="toggle-arrow" onClick={toggleCard}>
            <ChevronDown size={32} />
          </div>
        )}

        {/* Add Pet Form */}
        {showAddPet && !showCard && (
          <div className="pet-details-section add-pet-form">
            <div className="pet-details-header">
              <h2>Add New Pet</h2>
              <button className="close-btn" onClick={toggleCard}>
                <X size={24} />
              </button>
            </div>

            <div className="details-container">
              <div className="section-box section-wide">
                <form onSubmit={addPetStep === 2 ? handleSubmitNewPet : handleAddPetNext}>
                  {/* Step 1: Pet Basics */}
                  {addPetStep === 1 && (
                    <div className="form-content">
                      <h3>Pet Basics</h3>
                      <div className="form-group">
                        <label>Animal Type:</label>
                        <select name="animalType" value={newPetData.animalType} onChange={handleNewPetChange} required>
                          <option value="">Select</option>
                          <option value="dog">Dog</option>
                          <option value="cat">Cat</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Pet Name:</label>
                        <input type="text" name="petName" value={newPetData.petName} onChange={handleNewPetChange} required />
                      </div>
                      <div className="form-group">
                        <label>Breed:</label>
                        <input type="text" name="breed" value={newPetData.breed} onChange={handleNewPetChange} required />
                      </div>
                     <div className="form-group">
                        <label>Age:</label>
                        <input type="number" name="age" value={newPetData.age}
                              onChange={handleNewPetChange} required min="0" />
                      </div>
                      <div className="form-group">
                        <label>Gender:</label>
                        <select name="gender" value={newPetData.gender} onChange={handleNewPetChange} required>
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                      <div className="form-buttons">
                        <button type="submit" className="btn-next">Next</button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Pet Details */}
                  {addPetStep === 2 && (
                    <div className="form-content">
                      <h3>Medical History</h3>
                      <div className="form-group">
                        <label>Vaccination:</label>
                        <div className="radio-group">
                          <label>
                            <input type="radio" name="hasVaccination" value="yes" checked={newPetData.hasVaccination === 'yes'} onChange={handleNewPetChange} required />
                            Yes
                          </label>
                          <label>
                            <input type="radio" name="hasVaccination" value="no" checked={newPetData.hasVaccination === 'no'} onChange={handleNewPetChange} />
                            No
                          </label>
                        </div>
                      </div>
                      {newPetData.hasVaccination === 'yes' && (
                        <div className="form-group">
                          <label>Date of Vaccination:</label>
                          <input type="date" name="vaccinationDate" value={newPetData.vaccinationDate} onChange={handleNewPetChange} required />
                        </div>
                      )}

                      <div className="form-group">
                        <label>Current Medication:</label>
                        <div className="radio-group">
                          <label>
                            <input type="radio" name="hasMedication" value="yes" checked={newPetData.hasMedication === 'yes'} onChange={handleNewPetChange} required />
                            Yes
                          </label>
                          <label>
                            <input type="radio" name="hasMedication" value="no" checked={newPetData.hasMedication === 'no'} onChange={handleNewPetChange} />
                            No
                          </label>
                        </div>
                      </div>
                      {newPetData.hasMedication === 'yes' && (
                        <div className="form-group">
                          <label>Medication Details:</label>
                          <textarea name="medicationDetails" value={newPetData.medicationDetails} onChange={handleNewPetChange} required />
                        </div>
                      )}

                      <h3>Allergies</h3>
                      <div className="form-group">
                        <label>Do they have allergies?</label>
                        <div className="radio-group">
                          <label>
                            <input type="radio" name="hasAllergies" value="yes" checked={newPetData.hasAllergies === 'yes'} onChange={handleNewPetChange} required />
                            Yes
                          </label>
                          <label>
                            <input type="radio" name="hasAllergies" value="no" checked={newPetData.hasAllergies === 'no'} onChange={handleNewPetChange} />
                            No
                          </label>
                        </div>
                      </div>
                      {newPetData.hasAllergies === 'yes' && (
                        <div className="form-group">
                          <label>List Allergies:</label>
                          <textarea name="allergies" value={newPetData.allergies} onChange={handleNewPetChange} placeholder="E.g., pollen, chicken, dairy" required />
                        </div>
                      )}

                      <h3>Diet</h3>
                      <div className="form-group">
                        <label>Diet Type:</label>
                        <textarea name="dietType" value={newPetData.dietType} onChange={handleNewPetChange} placeholder="E.g., commercial food types (dry, wet, semi-moist), home-cooked, and raw meat-based" required />
                      </div>

                      <h3>Weight</h3>
                      <div className="form-group">
                        <label>Weight (kg):</label>
                        <input type="number" name="weight" value={newPetData.weight} onChange={handleNewPetChange} placeholder="0.0" step="0.1" required />
                      </div>

                      <h3>Behavioral Notes</h3>
                      <div className="form-group">
                        <textarea name="behavioralNotes" value={newPetData.behavioralNotes} onChange={handleNewPetChange} placeholder="E.g., aggression, anxiety, chewing" />
                      </div>

                      <div className="form-buttons">
                        <button type="submit" className="btn-submit">Add Pet</button>
                        <button type="button" onClick={handleAddPetBack} className="btn-back">Back</button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Pet Details */}
        {selectedPet && !showCard && !showAddPet && (
          <div className="pet-details-section">

            
            

            <div className="pet-details-header">
              <h2>{selectedPet.name}</h2>
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'examinations' ? 'active' : ''}`}
                  onClick={() => setActiveTab('examinations')}
                >
                  Examinations & Treatment
                </button>
                <button
                  className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  Medical History
                </button>
              </div>
            </div>


            <div className="details-container">
              {/* Medical History */}
              <div className="section-box section-left">
                {activeTab === 'examinations' ? (
                  <div className="section-content">
                    <h3>Examinations & Treatment History</h3>
                    
                    {mockExaminations.length === 0 ? (
                      <p className="no-data">No examinations or treatments recorded yet.</p>
                    ) : (
                      <div className="examinations-list">
                        {mockExaminations.map((exam) => (
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
                                {/* SOAP Notes */}
                                {exam.soap && (
                                  <div className="soap-section">
                                    <h4>SOAP Notes</h4>
                                    <div className="soap-item">
                                      <strong>Subjective (Owner Report):</strong>
                                      <p>{exam.soap.subjective}</p>
                                    </div>
                                    <div className="soap-item">
                                      <strong>Objective (Exam Findings):</strong>
                                      <p>{exam.soap.objective}</p>
                                    </div>
                                    <div className="soap-item">
                                      <strong>Assessment (Diagnosis):</strong>
                                      <p>{exam.soap.assessment}</p>
                                    </div>
                                    <div className="soap-item">
                                      <strong>Plan (Treatment):</strong>
                                      <p>{exam.soap.plan}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Treatments */}
                                {exam.treatments && exam.treatments.length > 0 && (
                                  <div className="treatments-section">
                                    <h4>Treatments Administered</h4>
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
                                  </div>
                                )}

                                {/* Prescriptions */}
                                {exam.prescriptions && exam.prescriptions.length > 0 && (
                                  <div className="prescriptions-section">
                                    <h4>Prescriptions</h4>
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
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="section-content medical-history">
                    <h3>Medical History</h3>

                    {/* Documents */}
                    <div className="history-section">
                      <h4 onClick={() => toggleSection('documents')} className="collapsible-header">
                        <span className="header-with-icon">
                          <FileText size={20} />
                          Documents & Attachments
                        </span>
                        <ChevronDown 
                          size={20} 
                          className={`section-expand-icon ${expandedSections.documents ? 'expanded' : ''}`}
                        />
                      </h4>
                      {expandedSections.documents && (
                        <>
                          <div className="section-actions">
                            <button className="btn-add-section">
                              <Plus size={16} /> Upload Document
                            </button>
                          </div>
                          {mockMedicalHistory.documents.length === 0 ? (
                            <p className="no-data">No documents uploaded.</p>
                          ) : (
                            <div className="documents-grid">
                              {mockMedicalHistory.documents.map((doc) => (
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
                    </div>

                    {/* Vaccinations */}
                    <div className="history-section">
                      <h4 onClick={() => toggleSection('vaccinations')} className="collapsible-header">
                        <span className="header-with-icon">
                          <Syringe size={20} />
                          Vaccination History
                        </span>
                        <ChevronDown 
                          size={20} 
                          className={`section-expand-icon ${expandedSections.vaccinations ? 'expanded' : ''}`}
                        />
                      </h4>
                      {expandedSections.vaccinations && (
                        <>
                          <div className="section-actions">
                            <button className="btn-add-section">
                              <Plus size={16} /> Add Vaccination
                            </button>
                          </div>
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
                              {mockMedicalHistory.vaccinations.map((vac, idx) => (
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
                        </>
                      )}
                    </div>

                    {/* Chronic Conditions */}
                    <div className="history-section">
                      <h4 onClick={() => toggleSection('conditions')} className="collapsible-header">
                        <span className="header-with-icon">
                          <AlertCircle size={20} />
                          Chronic Conditions & Diagnoses
                        </span>
                        <ChevronDown 
                          size={20} 
                          className={`section-expand-icon ${expandedSections.conditions ? 'expanded' : ''}`}
                        />
                      </h4>
                      {expandedSections.conditions && (
                        <>
                          <div className="section-actions">
                            <button className="btn-add-section">
                              <Plus size={16} /> Add Condition
                            </button>
                          </div>
                          {mockMedicalHistory.conditions.length === 0 ? (
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
                                {mockMedicalHistory.conditions.map((cond, idx) => (
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
                    </div>

                    {/* Current Medications */}
                    <div className="history-section">
                      <h4 onClick={() => toggleSection('medications')} className="collapsible-header">
                        <span className="header-with-icon">
                          <Pill size={20} />
                          Current Medications
                        </span>
                        <ChevronDown 
                          size={20} 
                          className={`section-expand-icon ${expandedSections.medications ? 'expanded' : ''}`}
                        />
                      </h4>
                      {expandedSections.medications && (
                        <>
                          <div className="section-actions">
                            <button className="btn-add-section">
                              <Plus size={16} /> Add Medication
                            </button>
                          </div>
                          {mockMedicalHistory.currentMedications.length === 0 ? (
                            <p className="no-data">No current medications.</p>
                          ) : (
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>Medication</th>
                                  <th>Dose</th>
                                  <th>Frequency</th>
                                  <th>Instructions</th>
                                  <th>Started</th>
                                </tr>
                              </thead>
                              <tbody>
                                {mockMedicalHistory.currentMedications.map((med, idx) => (
                                  <tr key={idx}>
                                    <td>{med.medication}</td>
                                    <td>{med.dose}</td>
                                    <td>{med.frequency}</td>
                                    <td>{med.instructions}</td>
                                    <td>{new Date(med.start_date).toLocaleDateString('en-GB')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </>
                      )}
                    </div>

                    {/* Weight Tracking */}
                    <div className="history-section">
                      <h4 onClick={() => toggleSection('weight')} className="collapsible-header">
                        <span className="header-with-icon">
                          <Scale size={20} />
                          Weight Tracking
                        </span>
                        <ChevronDown 
                          size={20} 
                          className={`section-expand-icon ${expandedSections.weight ? 'expanded' : ''}`}
                        />
                      </h4>
                      {expandedSections.weight && (
                        <>
                          <div className="section-actions">
                            <button className="btn-add-section">
                              <Plus size={16} /> Add Weight Entry
                            </button>
                          </div>
                          <div className="weight-chart">
                            {mockMedicalHistory.weightLog.map((log, idx) => (
                              <div key={idx} className="weight-entry">
                                <span className="weight-value">{log.weight} kg</span>
                                <span className="weight-date">{new Date(log.date).toLocaleDateString('en-GB')}</span>
                                {log.notes && <span className="weight-notes">{log.notes}</span>}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Surgical History */}
                    <div className="history-section">
                      <h4 onClick={() => toggleSection('surgeries')} className="collapsible-header">
                        <span className="header-with-icon">
                          <Scissors size={20} />
                          Surgical History
                        </span>
                        <ChevronDown 
                          size={20} 
                          className={`section-expand-icon ${expandedSections.surgeries ? 'expanded' : ''}`}
                        />
                      </h4>
                      {expandedSections.surgeries && (
                        <>
                          <div className="section-actions">
                            <button className="btn-add-section">
                              <Plus size={16} /> Add Surgery
                            </button>
                          </div>
                          {mockMedicalHistory.surgeries.length === 0 ? (
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
                                {mockMedicalHistory.surgeries.map((surg, idx) => (
                                  <tr key={idx}>
                                    <td>{surg.name}</td>
                                    <td>{new Date(surg.date).toLocaleDateString('en-GB')}</td>
                                    <td>{surg.vet}</td>
                                    <td>{surg.notes}</td>
                                    <td>{surg.complications}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Pet Information */}
              <div className="section-box pet-info-box">
                <div className="pet-info-image">
                  <PawPrint size={64} color="#888" />
                </div>
                <div className="pet-info-details">
                {/* Name */}
                <div className="info-row">
                  <span className="info-label">Name:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedPet.name}
                      onChange={(e) => setSelectedPet({ ...selectedPet, name: e.target.value })}
                    />
                  ) : (
                    <span>{selectedPet.name}</span>
                  )}
                </div>

                {/* Species */}
                <div className="info-row">
                  <span className="info-label">Species:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedPet.species}
                      onChange={(e) => setSelectedPet({ ...selectedPet, species: e.target.value })}
                    />
                  ) : (
                    <span>{selectedPet.species}</span>
                  )}
                </div>

                {/* Breed */}
                <div className="info-row">
                  <span className="info-label">Breed:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedPet.breed}
                      onChange={(e) => setSelectedPet({ ...selectedPet, breed: e.target.value })}
                    />
                  ) : (
                    <span>{selectedPet.breed}</span>
                  )}
                </div>

                {/* Gender */}
                <div className="info-row">
                  <span className="info-label">Gender:</span>
                  {isEditing ? (
                    <select
                      value={selectedPet.gender}
                      onChange={(e) => setSelectedPet({ ...selectedPet, gender: e.target.value })}
                    >
                      <option value="m">Male</option>
                      <option value="f">Female</option>
                    </select>
                  ) : (
                    <span>{selectedPet.gender === 'm' ? 'Male' : selectedPet.gender === 'f' ? 'Female' : selectedPet.gender}</span>
                  )}
                </div>

                {/* Age */}
                <div className="info-row">
                  <span className="info-label">Age:</span>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={selectedPet.age}
                      onChange={(e) => setSelectedPet({ ...selectedPet, age: e.target.value })}
                    />
                  ) : (
                    <span>{selectedPet.age} years</span>
                  )}
                </div>

                {/* Weight */}
                <div className="info-row">
                  <span className="info-label">Weight:</span>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.1"
                      value={selectedPet.weight}
                      onChange={(e) => setSelectedPet({ ...selectedPet, weight: e.target.value })}
                    />
                  ) : (
                    <span>{selectedPet.weight} kg</span>
                  )}
                </div>

                {/* Diet Type */}
                <div className="info-row">
                  <span className="info-label">Diet Type:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedPet.dietType}
                      onChange={(e) => setSelectedPet({ ...selectedPet, dietType: e.target.value })}
                    />
                  ) : (
                    <span>{selectedPet.dietType || 'N/A'}</span>
                  )}
                </div>

                {/* Behavioral Notes */}
                <div className="info-row">
                  <span className="info-label">Behavioral Notes:</span>
                  {isEditing ? (
                    <textarea
                      rows="3"
                      value={selectedPet.behavioralNotes}
                      onChange={(e) => setSelectedPet({ ...selectedPet, behavioralNotes: e.target.value })}
                    />
                  ) : (
                    <span>{selectedPet.behavioralNotes || 'N/A'}</span>
                  )}
                </div>
              </div>


                <div className="action-buttons">
                  {/* Delete Button */}
                  <button
                    className="btn-delete"
                    onClick={() => handleDeletePet(selectedPet.id)}
                  >
                    <Trash2 size={18} /> Delete
                  </button>

                  {/* Update / Save Button */}
                  {isEditing ? (
                    <button className="btn-update" onClick={handleUpdatePet}>
                      Save Changes
                    </button>
                  ) : (
                    <button className="btn-update" onClick={() => setIsEditing(true)}>
                      Update
                    </button>
                  )}

                  {/* Export Button */}
                  <button className="btn-export">Export</button>
                </div>


               
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetOwnerMyPets;