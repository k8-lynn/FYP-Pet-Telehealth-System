// petowner-mypets.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PawPrint, Plus, Trash2, ChevronDown, X } from 'lucide-react';
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

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      const userId = localStorage.getItem('user_id');
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
      const userId = localStorage.getItem('user_id');
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
        <ProfileNotification firstName={localStorage.getItem("firstName")} />
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
                    <h3>Examinations & Treatment</h3>
                    <p>No examinations or treatments recorded yet.</p>
                  </div>
                ) : (
                  <div className="section-content">
                    <h3>Medical History</h3>

                    {isEditing ? (
                      <>
                        <div className="form-group">
                          <label>Vaccination:</label>
                          <div className="radio-group">
                            <label>
                              <input
                                type="radio"
                                name="hasVaccination"
                                value="yes"
                                checked={selectedPet.hasVaccination === 'yes'}
                                onChange={(e) =>
                                  setSelectedPet({ ...selectedPet, hasVaccination: e.target.value })
                                }
                              />
                              Yes
                            </label>
                            <label>
                              <input
                                type="radio"
                                name="hasVaccination"
                                value="no"
                                checked={selectedPet.hasVaccination === 'no'}
                                onChange={(e) =>
                                  setSelectedPet({ ...selectedPet, hasVaccination: e.target.value })
                                }
                              />
                              No
                            </label>
                          </div>
                        </div>

                        {selectedPet.hasVaccination === 'yes' && (
                          <div className="form-group">
                            <label>Date of Vaccination:</label>
                            <input
                              type="date"
                              name="vaccinationDate"
                              value={selectedPet.vaccinationDate || ''}
                              onChange={(e) =>
                                setSelectedPet({ ...selectedPet, vaccinationDate: e.target.value })
                              }
                            />
                          </div>
                        )}

                        <div className="form-group">
                          <label>Current Medication:</label>
                          <div className="radio-group">
                            <label>
                              <input
                                type="radio"
                                name="hasMedication"
                                value="yes"
                                checked={selectedPet.hasMedication === 'yes'}
                                onChange={(e) =>
                                  setSelectedPet({
                                    ...selectedPet,
                                    hasMedication: e.target.value,
                                  })
                                }
                              />
                              Yes
                            </label>
                            <label>
                              <input
                                type="radio"
                                name="hasMedication"
                                value="no"
                                checked={selectedPet.hasMedication === 'no'}
                                onChange={(e) =>
                                  setSelectedPet({
                                    ...selectedPet,
                                    hasMedication: e.target.value,
                                  })
                                }
                              />
                              No
                            </label>
                          </div>
                        </div>

                        {selectedPet.hasMedication === 'yes' && (
                          <div className="form-group">
                            <label>Medication Details:</label>
                            <textarea
                              name="medicationDetails"
                              value={selectedPet.medicationDetails || ''}
                              onChange={(e) =>
                                setSelectedPet({
                                  ...selectedPet,
                                  medicationDetails: e.target.value,
                                })
                              }
                            />
                          </div>
                        )}

                        <div className="form-group">
                          <label>Allergies:</label>
                          <div className="radio-group">
                            <label>
                              <input
                                type="radio"
                                name="hasAllergies"
                                value="yes"
                                checked={selectedPet.hasAllergies === 'yes'}
                                onChange={(e) =>
                                  setSelectedPet({ ...selectedPet, hasAllergies: e.target.value })
                                }
                              />
                              Yes
                            </label>
                            <label>
                              <input
                                type="radio"
                                name="hasAllergies"
                                value="no"
                                checked={selectedPet.hasAllergies === 'no'}
                                onChange={(e) =>
                                  setSelectedPet({ ...selectedPet, hasAllergies: e.target.value })
                                }
                              />
                              No
                            </label>
                          </div>
                        </div>

                        {selectedPet.hasAllergies === 'yes' && (
                          <div className="form-group">
                            <label>List Allergies:</label>
                            <textarea
                              name="allergies"
                              value={selectedPet.allergies || ''}
                              onChange={(e) =>
                                setSelectedPet({ ...selectedPet, allergies: e.target.value })
                              }
                            />
                          </div>
                        )}

                        <div className="form-group">
                          <label>Diet Type:</label>
                          <textarea
                            name="dietType"
                            value={selectedPet.dietType || ''}
                            onChange={(e) =>
                              setSelectedPet({ ...selectedPet, dietType: e.target.value })
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>Weight (kg):</label>
                          <input
                            type="number"
                            name="weight"
                            value={selectedPet.weight || ''}
                            onChange={(e) =>
                              setSelectedPet({ ...selectedPet, weight: e.target.value })
                            }
                            step="0.1"
                          />
                        </div>

                        <div className="form-group">
                          <label>Behavioral Notes:</label>
                          <textarea
                            name="behavioralNotes"
                            value={selectedPet.behavioralNotes || ''}
                            onChange={(e) =>
                              setSelectedPet({
                                ...selectedPet,
                                behavioralNotes: e.target.value,
                              })
                            }
                          />
                        </div>

                        <p className="last-updated">
                          Last Updated: {formattedDate}
                        </p>


                        <button className="btn-update" onClick={handleUpdatePet}>
                          Save Changes
                        </button>
                      </>
                    ) : (
                      <>
                        <p><strong>Vaccination:</strong> {selectedPet.hasVaccination === 'yes' ? 'Yes' : 'No'}</p>
                        <p>
                          <strong>Vaccination Date:</strong>{' '}
                          {selectedPet.vaccinationDate
                            ? new Date(selectedPet.vaccinationDate).toISOString().split('T')[0]
                            : 'N/A'}
                        </p>
                        <p><strong>Current Medication:</strong> {selectedPet.hasMedication === 'yes' ? 'Yes' : 'No'}</p>
                        <p><strong>Medication Details:</strong> {selectedPet.medicationDetails || 'None'}</p>
                        <p><strong>Allergies:</strong> {selectedPet.hasAllergies === 'yes' ? 'Yes' : 'No'}</p>
                        <p><strong>Allergy Details:</strong> {selectedPet.allergies || 'None'}</p>
                        <p><strong>Diet Type:</strong> {selectedPet.dietType || 'N/A'}</p>
                        <p><strong>Weight:</strong> {selectedPet.weight ? `${selectedPet.weight} kg` : 'N/A'}</p>
                        <p><strong>Behavioral Notes:</strong> {selectedPet.behavioralNotes || 'None'}</p>
                        <p className="last-updated">
                          Last Updated: {formattedDate}
                        </p>


                        <button
                          className="btn-update"
                          onClick={() => setIsEditing(true)}
                        >
                          Update
                        </button>
                      </>
                    )}
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