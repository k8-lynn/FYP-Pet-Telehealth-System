//myprofile.jsx
import React, { useState, useEffect } from 'react';
import ProfileNotification from './components/ProfileNotification';
import { User, Mail, Lock, MapPin, Phone, FileText, Award, Building, Calendar, Save, X } from 'lucide-react';
import PetOwnerNavbar from './components/petowner-navbar';
import VetAdminNavbar from './components/vetadmin-navbar';
import VetNavbar from './components/vet-navbar';
import './styles/myprofile.css';

const MyProfile = () => {
  const userId = sessionStorage.getItem('userid');
  const userType = sessionStorage.getItem('userType');

  console.log('userId:', userId);
  console.log('userType:', userType);

  const [userData, setUserData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfileData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/profile/${userId}`);
      const data = await response.json();

      if (response.ok) {
        setUserData(data);
        setFormData(data);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to fetch profile' });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
  
    try {
      let endpoint;
      if (userType === 'petParent') {
        endpoint = `http://localhost:5000/api/profile/petparent/${userId}`;
      } else if (userType === 'vetAdmin') {
        endpoint = `http://localhost:5000/api/profile/vetadmin/${userId}`;
      } else if (userType === 'veterinarian') {
        endpoint = `http://localhost:5000/api/profile/veterinarian/${userId}`;
      }
  
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setUserData(formData);
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        sessionStorage.setItem('firstName', formData.usr_firstName);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(userData);
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  };

  if (loading) {
    return (
      <div className="app-container">
        {userType === 'petParent' ? (
          <PetOwnerNavbar 
            userType={userType} 
            sidebarOpen={sidebarOpen} 
            setSidebarOpen={setSidebarOpen} 
          />
        ) : (
          <VetAdminNavbar 
            userType={userType} 
            sidebarOpen={sidebarOpen} 
            setSidebarOpen={setSidebarOpen} 
          />
        )}

        <div className={userType === 'vetAdmin' ? 'vetadmin-main-content' : 'main-content'}>
          <ProfileNotification firstName={sessionStorage.getItem('firstName')} />
          <div className="content-area">
            <div className="loading-message">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {userType === 'petParent' ? (
        <PetOwnerNavbar 
          userType={userType} 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />
      ) : userType === 'vetAdmin' ? (
        <VetAdminNavbar 
          userType={userType} 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />
      ) : (
        <VetNavbar 
          userType={userType} 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />
      )}
      
      <div className={userType === 'vetAdmin' || userType === 'veterinarian' ? 'vetadmin-main-content' : 'main-content'}>
        <ProfileNotification firstName={userData?.usr_firstName} />
        
        <div className="content-area">
          <div className="myprofile-container">
              <div className="myprofile-header">
                <h1 className="myprofile-title">My Profile</h1>
                {!isEditing ? (
                  <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                    <User size={18} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="action-buttons">
                    <button className="cancel-btn" onClick={handleCancel}>
                      <X size={18} />
                      <span>Cancel</span>
                    </button>
                    <button className="save-btn" onClick={handleSave} disabled={saving}>
                      <Save size={18} />
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                )}
              </div>

              {message.text && (
                <div className={`message-banner ${message.type}`}>
                  {message.text}
                </div>
              )}

              <div className="profile-card">
                {/* Pet Parent Profile */}
                {userType === 'petParent' && (
                  <>
                    <div className="profile-section">
                      <h3 className="section-heading">Account Information</h3>
                      <div className="profile-grid">
                        <div className="profile-field readonly">
                          <label>Pet Parent ID</label>
                          <div className="field-content">
                            <FileText size={20} />
                            <span>{userData?.pp_id}</span>
                          </div>
                        </div>

                        <div className="profile-field readonly">
                          <label>Account Type</label>
                          <div className="field-content">
                            <Award size={20} />
                            <span>Pet Parent</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="profile-section">
                      <h3 className="section-heading">Personal Information</h3>
                      <div className="profile-grid">
                        <div className="profile-field">
                          <label>First Name</label>
                          <div className="field-content">
                            <User size={20} />
                            {isEditing ? (
                              <input
                                type="text"
                                name="usr_firstName"
                                value={formData.usr_firstName || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.usr_firstName}</span>
                            )}
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Last Name</label>
                          <div className="field-content">
                            <User size={20} />
                            {isEditing ? (
                              <input
                                type="text"
                                name="usr_lastName"
                                value={formData.usr_lastName || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.usr_lastName}</span>
                            )}
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Email</label>
                          <div className="field-content">
                            <Mail size={20} />
                            {isEditing ? (
                              <input
                                type="email"
                                name="usr_email"
                                value={formData.usr_email || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.usr_email}</span>
                            )}
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Password</label>
                          <div className="field-content">
                            <Lock size={20} />
                            {isEditing ? (
                              <input
                                type="password"
                                name="usr_password"
                                value={formData.usr_password || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>••••••••</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Vet Admin Profile */}
                {userType === 'vetAdmin' && (
                  <>
                    <div className="profile-section">
                      <h3 className="section-heading">Account Information</h3>
                      <div className="profile-grid">
                        <div className="profile-field readonly">
                          <label>Vet Admin ID</label>
                          <div className="field-content">
                            <FileText size={20} />
                            <span>{userData?.va_id}</span>
                          </div>
                        </div>

                        <div className="profile-field readonly">
                          <label>Account Type</label>
                          <div className="field-content">
                            <Award size={20} />
                            <span>Veterinary Administrator</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="profile-section">
                      <h3 className="section-heading">Personal Information</h3>
                      <div className="profile-grid">
                        <div className="profile-field">
                          <label>First Name</label>
                          <div className="field-content">
                            <User size={20} />
                            {isEditing ? (
                              <input
                                type="text"
                                name="usr_firstName"
                                value={formData.usr_firstName || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.usr_firstName}</span>
                            )}
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Last Name</label>
                          <div className="field-content">
                            <User size={20} />
                            {isEditing ? (
                              <input
                                type="text"
                                name="usr_lastName"
                                value={formData.usr_lastName || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.usr_lastName}</span>
                            )}
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Email</label>
                          <div className="field-content">
                            <Mail size={20} />
                            {isEditing ? (
                              <input
                                type="email"
                                name="usr_email"
                                value={formData.usr_email || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.usr_email}</span>
                            )}
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Password</label>
                          <div className="field-content">
                            <Lock size={20} />
                            {isEditing ? (
                              <input
                                type="password"
                                name="usr_password"
                                value={formData.usr_password || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>••••••••</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="profile-section">
                      <h3 className="section-heading">Professional Information</h3>
                      <div className="profile-grid">
                        <div className="profile-field">
                          <label>License Number</label>
                          <div className="field-content">
                            <Award size={20} />
                            {isEditing ? (
                              <input
                                type="text"
                                name="va_licenseNumber"
                                value={formData.va_licenseNumber || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.va_licenseNumber}</span>
                            )}
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Licensing Authority</label>
                          <div className="field-content">
                            <Building size={20} />
                            {isEditing ? (
                              <input
                                type="text"
                                name="va_licensingAuthority"
                                value={formData.va_licensingAuthority || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.va_licensingAuthority}</span>
                            )}
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Years of Practice</label>
                          <div className="field-content">
                            <Calendar size={20} />
                            {isEditing ? (
                              <input
                                type="number"
                                name="va_yearsOfPractice"
                                value={formData.va_yearsOfPractice || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.va_yearsOfPractice} years</span>
                            )}
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Specialization</label>
                          <div className="field-content">
                            <Award size={20} />
                            {isEditing ? (
                              <input
                                type="text"
                                name="va_specialization"
                                value={formData.va_specialization || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.va_specialization || 'Not specified'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="profile-section">
                      <h3 className="section-heading">Clinic Information</h3>
                      <div className="profile-grid">
                        <div className="profile-field">
                          <label>Clinic Name</label>
                          <div className="field-content">
                            <Building size={20} />
                            {isEditing ? (
                              <input
                                type="text"
                                name="va_clinicName"
                                value={formData.va_clinicName || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.va_clinicName}</span>
                            )}
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Location</label>
                          <div className="field-content">
                            <MapPin size={20} />
                            {isEditing ? (
                              <input
                                type="text"
                                name="va_vetLocation"
                                value={formData.va_vetLocation || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.va_vetLocation}</span>
                            )}
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Clinic Phone</label>
                          <div className="field-content">
                            <Phone size={20} />
                            {isEditing ? (
                              <input
                                type="tel"
                                name="va_clinicPhone"
                                value={formData.va_clinicPhone || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.va_clinicPhone}</span>
                            )}
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Clinic Email</label>
                          <div className="field-content">
                            <Mail size={20} />
                            {isEditing ? (
                              <input
                                type="email"
                                name="va_clinicEmail"
                                value={formData.va_clinicEmail || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.va_clinicEmail}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Veterinarian Profile */}
                {userType === 'veterinarian' && (
                  <>
                    <div className="profile-section">
                      <h3 className="section-heading">Account Information</h3>
                      <div className="profile-grid">
                        <div className="profile-field readonly">
                          <label>Veterinarian ID</label>
                          <div className="field-content">
                            <FileText size={20} />
                            <span>{userData?.vt_id}</span>
                          </div>
                        </div>

                        <div className="profile-field readonly">
                          <label>Account Type</label>
                          <div className="field-content">
                            <Award size={20} />
                            <span>Veterinarian</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="profile-section">
                      <h3 className="section-heading">Personal Information</h3>
                      <div className="profile-grid">
                        <div className="profile-field">
                          <label>First Name</label>
                          <div className="field-content">
                            <User size={20} />
                            {isEditing ? (
                              <input
                                type="text"
                                name="usr_firstName"
                                value={formData.usr_firstName || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.usr_firstName}</span>
                            )}
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Last Name</label>
                          <div className="field-content">
                            <User size={20} />
                            {isEditing ? (
                              <input
                                type="text"
                                name="usr_lastName"
                                value={formData.usr_lastName || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.usr_lastName}</span>
                            )}
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Email</label>
                          <div className="field-content">
                            <Mail size={20} />
                            {isEditing ? (
                              <input
                                type="email"
                                name="usr_email"
                                value={formData.usr_email || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.usr_email}</span>
                            )}
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Password</label>
                          <div className="field-content">
                            <Lock size={20} />
                            {isEditing ? (
                              <input
                                type="password"
                                name="usr_password"
                                value={formData.usr_password || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>••••••••</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="profile-section">
                      <h3 className="section-heading">Professional Information</h3>
                      <div className="profile-grid">
                        <div className="profile-field">
                          <label>License Number</label>
                          <div className="field-content">
                            <Award size={20} />
                            {isEditing ? (
                              <input
                                type="text"
                                name="vt_licenseNumber"
                                value={formData.vt_licenseNumber || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.vt_licenseNumber}</span>
                            )}
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Licensing Authority</label>
                          <div className="field-content">
                            <Building size={20} />
                            {isEditing ? (
                              <input
                                type="text"
                                name="vt_licensingAuthority"
                                value={formData.vt_licensingAuthority || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.vt_licensingAuthority}</span>
                            )}
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Years of Practice</label>
                          <div className="field-content">
                            <Calendar size={20} />
                            {isEditing ? (
                              <input
                                type="number"
                                name="vt_yearsOfPractice"
                                value={formData.vt_yearsOfPractice || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.vt_yearsOfPractice} years</span>
                            )}
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Specialization</label>
                          <div className="field-content">
                            <Award size={20} />
                            {isEditing ? (
                              <input
                                type="text"
                                name="vt_specialization"
                                value={formData.vt_specialization || ''}
                                onChange={handleInputChange}
                              />
                            ) : (
                              <span>{userData?.vt_specialization || 'Not specified'}</span>
                            )}
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Patients Assigned</label>
                          <div className="field-content">
                            <User size={20} />
                            <span>{userData?.vt_patientsAssigned || 0}</span>
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>On Duty Status</label>
                          <div className="field-content">
                            <Calendar size={20} />
                            <span className={userData?.vt_onDutyToday === 'yes' ? 'status-active' : 'status-inactive'}>
                              {userData?.vt_onDutyToday === 'yes' ? 'On Duty' : 'Off Duty'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="profile-section">
                      <h3 className="section-heading">Clinic Information</h3>
                      <div className="profile-grid">
                        <div className="profile-field">
                          <label>Clinic Name</label>
                          <div className="field-content">
                            <Building size={20} />
                            <span>{userData?.vt_clinicName}</span>
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Location</label>
                          <div className="field-content">
                            <MapPin size={20} />
                            <span>{userData?.vt_vetLocation}</span>
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Clinic Phone</label>
                          <div className="field-content">
                            <Phone size={20} />
                            <span>{userData?.vt_clinicPhone}</span>
                          </div>
                        </div>

                        <div className="profile-field">
                          <label>Clinic Email</label>
                          <div className="field-content">
                            <Mail size={20} />
                            <span>{userData?.vt_clinicEmail}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    
  );
};

export default MyProfile;