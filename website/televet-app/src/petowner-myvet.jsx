import React, { useState, useEffect } from "react";
import { MapPin, Search, Clock, Phone, Mail, Calendar, CheckCircle, X } from 'lucide-react';
import './styles/petowner-myvet.css';
import PawPattern from "./components/PawPattern";
import PetOwnerNavbar from './components/petowner-navbar';
import ProfileNotification from "./components/ProfileNotification";

const MyVet = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState(null);
  const [vets, setVets] = useState([]);
  const [selectedVet, setSelectedVet] = useState(null);
  const [registeredVet, setRegisteredVet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  useEffect(() => {
    const storedName = sessionStorage.getItem('firstName');
    if (storedName) setFirstName(storedName);
  }, []);

  // Mock availability data
  const mockAvailability = [
    { day: "Monday", time: "9:00 AM - 5:00 PM", status: "Available" },
    { day: "Tuesday", time: "9:00 AM - 5:00 PM", status: "Available" },
    { day: "Wednesday", time: "9:00 AM - 5:00 PM", status: "Available" },
    { day: "Thursday", time: "9:00 AM - 5:00 PM", status: "Available" },
    { day: "Friday", time: "9:00 AM - 5:00 PM", status: "Available" },
    { day: "Saturday", time: "10:00 AM - 2:00 PM", status: "Limited" },
    { day: "Sunday", time: "Closed", status: "Closed" }
  ];

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude, lon: longitude });
          fetchVetsNearby(latitude, longitude);
        },
        () => alert("Unable to retrieve location.")
      );
    } else {
      alert("Geolocation not supported.");
    }
  };

  const handleSearch = async () => {
    if (!location.trim()) return alert("Enter a location.");
    setLoading(true);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
    );
    const data = await res.json();
    if (data.length === 0) {
      alert("Location not found.");
      setLoading(false);
      return;
    }
    const { lat, lon } = data[0];
    setCoords({ lat, lon });
    fetchVetsNearby(lat, lon);
  };

  const fetchVetsNearby = async (lat, lon) => {
    setLoading(true);
    const res = await fetch(
      `http://localhost:5000/api/vets-nearby?lat=${lat}&lon=${lon}`
    );
    const data = await res.json();

    const topVets = data
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    setVets(topVets);
    setLoading(false);
  };

  const handleSelectVet = (vet) => {
    setSelectedVet(vet);
  };

  const handleRegisterVet = () => {
    if (selectedVet) {
      setRegisteredVet(selectedVet);
      setShowSuccessNotification(true);
      setShowSearchModal(false);
      setVets([]);
      setSelectedVet(null);
      setLocation("");
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowSuccessNotification(false);
      }, 3000);
    }
  };

  return (
    <div className="myvet-dashboard-container">
      <PawPattern count={35} />
      <PetOwnerNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="myvet-main-content">
        <ProfileNotification firstName={firstName} />

        {/* Success Notification */}
        {showSuccessNotification && (
          <div className="myvet-success-notification">
            <CheckCircle size={24} />
            <span>Successfully registered into {registeredVet?.va_clinicName}!</span>
          </div>
        )}

        {/* Main Content */}
        {!registeredVet ? (
          <div className="myvet-empty-state">
            <div className="myvet-empty-card">
              <MapPin size={64} className="myvet-empty-icon" />
              <h2>Find Your Nearest Veterinarian</h2>
              <p>Connect with trusted veterinary clinics in your area</p>
              <button 
                className="myvet-find-button"
                onClick={() => setShowSearchModal(true)}
              >
                <Search size={20} />
                Find Veterinarian
              </button>
            </div>
          </div>
        ) : (
          <div className="myvet-content-wrapper">
            {/* Vet Info Card */}
            <div className="myvet-info-section">
              <div className="myvet-header-card">
                <div className="myvet-header-content">
                  <div className="myvet-clinic-badge">
                    <MapPin size={20} />
                    <span>Your Veterinary Clinic</span>
                  </div>
                  <h1 className="myvet-clinic-name">{registeredVet.va_clinicName}</h1>
                  <p className="myvet-clinic-location">{registeredVet.va_vetLocation}</p>
                </div>
                <button 
                  className="myvet-change-button"
                  onClick={() => {
                    setRegisteredVet(null);
                    setShowSearchModal(true);
                  }}
                >
                  Change Clinic
                </button>
              </div>

              <div className="myvet-details-grid">
                <div className="myvet-detail-card">
                  <div className="myvet-detail-icon phone">
                    <Phone size={20} />
                  </div>
                  <div className="myvet-detail-content">
                    <span className="myvet-detail-label">Phone</span>
                    <span className="myvet-detail-value">{registeredVet.va_clinicPhone}</span>
                  </div>
                </div>

                <div className="myvet-detail-card">
                  <div className="myvet-detail-icon email">
                    <Mail size={20} />
                  </div>
                  <div className="myvet-detail-content">
                    <span className="myvet-detail-label">Email</span>
                    <span className="myvet-detail-value">{registeredVet.va_clinicEmail}</span>
                  </div>
                </div>

                <div className="myvet-detail-card">
                  <div className="myvet-detail-icon location">
                    <MapPin size={20} />
                  </div>
                  <div className="myvet-detail-content">
                    <span className="myvet-detail-label">Distance</span>
                    <span className="myvet-detail-value">{registeredVet.distance?.toFixed(2)} km away</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Availability & Booking */}
            <div className="myvet-booking-section">
              {/* Availability Schedule */}
              <div className="myvet-availability-card">
                <div className="myvet-section-header">
                  <Clock size={24} />
                  <h3>Clinic Hours</h3>
                </div>
                <div className="myvet-schedule-list">
                  {mockAvailability.map((schedule, index) => (
                    <div key={index} className="myvet-schedule-item">
                      <span className="myvet-schedule-day">{schedule.day}</span>
                      <span className="myvet-schedule-time">{schedule.time}</span>
                      <span className={`myvet-schedule-status ${schedule.status.toLowerCase()}`}>
                        {schedule.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Book Appointment Card */}
              <div className="myvet-appointment-card">
                <Calendar size={48} className="myvet-appointment-icon" />
                <h3>Ready to Schedule?</h3>
                <p>Book an appointment with {registeredVet.va_clinicName}</p>
                <button className="myvet-book-button">
                  <Calendar size={20} />
                  Book Appointment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Modal */}
        {showSearchModal && (
          <div className="myvet-modal-overlay" onClick={() => setShowSearchModal(false)}>
            <div className="myvet-modal-content" onClick={(e) => e.stopPropagation()}>
              <button 
                className="myvet-modal-close"
                onClick={() => setShowSearchModal(false)}
              >
                <X size={24} />
              </button>

              <div className="myvet-modal-header">
                <MapPin size={48} className="myvet-modal-icon" />
                <h2>Find Your Nearest Veterinarian</h2>
                <p>Enter your location to discover trusted clinics nearby</p>
              </div>

              <div className="myvet-search-controls">
                <div className="myvet-search-bar">
                  <Search size={20} className="myvet-search-icon" />
                  <input
                    type="text"
                    placeholder="Enter your city or address..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="myvet-search-buttons">
                  <button onClick={handleSearch} className="myvet-search-button">
                    <Search size={18} />
                    Search
                  </button>
                  <button onClick={handleUseLocation} className="myvet-location-button">
                    <MapPin size={18} />
                    Use My Location
                  </button>
                </div>
              </div>

              {loading && (
                <div className="myvet-loading">
                  <div className="myvet-loading-spinner"></div>
                  <p>Finding nearby veterinarians...</p>
                </div>
              )}

              {!loading && vets.length === 0 && coords && (
                <div className="myvet-no-results">
                  <p>No veterinarians found in this area</p>
                </div>
              )}

              {vets.length > 0 && (
                <div className="myvet-results">
                  <h3 className="myvet-results-title">
                    {vets.length} Veterinarian{vets.length > 1 ? 's' : ''} Found
                  </h3>
                  <div className="myvet-vets-list">
                    {vets.map((vet, index) => (
                      <div
                        key={vet.va_id}
                        className={`myvet-vet-card ${selectedVet?.va_id === vet.va_id ? 'selected' : ''} ${index === 0 ? 'recommended' : ''}`}
                        onClick={() => handleSelectVet(vet)}
                      >
                        {index === 0 && (
                          <div className="myvet-recommended-badge">
                            <CheckCircle size={16} />
                            Nearest & Recommended
                          </div>
                        )}
                        <h4>{vet.va_clinicName}</h4>
                        <div className="myvet-vet-info">
                          <div className="myvet-vet-detail">
                            <MapPin size={16} />
                            <span>{vet.va_vetLocation}</span>
                          </div>
                          <div className="myvet-vet-detail">
                            <Phone size={16} />
                            <span>{vet.va_clinicPhone}</span>
                          </div>
                          <div className="myvet-vet-detail">
                            <Mail size={16} />
                            <span>{vet.va_clinicEmail}</span>
                          </div>
                        </div>
                        <div className="myvet-vet-distance">
                          {vet.distance?.toFixed(2)} km away
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedVet && (
                    <button 
                      className="myvet-register-button"
                      onClick={handleRegisterVet}
                    >
                      <CheckCircle size={20} />
                      Register with {selectedVet.va_clinicName}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyVet;