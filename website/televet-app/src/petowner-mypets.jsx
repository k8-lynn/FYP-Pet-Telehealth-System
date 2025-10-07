import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PawPrint, Plus, Trash2, ChevronDown } from 'lucide-react';
import './styles/petowner-mypets.css';
import PawPattern from "./components/PawPattern";
import PetOwnerNavbar from './components/petowner-navbar';

const PetOwnerMyPets = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPet, setSelectedPet] = useState(null);
  const [activeTab, setActiveTab] = useState('examinations');
  const [showCard, setShowCard] = useState(true);
  const [pets, setPets] = useState([]);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        // Assuming user_id is stored after login
        const userId = localStorage.getItem('user_id');
        if (!userId) {
          console.error('No user ID found in localStorage');
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/pets/${userId}`);
        setPets(response.data);
      } catch (error) {
        console.error('Error fetching pets:', error);
      }
    };

    fetchPets();
  }, []);

  const handlePetClick = (pet) => {
    setSelectedPet(pet);
    setShowCard(false);
  };

  const toggleCard = () => {
    setShowCard(true);
  };

  return (
    <div className="mypets-container">
      <PawPattern count={35} />
      <PetOwnerNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="mypets-content">
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
                  <div className="detail-box">{pet.gender}</div>
                  <div className="detail-box">{pet.age} years</div>
                  <div className="detail-box">{pet.weight}</div>
                </div>
              </div>
            ))}

            <div className="pet-card add-pet-card">
              <Plus size={32} color="#888" />
              <div className="add-pet-text">Add Pet</div>
            </div>
          </div>
        )}

        {/* Toggle Arrow */}
        {selectedPet && !showCard && (
          <div className="toggle-arrow" onClick={toggleCard}>
            <ChevronDown size={32} />
          </div>
        )}

        {/* Pet Details */}
        {selectedPet && !showCard && (
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
                    <p><strong>Vaccination:</strong> {selectedPet.hasVaccination ? 'Yes' : 'No'}</p>
                    <p><strong>Vaccination Date:</strong> {selectedPet.vaccinationDate || 'N/A'}</p>
                    <p><strong>Current Medication:</strong> {selectedPet.hasCurrentMedication ? 'Yes' : 'No'}</p>
                    <p><strong>Medication Details:</strong> {selectedPet.medicationDetails || 'None'}</p>
                    <p><strong>Has Allergies:</strong> {selectedPet.hasAllergies ? 'Yes' : 'No'}</p>
                    <p><strong>Allergies:</strong> {selectedPet.allergies || 'None'}</p>
                  </div>
                )}
              </div>

              {/* Pet Information */}
              <div className="section-box pet-info-box">
                <div className="pet-info-image">
                  <PawPrint size={64} color="#888" />
                </div>
                <div className="pet-info-details">
                  <div className="info-row"><span className="info-label">Name:</span> <span>{selectedPet.name}</span></div>
                  <div className="info-row"><span className="info-label">Species:</span> <span>{selectedPet.species}</span></div>
                  <div className="info-row"><span className="info-label">Breed:</span> <span>{selectedPet.breed}</span></div>
                  <div className="info-row"><span className="info-label">Gender:</span> <span>{selectedPet.gender}</span></div>
                  <div className="info-row"><span className="info-label">Age:</span> <span>{selectedPet.age} years</span></div>
                  <div className="info-row"><span className="info-label">Weight:</span> <span>{selectedPet.weight}</span></div>
                  <div className="info-row"><span className="info-label">Diet Type:</span> <span>{selectedPet.dietType}</span></div>
                  <div className="info-row"><span className="info-label">Behavioral Notes:</span> <span>{selectedPet.behavioralNotes}</span></div>
                </div>

                <div className="action-buttons">
                  <button className="btn-delete"><Trash2 size={18} /> Delete</button>
                  <button className="btn-update">Update</button>
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
