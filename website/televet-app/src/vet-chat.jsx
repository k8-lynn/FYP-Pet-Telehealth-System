import React, { useState } from 'react';
import { Send, Paperclip, Video, Phone, Search, MoreVertical, Calendar, FileText, Camera, X, ChevronDown, Clock, ChevronLeft, Menu, MessageCircle } from 'lucide-react';
import PawPattern from "./components/PawPattern";
import VetNavbar from './components/vet-navbar';
import ProfileNotification from "./components/ProfileNotification";
import AppointmentDetailsModal from './components/AppointmentDetailsModal';
import './styles/vet-chat.css';

const VetChat = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [showPetInfo, setShowPetInfo] = useState(true);
  const [chatListOpen, setChatListOpen] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [myPatients, setMyPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [loadingAppointment, setLoadingAppointment] = useState(false);

React.useEffect(() => {
  const storedName = sessionStorage.getItem('firstName');
  const storedVetId = sessionStorage.getItem('vt_id');

  console.log('🔑 Session data:', { storedName, storedVetId }); // Debug log

  if (storedName) {
    setFirstName(storedName);
  }

  if (storedVetId) {
    console.log('📞 Calling fetchMyPatients with vt_id:', storedVetId);
    fetchMyPatients(storedVetId);
  } else {
    console.log('⚠️ No vt_id found in session storage');
    setLoading(false);
  }
}, []);

// Fetch appointment details when selectedChat changes
React.useEffect(() => {
  if (selectedChat && currentChat?.petData?.pet_id) {
    fetchAppointmentDetails(currentChat.petData.pet_id);
  }
}, [selectedChat]); // eslint-disable-line react-hooks/exhaustive-deps



    // Fetch patients assigned to this vet
    const fetchMyPatients = async (vt_id) => {
    try {
        setLoading(true);
        console.log('🔍 Fetching patients for vt_id:', vt_id); // Debug log
        
        const response = await fetch(`http://localhost:5000/api/vet-patients/${vt_id}`);
        
        console.log('📡 Response status:', response.status); // Debug log
        
        if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Received data:', data); // Debug log
        
        setMyPatients(data);
        
        // Set first patient as selected by default if exists
        if (data.length > 0) {
        setSelectedChat(`patient-${data[0].pet_id}`);
        console.log('✅ Selected first patient:', data[0].pet_name);
        } else {
        console.log('⚠️ No patients found for this vet');
        }
        
        setLoading(false);
    } catch (error) {
        console.error('❌ Error fetching patients:', error);
        setLoading(false);
    }
    };

    const fetchAppointmentDetails = async (pet_id, showModal = false) => {
    try {
        setLoadingAppointment(true);
        const response = await fetch(`http://localhost:5000/api/scheduled-appointment/${pet_id}`);
        
        if (response.status === 404) {
        console.log('No scheduled appointment found for this patient');
        setAppointmentDetails(null);
        setLoadingAppointment(false);
        if (showModal) {
            alert('No scheduled appointment found for this patient');
        }
        return;
        }
        
        if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setAppointmentDetails(data);
        if (showModal) {
        setShowAppointmentModal(true);
        }
        setLoadingAppointment(false);
    } catch (error) {
        console.error('❌ Error fetching appointment:', error);
        setAppointmentDetails(null);
        setLoadingAppointment(false);
        if (showModal) {
        alert('Failed to fetch appointment details');
        }
    }
    };

    const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    };

// Transform myPatients into chat format
const chats = myPatients.map(patient => ({
  id: `patient-${patient.pet_id}`,
  name: `${patient.owner_firstName} ${patient.owner_lastName}`,
  petName: patient.pet_name,
  petType: patient.pet_species,
  avatar: `${patient.owner_firstName?.charAt(0) || ''}${patient.owner_lastName?.charAt(0) || ''}`,
  lastMessage: 'No recent messages',
  time: new Date(patient.pet_lastUpdated || patient.pp_createdAt).toLocaleDateString(),
  unread: 0,
  online: false,
  petData: patient // Store full patient data
}));


const currentChat = chats.find(c => c.id === selectedChat);
const currentPet = currentChat ? {
  name: currentChat.petData.pet_name,
  species: currentChat.petData.pet_species,
  breed: currentChat.petData.pet_breed,
  age: `${currentChat.petData.pet_age} years`,
  gender: currentChat.petData.pet_gender === 'm' ? 'Male' : 'Female',
  weight: `${currentChat.petData.pet_weight} kg`,
  dietType: currentChat.petData.pet_dietType || 'Not specified',
  image: currentChat.petData.pet_species?.toLowerCase().includes('dog') ? '🐕' : '🐱',
  owner: `${currentChat.petData.owner_firstName} ${currentChat.petData.owner_lastName}`,
  ownerEmail: currentChat.petData.owner_email,
  lastVisit: currentChat.petData.pet_lastUpdated ? new Date(currentChat.petData.pet_lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
  nextAppointment: '-',
  conditions: currentChat.petData.pet_behavioralNotes ? [currentChat.petData.pet_behavioralNotes] : ['Regular Checkup'],
  behavioralNotes: currentChat.petData.pet_behavioralNotes || 'No behavioral notes recorded',
  medications: currentChat.petData.pet_hasMedication === 'yes' && currentChat.petData.pet_medicationDetails 
    ? currentChat.petData.pet_medicationDetails.split(',').map(med => med.trim())
    : ['No active medications'],
  allergies: currentChat.petData.pet_hasAllergies === 'yes' && currentChat.petData.pet_allergyDetails
    ? currentChat.petData.pet_allergyDetails.split(',').map(allergy => allergy.trim())
    : ['No known allergies'],
  vaccinations: currentChat.petData.pet_hasVaccination === 'yes' 
    ? [`Last vaccination: ${currentChat.petData.pet_vaccinationDate ? new Date(currentChat.petData.pet_vaccinationDate).toLocaleDateString() : 'N/A'}`]
    : ['No vaccination records']
} : null;

  return (
    <div className="vet-dashboard-container">
      <PawPattern count={35} />
      
      <VetNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <ProfileNotification firstName={firstName} />

        <div className="chat-container">
          {/* Chat List Sidebar */}
          <div className={`chat-list-panel ${!chatListOpen ? 'collapsed' : ''}`}>
            <div className="chat-list-header">
              <h2>{chatListOpen ? 'Patient Messages' : ''}</h2>
              <div className="header-actions">
                {chatListOpen && (
                  <button className="search-button">
                    <Search size={20} />
                  </button>
                )}
                <button className="collapse-button" onClick={() => setChatListOpen(!chatListOpen)}>
                  {chatListOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>

            {chatListOpen && (
                <>
                    {/* Chat List */}
                    <div className="chat-list">
                    {loading ? (
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                        <p>Loading patients...</p>
                        </div>
                    ) : myPatients.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                        <p>No patients assigned yet</p>
                        </div>
                    ) : (
                        chats.map(chat => (
                        <div 
                            key={chat.id}
                            className={`chat-item ${selectedChat === chat.id ? 'active' : ''}`}
                            onClick={() => setSelectedChat(chat.id)}
                        >
                            <div className="chat-avatar-container">
                            <div className="chat-avatar">{chat.avatar}</div>
                            {chat.online && <div className="online-indicator" />}
                            </div>
                            <div className="chat-item-content">
                            <div className="chat-item-header">
                                <h4>{chat.name}</h4>
                                <span className="chat-time">{chat.time}</span>
                            </div>
                            <div className="chat-item-preview">
                                <p>{chat.lastMessage}</p>
                                {chat.unread > 0 && (
                                <span className="unread-badge">{chat.unread}</span>
                                )}
                            </div>
                            <span className="chat-specialty">
                                {chat.petName} • {chat.petType}
                            </span>
                            </div>
                        </div>
                        ))
                    )}
                    </div>
                </>
                )}

            {!chatListOpen && (
              <div className="collapsed-chat-list">
                {chats.map(chat => (
                  <div 
                    key={chat.id}
                    className={`collapsed-chat-item ${selectedChat === chat.id ? 'active' : ''}`}
                    onClick={() => setSelectedChat(chat.id)}
                    title={`${chat.name} - ${chat.petName}`}
                  >
                    <div className="chat-avatar-container">
                      <div className="chat-avatar">{chat.avatar}</div>
                      {chat.online && <div className="online-indicator" />}
                      {chat.unread > 0 && <div className="unread-dot" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="chat-main-area">
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-header-avatar">
                  {currentChat?.avatar}
                  {currentChat?.online && <div className="online-indicator" />}
                </div>
                <div>
                    <h3>{currentChat?.name}</h3>
                    <p className="chat-header-status">
                        {currentChat?.online ? 'Online' : 'Offline'} • {currentChat?.petName} ({currentChat?.petType})
                    </p>
                </div>
              </div>
              <div className="chat-header-actions">
                <button className="chat-action-btn video-call" title="Video Call">
                  <Video size={18} />
                </button>
                <button 
                  className="chat-action-btn" 
                  title={showPetInfo ? "Hide Pet Info" : "Show Pet Info"}
                  onClick={() => setShowPetInfo(!showPetInfo)}
                >
                  <FileText size={18} />
                </button>
                <button className="chat-action-btn" title="More">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Quick Actions Banner */}
            <div className="quick-actions-banner">
            <button 
                className="quick-action-chip"
                onClick={() => {
                    if (currentChat?.petData?.pet_id) {
                    fetchAppointmentDetails(currentChat.petData.pet_id, true); // Pass true to show modal
                    }
                }}
                disabled={loadingAppointment}
                >
                <Calendar size={14} />
                {loadingAppointment ? 'Loading...' : 'View Appointment Details'}
            </button>
            <button className="quick-action-chip">
                <FileText size={14} />
                Add to Medical Records
            </button>
            <button className="quick-action-chip">
                <Clock size={14} />
                Schedule Follow-up
            </button>
            </div>

            {/* Messages Area */}
            <div className="messages-area">
            <div className="empty-messages-state">
                <MessageCircle size={64} className="empty-message-icon" strokeWidth={1.5} />
                <p className="empty-message-text">No messages yet</p>
                {appointmentDetails && appointmentDetails.appt_date ? (
                <p className="next-consultation">
                    Next consultation: {formatDate(appointmentDetails.appt_date)}
                </p>
                ) : (
                <p className="next-consultation">
                    Next consultation: -
                </p>
                )}
            </div>
            </div>

            {/* Message Input */}
            <div className="message-input-container">
              <button className="attach-button" title="Attach File">
                <Paperclip size={18} />
              </button>
              <button className="attach-button" title="Take Photo">
                <Camera size={18} />
              </button>
              <input 
                type="text"
                className="message-input"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button className="send-button">
                <Send size={18} />
              </button>
            </div>
          </div>

          {/* Pet Info Panel */}
          {showPetInfo && currentPet && (
            <div className="pet-info-panel">
            <div className="pet-info-header">
                <h3>Patient Information</h3>
                <button 
                className="close-panel-btn"
                onClick={() => setShowPetInfo(false)}
                >
                <X size={22} />
                </button>
            </div>

            <div className="pet-profile-card">
                <div className="pet-image-large">{currentPet.image}</div>
                <h2>{currentPet.name}</h2>
                <p className="pet-species">{currentPet.species}</p>
                
                <div className="pet-quick-stats">
                <div className="pet-stat">
                    <span className="stat-label-chat">Age</span>
                    <span className="stat-value-chat">{currentPet.age}</span>
                </div>
                <div className="pet-stat">
                    <span className="stat-label-chat">Gender</span>
                    <span className="stat-value-chat">{currentPet.gender}</span>
                </div>
                </div>
            </div>

            <div className="pet-info-section">
                <h4>Owner</h4>
                <p className="info-text">{currentPet.owner}</p>
                <p className="info-text small">{currentPet.ownerEmail}</p>
            </div>

            <div className="pet-info-section">
                <h4>Breed</h4>
                <p className="info-text">{currentPet.breed}</p>
            </div>

            <div className="pet-info-section">
                <h4>Weight</h4>
                <p className="info-text">{currentPet.weight}</p>
            </div>

            <div className="pet-info-section">
                <h4>Diet Type</h4>
                <p className="info-text">{currentPet.dietType}</p>
            </div>

            <div className="pet-info-section">
                <h4>Last Visit</h4>
                <p className="info-text">{currentPet.lastVisit}</p>
            </div>

            <div className="pet-info-section">
                <h4>Next Appointment</h4>
                <p className="info-text highlight">{currentPet.nextAppointment}</p>
            </div>

            <div className="pet-info-section">
                <h4>Behavioral Notes</h4>
                <p className="info-text">{currentPet.behavioralNotes}</p>
            </div>

            <div className="pet-info-section">
                <h4>Active Medications</h4>
                {currentPet.medications.map((med, idx) => (
                <div key={idx} className="medication-item">
                    <span className="medication-dot">💊</span>
                    <p>{med}</p>
                </div>
                ))}
            </div>

            <div className="pet-info-section">
                <h4>Known Allergies</h4>
                <div className="tags-container">
                {currentPet.allergies.map((allergy, idx) => (
                    <span key={idx} className="condition-tag alert">{allergy}</span>
                ))}
                </div>
            </div>

            <div className="pet-info-section">
                <h4>Vaccinations</h4>
                {currentPet.vaccinations.map((vac, idx) => (
                <div key={idx} className="medication-item">
                    <span className="medication-dot">💉</span>
                    <p>{vac}</p>
                </div>
                ))}
            </div>

            <button className="view-records-btn">
                <FileText size={16} />
                View Full Medical History
            </button>

            <button className="update-info-btn">
                Update Patient Records
            </button>
            </div>
        )}
        <AppointmentDetailsModal 
            showModal={showAppointmentModal}
            appointmentDetails={appointmentDetails}
            onClose={() => setShowAppointmentModal(false)}
            formatDate={formatDate}
        />

        </div>
      </div>

    </div>
  );
};

export default VetChat;