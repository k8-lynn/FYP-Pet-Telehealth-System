//petowner-myvet.jsx
import React, { useState, useEffect } from "react";
import { MapPin, Search, Clock, Phone, Mail, Calendar, CheckCircle, X } from 'lucide-react';
import io from 'socket.io-client';
import './styles/petowner-myvet.css';
import PawPattern from "./components/PawPattern";
import PetOwnerNavbar from './components/petowner-navbar';
import ProfileNotification from "./components/ProfileNotification";
import BookAppointment from './components/bookAppointment';
import Toast from './components/toast';
import showStyledAlert from './utils/styledAlert';

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
  const [clinicStatus, setClinicStatus] = useState('closed'); // 'open', 'closed', 'temporarily closed'
  const [showBookingToast, setShowBookingToast] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  // Socket.IO connection
  useEffect(() => {
    const socket = io('https://fyp-pet-telehealth-system.onrender.com');

    socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
    });

    socket.on('clinicStatusUpdated', (data) => {
      console.log('🔔 Clinic status updated:', data);
      // Update status if it's for our registered clinic
      if (registeredVet && data.clinic_id === registeredVet.clinic_id) {
        setClinicStatus(data.status);
      }
      
    });

    socket.on('clinicHoursUpdated', (data) => {
      console.log('🔔 Clinic hours updated:', data);
      // Update hours if it's for our registered clinic
      if (registeredVet && data.clinic_id === registeredVet.clinic_id) {
        // ✅ Parse JSON strings in the hours data
        const parsedHours = {};
        const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        daysOfWeek.forEach(day => {
          const field = `${day}_hours`;
          if (data.hours[field]) {
            try {
              // Parse if it's a string, otherwise use as-is
              parsedHours[field] = typeof data.hours[field] === 'string' 
                ? JSON.parse(data.hours[field]) 
                : data.hours[field];
            // eslint-disable-next-line no-unused-vars
            } catch (e) {
              console.warn(`⚠️ Could not parse ${field}:`, data.hours[field]);
              parsedHours[field] = null;
            }
          } else {
            parsedHours[field] = null;
          }
        });
        
        setClinicHours(parsedHours);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.IO server');
    });

    return () => {
      socket.disconnect();
    };
  }, [registeredVet]);

  useEffect(() => {
    const storedName = sessionStorage.getItem('firstName');
    if (storedName) setFirstName(storedName);
  }, []);

  useEffect(() => {
    const fetchAssignedClinic = async () => {
      const usr_id = sessionStorage.getItem('userid');
      if (!usr_id) return;
  
      try {
        const res = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/user-clinic/${usr_id}`);
        const data = await res.json();
  
        if (data.clinic) {
          console.log("📍 Assigned clinic found:", data.clinic);
          const vetRes = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/vet-by-name/${encodeURIComponent(data.clinic)}`);
          const vetData = await vetRes.json();
  
          if (vetRes.ok && vetData) {
            // Get user's current location for distance calculation
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
                  setRegisteredVet(vetData);
                }
              );
            } else {
              setRegisteredVet(vetData);
            }
  
            // Fetch clinic hours
            if (vetData.clinic_id) {
              try {
                const hoursRes = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/clinic-hours/${vetData.clinic_id}`);
                const hoursData = await hoursRes.json();
              
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

              // Fetch clinic status
              try {
                const statusRes = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/clinic-status/${vetData.clinic_id}`);
                const statusData = await statusRes.json();
                
                if (statusRes.ok && statusData.status) {
                  setClinicStatus(statusData.status);
                }
              } catch (err) {
                console.error("❌ Error fetching clinic status:", err);
              }
            }
          }
        }
      } catch (error) {
        console.error("❌ Error fetching assigned clinic:", error);
      }
    };
  
    fetchAssignedClinic();
  }, []);
  
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
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
        () => showStyledAlert("Unable to retrieve location.")
      );
    } else {
      showStyledAlert("Geolocation not supported.");
    }
  };

  const handleSearch = async () => {
    if (!location.trim()) return showStyledAlert("Enter a location.");
    setLoading(true);
    
    // First, try searching for clinics by name
    try {
      const clinicRes = await fetch(
        `https://fyp-pet-telehealth-system.onrender.com/api/clinics/search?query=${encodeURIComponent(location)}`
      );
      const clinicData = await clinicRes.json();
      
      if (clinicData.length > 0) {
        // Found clinics by name - calculate distances if user location is available
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              const withDistances = clinicData.map(clinic => ({
                ...clinic,
                distance: clinic.va_lat && clinic.va_lon 
                  ? calculateDistance(latitude, longitude, clinic.va_lat, clinic.va_lon)
                  : null
              }));
              setVets(withDistances);
              setLoading(false);
            },
            () => {
              // No geolocation, show without distances
              setVets(clinicData.map(c => ({ ...c, distance: null })));
              setLoading(false);
            }
          );
        } else {
          setVets(clinicData.map(c => ({ ...c, distance: null })));
          setLoading(false);
        }
        return;
      }
    } catch (error) {
      console.error("Error searching clinics:", error);
    }
    
    // If no clinics found by name, try geocoding the location
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
      );
      const data = await res.json();
      
      if (data.length === 0) {
        showStyledAlert("No clinics or locations found.");
        setLoading(false);
        return;
      }
      
      const { lat, lon } = data[0];
      setCoords({ lat, lon });
      fetchVetsNearby(lat, lon);
    } catch (error) {
      console.error("Error with location search:", error);
      showStyledAlert("Search failed. Please try again.");
      setLoading(false);
    }
  };

  const fetchVetsNearby = async (lat, lon) => {
    setLoading(true);
    const res = await fetch(
      `https://fyp-pet-telehealth-system.onrender.com/api/vets-nearby?lat=${lat}&lon=${lon}`
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
      // ✅ Check if trying to register with the same clinic
      if (registeredVet && (
        (selectedVet.va_id && registeredVet.va_id && selectedVet.va_id === registeredVet.va_id) || 
        (selectedVet.va_clinicName === registeredVet.va_clinicName)
      )) {
        showStyledAlert("You are already registered with this clinic.");
        return;
      }
  
      try {
        const usr_id = sessionStorage.getItem('userid');
        if (!usr_id) {
          showStyledAlert("User not logged in.");
          return;
        }
  
        const res = await fetch("https://fyp-pet-telehealth-system.onrender.com/api/assign-clinic", {
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
          
          // ✅ CRITICAL: Fetch the complete vet data WITH clinic_id before setting state
          const vetRes = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/vet-by-name/${encodeURIComponent(selectedVet.va_clinicName)}`);
          const completeVetData = await vetRes.json();
          
          if (vetRes.ok && completeVetData && completeVetData.clinic_id) {
            // Calculate distance if geolocation available
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const { latitude, longitude } = pos.coords;
                  const distance = calculateDistance(latitude, longitude, completeVetData.va_lat, completeVetData.va_lon);
                  completeVetData.distance = distance;
                  setRegisteredVet(completeVetData);
                },
                (err) => {
                  console.warn("⚠️ Could not get user location:", err);
                  setRegisteredVet(completeVetData);
                }
              );
            } else {
              setRegisteredVet(completeVetData);
            }
  
            // ✅ Now fetch clinic hours with the proper clinic_id
            fetch(`https://fyp-pet-telehealth-system.onrender.com/api/clinic-hours/${completeVetData.clinic_id}`)
              .then(res => res.json())
              .then(hoursData => {
                if (hoursData) {
                  console.log("✅ Clinic hours fetched after registration:", hoursData);
                  setClinicHours(hoursData);
                }
              })
              .catch(err => console.error("❌ Error fetching clinic hours:", err));
  
            // ✅ Fetch clinic status with the proper clinic_id
            fetch(`https://fyp-pet-telehealth-system.onrender.com/api/clinic-status/${completeVetData.clinic_id}`)
              .then(res => res.json())
              .then(statusData => {
                if (statusData.status) {
                  console.log("✅ Clinic status fetched after registration:", statusData.status);
                  setClinicStatus(statusData.status);
                }
              })
              .catch(err => console.error("❌ Error fetching clinic status:", err));
          }
  
          setShowSuccessNotification(true);
          setShowSearchModal(false);
          setVets([]);
          setSelectedVet(null);
          setLocation("");
  
          setTimeout(() => {
            setShowSuccessNotification(false);
          }, 3000);
        } else {
          console.error("❌ Failed to update:", data.error);
          showStyledAlert("Failed to register clinic. Please try again.");
        }
      } catch (error) {
        console.error("❌ Error:", error);
        showStyledAlert("An error occurred while registering the clinic.");
      }
    }
  };

  const handleBookingSuccess = (details) => {
    setBookingDetails(details);
    setShowBookingToast(true);
    
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setShowBookingToast(false);
      setBookingDetails(null);
    }, 3000);
  };
  
  return (
    <div className="myvet-dashboard-container">
      <PawPattern count={35} />
      <PetOwnerNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="myvet-main-content">
        <ProfileNotification firstName={firstName} />

        {showSuccessNotification && (
          <div className="myvet-success-notification">
            <CheckCircle size={24} />
            <span>Successfully registered into {registeredVet?.va_clinicName}!</span>
          </div>
        )}

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
                <div className="myvet-header-with-status">
                <div className="myvet-header-content">
                  <div className="myvet-clinic-badge">
                    <MapPin size={20} />
                    <span>Your Veterinary Clinic</span>
                  </div>
                  <h1 className="myvet-clinic-name">{registeredVet.va_clinicName}</h1>
                  <p className="myvet-clinic-location">{registeredVet.va_vetLocation}</p>

                  {/* ✅ Clinic Status Toggle goes here */}
                  <div className="myvet-status-toggle">
                    <div className={`myvet-status-btn ${clinicStatus}`}>
                      <div className="myvet-status-indicator"></div>
                      {clinicStatus === 'open'
                        ? 'Open'
                        : clinicStatus === 'temporarily closed'
                        ? 'Temp. Closed'
                        : 'Closed'}
                    </div>
                  </div>
                  
                </div>
                  
                  

                </div>
                
                <button 
                  className="myvet-change-button"
                  onClick={() => {
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
                    const isClosed = !hours || hours.status === 'Closed' || !hours.opening || !hours.closing;
                    const timeDisplay = isClosed 
                      ? "Closed" 
                      : `${hours.opening} - ${hours.closing}`;
                    
                    const status = isClosed ? "Closed" : hours.status;
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
                          {vet.distance !== null && vet.distance !== undefined
                            ? `${vet.distance.toFixed(2)} km away`
                            : 'Distance unavailable'}
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

      {showBookingModal && registeredVet && (
        <div className="myvet-modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <BookAppointment 
              clinicId={registeredVet.clinic_id} 
              onClose={() => setShowBookingModal(false)}
              onBookingSuccess={handleBookingSuccess}
            />
          </div>
        </div>
      )}

      {showBookingToast && bookingDetails && (
        <Toast
          type="pending"
          title="Awaiting Approval"
          message={`Booking pending for ${bookingDetails.time}`}
        />
      )}
    </div>
  );
};

export default MyVet;