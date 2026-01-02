import React, { useState } from 'react';
import "./styles/register.css";
import showStyledAlert from "./utils/styledAlert";

const Register = () => {
  const [step, setStep] = useState(1);
  const [consentChecked, setConsentChecked] = useState(false);
  const [showUserTypeError, setShowUserTypeError] = useState(false);
  const [formData, setFormData] = useState({
    // Common fields
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: '',
    
    // Pet Parent fields
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
    behavioralNotes: '',
    
    // Vet fields
    licenseNumber: '',
    licensingAuthority: '',
    yearsOfPractice: '',
    specialization: '',
    clinicName: '',
    vetLocation: '',
    clinicPhone: '',
    clinicEmail: '',
  });

  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNext = async (e) => {
    e.preventDefault();
    
    // Check if user type is selected on step 1
    if (step === 1 && !formData.userType) {
      setShowUserTypeError(true);
      showStyledAlert("Please select whether you are a Pet Parent or Vet Admin");
      return;
    }
    
    // Check password match on step 1
    if (step === 1) {
      if (formData.password !== formData.confirmPassword) {
        showStyledAlert("Passwords do not match");
        return;
      }
      
      // Check if email already exists
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        showStyledAlert("This email is already registered. Please use a different email or login.");
        return;
      }
    }
    
    // Reset error and proceed
    setShowUserTypeError(false);
    if (step < 4) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleEnableLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
  
          try {
            // Call Nominatim Reverse Geocoding API
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
  
            if (data && data.display_name) {
              // Use the full formatted address
              setFormData((prev) => ({ ...prev, vetLocation: data.display_name }));
            } else {
              showStyledAlert("Unable to fetch address. Using coordinates instead.");
              setFormData((prev) => ({ ...prev, vetLocation: `${lat}, ${lng}` }));
            }
          } catch (err) {
            console.error("Nominatim error:", err);
            setFormData((prev) => ({ ...prev, vetLocation: `${lat}, ${lng}` }));
          }
        },
        () => {
          showStyledAlert("Please enable location in your browser settings.");
        }
      );
    } else {
      showStyledAlert("Geolocation is not supported by this browser.");
    }
  };
  
  

  const handleSubmitFinal = async (e) => {
    e.preventDefault();
  
    if (!consentChecked) {
      showStyledAlert("Please confirm the consent checkbox before submitting.");
      return;
    }
  
    let lat = null, lon = null;
  
    // 🗺️ If vetLocation is filled, geocode it to lat/lon
    if (formData.userType === "vet" && formData.vetLocation) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.vetLocation)}`
        );
        const geoData = await geoRes.json();
  
        if (geoData.length > 0) {
          lat = parseFloat(geoData[0].lat);
          lon = parseFloat(geoData[0].lon);
        } else {
          console.warn("⚠️ No coordinates found for this address.");
        }
      } catch (error) {
        console.error("❌ Nominatim geocoding failed:", error);
      }
    }
  
    // 🟢 Prepare the data correctly for backend
    const formattedData = {
      ...formData,
      va_lat: lat,
      va_lon: lon,
      userType: formData.userType === "vet" ? "vetAdmin" : "petParent",
      gender: formData.gender === "male" ? "m" : "f",
      age: parseInt(formData.age, 10),
    };
  
    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
      });
  
      const data = await response.json();
      showStyledAlert(data.message || "Registered!");
    } catch (err) {
      console.error("Error:", err);
      showStyledAlert("Failed to register");
    }
  };
  


  // Get step labels based on user type
  const getStepLabels = () => {
    if (formData.userType === 'vet') {
      return ['Your profile', 'Professional Verification', 'Practice Information', 'Confirm'];
    }
    return ['Your profile', 'Pet basics', 'Pet details', 'Confirm'];
  };

  const stepLabels = getStepLabels();

  const checkEmailExists = async (email) => {
    try {
      const response = await fetch(`http://localhost:5000/api/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      return data.exists;
    } catch (err) {
      console.error("Error checking email:", err);
      return false;
    }
  };


  return (
    <div className="register-page">
      {/* Progress Section ABOVE */}
      <div className="progress-steps-horizontal">
        {stepLabels.map((label, index) => (
          <div
            key={index}
            className={`step-horizontal ${
              step === index ? 'active' : step > index ? 'completed' : ''
            }`}
          >
            <div className="step-circle-horizontal">{index + 1}</div>
            <span className="step-label">{label}</span>
          </div>
        ))}
      </div>

  
      {/* Register Form BELOW */}
      <div className="form-section">
        <div className="form-box">
          <h2>Register</h2>

          <form onSubmit={(formData.userType === 'vet' && step === 4) || (formData.userType === 'petParent' && step === 4) ? handleSubmitFinal : handleNext}>
            {/* STEP 1: Your Profile (Common for both) */}
            {step === 1 && (
              <>
                <div>
                  <label>First Name</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div>
                  <label>Last Name</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
                </div>
                <div>
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div>
                  <label>Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                </div>
                <div>
                  <label>Confirm Password</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                  {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p style={{color: 'red', fontSize: '14px'}}>Passwords do not match</p>
                  )}
                </div>
                <div>
                  <label className="user-type-label">Are you a...</label>
                  <div className="user-type">
                    <label className="radio-button">
                      <input 
                        type="radio" 
                        name="userType" 
                        value="petParent" 
                        checked={formData.userType === 'petParent'} 
                        onChange={handleChange} 
                      />
                      <span>Pet Parent</span>
                    </label>
                    <label className="radio-button">
                      <input 
                        type="radio" 
                        name="userType" 
                        value="vet" 
                        checked={formData.userType === 'vet'} 
                        onChange={handleChange} 
                      />
                      <span>Vet Admin</span>
                    </label>
                  </div>
                </div>
                <button type="submit">Next</button>
              </>
            )}

            {/* PET PARENT FLOW */}
            {formData.userType === 'petParent' && (
              <>
                {/* STEP 2: Pet Basics */}
                {step === 2 && (
                  <>
                    <div>
                      <label>Animal Type:</label>
                      <select name="animalType" value={formData.animalType} onChange={handleChange} required>
                        <option value="">Select</option>
                        <option value="dog">Dog</option>
                        <option value="cat">Cat</option>
                      </select>
                    </div>
                    <div>
                      <label>Pet Name:</label>
                      <input type="text" name="petName" value={formData.petName} onChange={handleChange} required />
                    </div>
                    <div>
                      <label>Breed:</label>
                      <input type="text" name="breed" value={formData.breed} onChange={handleChange} required />
                    </div>
                   <div>
                      <label>Age:</label>
                      <input type="number" name="age" value={formData.age} onChange={handleChange} required min="0" />
                    </div>
                    <div>
                      <label>Gender:</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} required>
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div className="form-buttons">
                      <button type="submit">Next</button>
                      <button type="button" onClick={handleBack}>Back</button>
                    </div>
                  </>
                )}

                {/* STEP 3: Pet Details */}
                {step === 3 && (
                  <>
                    <h3>Medical History</h3>
                    <div>
                      <label>Vaccination:</label>
                      <div className="radio-group">
                        <label>
                          <input type="radio" name="hasVaccination" value="yes" checked={formData.hasVaccination === 'yes'} onChange={handleChange} required />
                          Yes
                        </label>
                        <label>
                          <input type="radio" name="hasVaccination" value="no" checked={formData.hasVaccination === 'no'} onChange={handleChange} />
                          No
                        </label>
                      </div>
                    </div>
                    {formData.hasVaccination === 'yes' && (
                      <div>
                        <label>Date of Vaccination:</label>
                        <input type="date" name="vaccinationDate" value={formData.vaccinationDate} onChange={handleChange} required />
                      </div>
                    )}

                    <div>
                      <label>Current Medication:</label>
                      <div className="radio-group">
                        <label>
                          <input type="radio" name="hasMedication" value="yes" checked={formData.hasMedication === 'yes'} onChange={handleChange} required />
                          Yes
                        </label>
                        <label>
                          <input type="radio" name="hasMedication" value="no" checked={formData.hasMedication === 'no'} onChange={handleChange} />
                          No
                        </label>
                      </div>
                    </div>
                    {formData.hasMedication === 'yes' && (
                      <div>
                        <label>Medication Details:</label>
                        <textarea name="medicationDetails" value={formData.medicationDetails} onChange={handleChange} required />
                      </div>
                    )}

                    <h3>Allergies</h3>
                    <div>
                      <label>Do they have allergies?</label>
                      <div className="radio-group">
                        <label>
                          <input type="radio" name="hasAllergies" value="yes" checked={formData.hasAllergies === 'yes'} onChange={handleChange} required />
                          Yes
                        </label>
                        <label>
                          <input type="radio" name="hasAllergies" value="no" checked={formData.hasAllergies === 'no'} onChange={handleChange} />
                          No
                        </label>
                      </div>
                    </div>
                    {formData.hasAllergies === 'yes' && (
                      <div>
                        <label>List Allergies:</label>
                        <textarea name="allergies" value={formData.allergies} onChange={handleChange} placeholder="E.g., pollen, chicken, dairy" required />
                      </div>
                    )}

                    <h3>Diet</h3>
                    <div>
                      <label>Diet Type:</label>
                      <textarea name="dietType" value={formData.dietType} onChange={handleChange} placeholder="E.g., commercial food types (dry, wet, semi-moist), home-cooked, and raw meat-based" required />
                    </div>

                    <h3>Weight</h3>
                    <div>
                      <label>Weight (kg):</label>
                      <input type="number" name="weight" value={formData.weight} onChange={handleChange} placeholder="0.0" step="0.1" required />
                    </div>

                    <h3>Behavioral Notes</h3>
                    <div>
                      <textarea name="behavioralNotes" value={formData.behavioralNotes} onChange={handleChange} placeholder="E.g., aggression, anxiety, chewing" />
                    </div>

                    <div className="form-buttons">
                      <button type="submit">Next</button>
                      <button type="button" onClick={handleBack}>Back</button>
                    </div>
                  </>
                )}

                {/* STEP 4: Confirm (Pet Parent) */}
                {step === 4 && (
                  <>
                    <h3>Review Summary</h3>
                    <div className="summary-section">
                      <div className="summary-item">
                        <strong>Your Profile:</strong>
                        <p>{formData.firstName} {formData.lastName}</p>
                        <p>Email: {formData.email}</p>
                        <p>Account Type: Pet Parent</p>
                      </div>

                      <div className="summary-item">
                        <strong>Pet Basics:</strong>
                        <p>Pet Name: {formData.petName}</p>
                        <p>Animal Type: {formData.animalType}</p>
                        <p>Breed: {formData.breed}</p>
                        <p>Age: {formData.age}</p>
                        <p>Gender: {formData.gender}</p>
                      </div>

                      <div className="summary-item">
                        <strong>Pet Details:</strong>
                        <p>Vaccination: {formData.hasVaccination === 'yes' ? `Yes (${formData.vaccinationDate})` : 'No'}</p>
                        <p>Current Medication: {formData.hasMedication === 'yes' ? 'Yes' : 'No'}</p>
                        <p>Allergies: {formData.hasAllergies === 'yes' ? 'Yes' : 'No'}</p>
                        <p>Weight: {formData.weight} kg</p>
                      </div>
                    </div>

                    <div className="consent-section">
                      <label className="consent-checkbox">
                        <input 
                          type="checkbox" 
                          checked={consentChecked} 
                          onChange={(e) => setConsentChecked(e.target.checked)} 
                          required 
                        />
                        <span>
                          I confirm the information provided is accurate and consent to its use for telehealth veterinary care, including sharing with licensed veterinarians as needed.
                        </span>
                      </label>
                    </div>

                    <div className="form-buttons">
                      <button type="submit">Submit</button>
                      <button type="button" onClick={handleBack}>Back</button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* VET FLOW */}
            {formData.userType === 'vet' && (
              <>
                {/* STEP 2: Professional Verification */}
                {step === 2 && (
                  <>
                    <h3>Professional Verification</h3>
                    <div>
                      <label>Veterinary License Number:</label>
                      <input 
                        type="text" 
                        name="licenseNumber" 
                        value={formData.licenseNumber} 
                        onChange={handleChange} 
                        pattern="^MY-VET-\d{4}-\d{4}$"
                        title="License number must follow format: MY-VET-YYYY-XXXX (e.g., MY-VET-2022-0147)"
                        placeholder="e.g., MY-VET-2022-0147"
                        required 
                      />
                    </div>
                    <div>
                      <label>Licensing Authority / State:</label>
                      <input type="text" name="licensingAuthority" value={formData.licensingAuthority} onChange={handleChange} placeholder="E.g., California Veterinary Medical Board" required />
                    </div>
                    <div>
                      <label>Years of Practice:</label>
                      <input type="number" name="yearsOfPractice" value={formData.yearsOfPractice} onChange={handleChange} min="0" required />
                    </div>
                    <div>
                      <label>Area of Specialization (optional):</label>
                      <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} placeholder="E.g., Surgery, Dermatology, Emergency" />
                    </div>
                    <div className="form-buttons">
                      <button type="submit">Next</button>
                      <button type="button" onClick={handleBack}>Back</button>
                    </div>
                  </>
                )}

                {/* STEP 3: Practice Information */}
                {step === 3 && (
                  <>
                    <h3>Practice Information</h3>
                    <p className="info-text">Get started by entering your vet location</p>
                    
                    <div>
                      <label>Vet Location:</label>
                      <input
                        type="text"
                        name="vetLocation"
                        value={formData.vetLocation}
                        onChange={handleChange}
                        placeholder="Enter your vet location"
                        required
                      />
                    </div>

                    <div className="location-buttons">
                      <button type="button" onClick={handleEnableLocation} className="location-btn">
                        Enable Location
                      </button>
                      <span className="or-text">or</span>
                      <button type="button" className="location-btn secondary">
                        Not Now
                      </button>
                    </div>

                    <div>
                      <label>Clinic / Hospital Name:</label>
                      <input
                        type="text"
                        name="clinicName"
                        value={formData.clinicName}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Separated Contact Info */}
                    <div className="clinic-contact-group">
                      <div>
                        <label>Phone:</label>
                        <input
                          type="tel"
                          name="clinicPhone"
                          value={formData.clinicPhone}
                          onChange={(e) => {
                            // Only allow numbers
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            setFormData(prev => ({ ...prev, clinicPhone: value }));
                          }}
                          placeholder="Enter phone number"
                          required
                        />
                      </div>

                      <div>
                        <label>Email:</label>
                        <input
                          type="email"
                          name="clinicEmail"
                          value={formData.clinicEmail}
                          onChange={handleChange}
                          placeholder="Enter email address"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-buttons">
                      <button type="submit">Next</button>
                      <button type="button" onClick={handleBack}>Back</button>
                    </div>
                  </>
                )}


              

                {/* STEP 4: Confirm (Vet) */}
                {step === 4 && formData.userType === 'vet' && (
                  <>
                    <h3>Review Summary</h3>
                    <div className="summary-section">
                      <div className="summary-item">
                        <strong>Your Profile:</strong>
                        <p>{formData.firstName} {formData.lastName}</p>
                        <p>Email: {formData.email}</p>
                        <p>Account Type: Veterinarian Admin</p>
                      </div>

                      <div className="summary-item">
                        <strong>Professional Info:</strong>
                        <p>License Number: {formData.licenseNumber}</p>
                        <p>Licensing Authority: {formData.licensingAuthority}</p>
                        <p>Years of Practice: {formData.yearsOfPractice}</p>
                        {formData.specialization && <p>Specialization: {formData.specialization}</p>}
                      </div>

                      <div className="summary-item">
                        <strong>Practice Details:</strong>
                        <p>Clinic: {formData.clinicName}</p>
                        <p>Location: {formData.vetLocation}</p>
                        <p>Phone: {formData.clinicPhone}</p>
                        <p>Email: {formData.clinicEmail}</p>
                      </div>

                    </div>

                    <div className="consent-section">
                      <label className="consent-checkbox">
                        <input 
                          type="checkbox" 
                          checked={consentChecked} 
                          onChange={(e) => setConsentChecked(e.target.checked)} 
                          required 
                        />
                        <span>
                          I confirm that the information provided is true and accurate, and consent to its use for verification of my veterinary credentials and for providing telehealth services.
                        </span>
                      </label>
                    </div>

                    <div className="form-buttons">
                      <button type="submit">Submit</button>
                      <button type="button" onClick={handleBack}>Back</button>
                    </div>
                  </>
                )}

              </>
            )}
          </form>
            {/* Add this */}
            <div className="login-link">
              Already have an account?<a href="/login">Login here</a>
            </div>
                      
        </div>
      </div>
            
      
    </div>
  );
};

export default Register;