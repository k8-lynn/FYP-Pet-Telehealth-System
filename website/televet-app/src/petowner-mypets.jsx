// petowner-mypets.jsx
import React, { useState } from 'react';
import { Home, MessageCircle, Bell, PawPrint, Stethoscope, Menu, ChevronLeft, ChevronRight, User, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import './styles/petowner-mypets.css';
import PawPattern from "./components/PawPattern";
import PetOwnerNavbar from './components/petowner-navbar';

const PetOwnerMyPets = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPet, setSelectedPet] = useState(null);
  const [activeTab, setActiveTab] = useState('examinations');
  const [showCard, setShowCard] = useState(true);

  const pets = [
    {
      id: 1,
      name: 'Max',
      species: 'Dog',
      breed: 'Golden Retriever',
      gender: 'Male',
      dateOfBirth: '2020-05-15',
      age: '4',
      weight: '30 kg',
      description: 'Friendly and energetic dog who loves to play fetch.',
      profilePic: null
    }
  ];

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
      {/* Sidebar Navigation */}
      <PetOwnerNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="mypets-content">
        {/* Pet Profile Cards Row */}
        {showCard && (
          <div className="pet-cards-row">
            {pets.map(pet => (
              <div 
                key={pet.id} 
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

            {/* Add Pet Card */}
            <div className="pet-card add-pet-card">
              <Plus size={32} color="#888" />
              <div className="add-pet-text">Add Pet</div>
            </div>
          </div>
        )}

        {/* Toggle Arrow - Only show when card is hidden */}
        {selectedPet && !showCard && (
          <div className="toggle-arrow" onClick={toggleCard}>
            <ChevronDown size={32} />
          </div>
        )}

        {/* Pet Details Section */}
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
              {/* Examinations/Medical History Section */}
              <div className="section-box section-left">
                {activeTab === 'examinations' ? (
                  <div className="section-content">
                    <h3>Examinations & Treatment</h3>
                    <p>No examinations or treatments recorded yet.</p>
                  </div>
                ) : (
                  <div className="section-content">
                    <h3>Medical History</h3>
                    <p>No medical history recorded yet.</p>
                  </div>
                )}
              </div>

              {/* Pet Information Section */}
              <div className="section-box pet-info-box">
                <div className="pet-info-image">
                  <PawPrint size={64} color="#888" />
                </div>
                <div className="pet-info-details">
                  <div className="info-row">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{selectedPet.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Species:</span>
                    <span className="info-value">{selectedPet.species}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Breed:</span>
                    <span className="info-value">{selectedPet.breed}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Gender:</span>
                    <span className="info-value">{selectedPet.gender}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Age:</span>
                    <span className="info-value">{selectedPet.age} years</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Weight:</span>
                    <span className="info-value">{selectedPet.weight}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Description:</span>
                    <span className="info-value">{selectedPet.description}</span>
                  </div>
                </div>

                <div className="action-buttons">
                  <button className="btn-delete">
                    <Trash2 size={18} />
                    Delete
                  </button>
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