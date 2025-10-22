import React, { useState, useEffect } from "react";
import { MapPin, Search, Clock, Phone, Mail, Calendar, CheckCircle, X } from 'lucide-react';
import './styles/petowner-myvet.css';
import PawPattern from "./components/PawPattern";
import PetOwnerNavbar from './components/petowner-navbar';
import ProfileNotification from "./components/ProfileNotification";
import BookAppointment from './components/bookAppointment';

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
  const [clinicHours, setClinicHours] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  

  useEffect(() => {
    const storedName = sessionStorage.getItem('firstName');
    if (storedName) setFirstName(storedName);
  }, []);

  useEffect(() => {
    const fetchAssignedClinic = async () => {
      const usr_id = sessionStorage.getItem('userid');
      if (!usr_id) return;
  
      try {
        const res = await fetch(`http://localhost:5000/api/user-clinic/${usr_id}`);
        const data = await res.json();
  
        if (data.clinic) {
          console.log("📍 Assigned clinic found:", data.clinic);
          const vetRes = await fetch(`http://localhost:5000/api/vet-by-name/${encodeURIComponent(data.clinic)}`);
          const vetData = await vetRes.json();
  
          if (vetRes.ok && vetData) {
            // 🧭 Get user's current location for distance calculation
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const { latitude, longitude } = pos.coords;
                  const distance = calculateDistance(latitude, longitude, vetData.va_lat, vetData.va_lon);
                  vetData.distance = distance;
                  setRegisteredVet(vetData);
                },
                (err) => {
                  console.warn("⚠️ Could not get user location:", err);
                  setRegisteredVet(vetData); // Still show vet without distance
                }
              );
            } else {
              setRegisteredVet(vetData);
            }
  
            // 📅 Fetch clinic hours (MOVED OUTSIDE geolocation check)
            if (vetData.clinic_id) {
              try {
                const hoursRes = await fetch(`http://localhost:5000/api/clinic-hours/${vetData.clinic_id}`);
                console.log("🟢 Fetching clinic hours from:", `http://localhost:5000/api/clinic-hours/${vetData.clinic_id}`);
              
                const hoursData = await hoursRes.json();
                console.log("📦 Raw clinic hours response:", hoursData);
              
                if (hoursRes.ok && hoursData) {
                  console.log("✅ Clinic hours successfully retrieved:", hoursData);
                  setClinicHours(hoursData);
                } else {
                  console.warn("⚠️ No clinic hours found or response not OK.");
                  setClinicHours(null);
                }
              } catch (err) {
                console.error("❌ Error fetching clinic hours:", err);
                setClinicHours(null);
              }
            } else {
              console.warn("⚠️ No clinic_id found for this vet");
              setClinicHours(null);
            }
  
          } else {
            console.warn("⚠️ Vet not found for:", data.clinic);
          }
        }
      } catch (error) {
        console.error("❌ Error fetching assigned clinic:", error);
      }
    };
  
    fetchAssignedClinic();
  }, []);
  
  // 📏 Haversine formula for distance in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  
  


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

  const handleRegisterVet = async () => {
    if (selectedVet) {
      try {
        // 🧍‍♀️ Get logged-in user ID from sessionStorage
        const usr_id = sessionStorage.getItem('userid');
        if (!usr_id) {
          alert("User not logged in.");
          return;
        }
  
        // 📨 Send the clinic name to backend
        const res = await fetch("http://localhost:5000/api/assign-clinic", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usr_id,
            clinicName: selectedVet.va_clinicName
          }),
        });
  
        const data = await res.json();
  
        if (res.ok) {
          console.log("✅ Backend update:", data.message);
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
        } else {
          console.error("❌ Failed to update:", data.error);
          alert("Failed to register clinic. Please try again.");
        }
      } catch (error) {
        console.error("❌ Error:", error);
        alert("An error occurred while registering the clinic.");
      }
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
                {!clinicHours ? (
                  <p className="myvet-no-hours">No set clinic hours yet.</p>
                ) : (
                  Object.entries({
                    Monday: clinicHours.monday_hours,
                    Tuesday: clinicHours.tuesday_hours,
                    Wednesday: clinicHours.wednesday_hours,
                    Thursday: clinicHours.thursday_hours,
                    Friday: clinicHours.friday_hours,
                    Saturday: clinicHours.saturday_hours,
                    Sunday: clinicHours.sunday_hours,
                  }).map(([day, hours], index) => {
                    // Check if hours exists and is not closed
                    const isClosed = !hours || hours.status === 'Closed' || !hours.opening || !hours.closing;
                    const timeDisplay = isClosed 
                      ? "Closed" 
                      : `${hours.opening} - ${hours.closing}`;
                    
                    // Use the actual status from the database
                    const status = isClosed ? "Closed" : hours.status;
                    
                    // Determine CSS class based on status
                    const statusClass = isClosed ? "closed" : 
                                      status === "Limited" ? "limited" : 
                                      "available";
                    
                    return (
                      <div key={index} className="myvet-schedule-item">
                        <span className="myvet-schedule-day">{day}</span>
                        <span className="myvet-schedule-time">{timeDisplay}</span>
                        <span className={`myvet-schedule-status ${statusClass}`}>
                          {status}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              </div>

              {/* Book Appointment Card */}
              <div className="myvet-appointment-card">
              <div className="myvet-appointment-icon">
                  <Calendar size={48} />
                </div>
                <h3>Book an Appointment</h3>
                <p>Schedule your next visit with us</p>
                <button 
                  className="myvet-book-button"
                  onClick={() => setShowBookingModal(true)}
                >
                  <Calendar size={20} />
                  Book Now
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
      {/* Booking Modal */}
      {showBookingModal && registeredVet && (
        <div className="myvet-modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <BookAppointment 
              clinicId={registeredVet.clinic_id} 
              onClose={() => setShowBookingModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MyVet;