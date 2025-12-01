//petowner-chat.jsx
import React, { useState } from 'react';
import { Send, Paperclip, Video, Phone, Search, MoreVertical, Calendar, FileText, Camera, X, ChevronDown, Clock, ChevronLeft, Menu, MessageCircle, MapPin } from 'lucide-react';
import PawPattern from "./components/PawPattern";
import PetOwnerNavbar from './components/petowner-navbar';
import ProfileNotification from "./components/ProfileNotification";
import AppointmentDetailsModal from './components/AppointmentDetailsModal';
import './styles/petowner-chat.css';
import { useChat } from './hooks/useChat';

const PetOwnerChat = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [showPetInfo, setShowPetInfo] = useState(true);
  const [chatListOpen, setChatListOpen] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [myPets, setMyPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [loadingAppointment, setLoadingAppointment] = useState(false);
  const [userid, setUserid] = useState(null);
  const [ppId, setPpId] = useState(null);
  const [lastVisitData, setLastVisitData] = useState(null);

  const [chatId, setChatId] = useState(null);
  const { messages, isConnected, isTyping, fetchMessages, sendMessage, sendTyping } = useChat(
    chatId, 
    userid, 
    'pp'
  );

  React.useEffect(() => {
    const storedName = sessionStorage.getItem('firstName');
    const storedUserId = sessionStorage.getItem('userid');

    console.log('🔑 Session data:', { storedName, storedUserId });

    if (storedName) {
      setFirstName(storedName);
    }

    if (storedUserId) {
      setUserid(storedUserId);
      fetchPetParentInfo(storedUserId);
    } else {
      console.log('⚠️ No userid found in session storage');
      setLoading(false);
    }
  }, []);

  // Fetch appointment details when selectedChat changes
  // Update the selectedChat useEffect:
  React.useEffect(() => {
    if (selectedChat && currentChat?.petData?.pet_id) {
      fetchAppointmentDetails(currentChat.petData.pet_id);
      fetchLastVisit(currentChat.petData.pet_id);
      
      // Initialize chat
      if (ppId && currentChat.petData.pet_assignedVet) {
        initializeChat(ppId, currentChat.petData.pet_assignedVet);
      }
    }
  }, [selectedChat, ppId]); // eslint-disable-line

  // Fetch messages when chatId changes
  React.useEffect(() => {
    if (chatId) {
      console.log('🔄 chatId changed, fetching messages for chat_id:', chatId);
      fetchMessages();
    }
  }, [chatId, fetchMessages]);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    const messagesArea = document.querySelector('.messages-area');
    if (messagesArea) {
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }
  };
  // In your frontend - petowner-chat.jsx
  const fetchPetParentInfo = async (userId) => {
    try {
      console.log('🔍 Fetching pet parent for userId:', userId); // ADD THIS
      const response = await fetch(`http://localhost:5000/api/petparent/${userId}`);
      const data = await response.json();

      console.log('📦 Pet parent info:', data);
      console.log('📦 pp_id received:', data.pp_id); // ADD THIS

      if (response.ok && data.pp_id) {
        setPpId(data.pp_id);
        console.log('🚀 About to fetch pets for pp_id:', data.pp_id); // ADD THIS
        fetchMyPets(data.pp_id);
      } else {
        console.log('⚠️ No pet parent found for this user');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error fetching pet parent info:', error);
      setLoading(false);
    }
  };

  const fetchMyPets = async (pp_id) => {
    try {
      setLoading(true);
      console.log('🔍 Fetching pets for pp_id:', pp_id);
  
      // ✅ Use the new endpoint
      const response = await fetch(`http://localhost:5000/api/pets/by-parent/${pp_id}`);
  
      console.log('📡 Response status:', response.status);
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('📦 Received pets:', data);
      console.log('📦 First pet assignedVet:', data[0]?.pet_assignedVet);
  
      // For each pet, fetch vet information if assigned
      const petsWithVetInfo = await Promise.all(
        data.map(async (pet) => {
          if (pet.pet_assignedVet) {
            try {
              console.log(`🔍 Fetching vet info for pet "${pet.pet_name}" with vt_id: ${pet.pet_assignedVet}`);
              const vetResponse = await fetch(`http://localhost:5000/api/veterinarian/${pet.pet_assignedVet}`);
              
              console.log(`📡 Vet API response status for ${pet.pet_name}:`, vetResponse.status);
              
              if (vetResponse.ok) {
                const vetData = await vetResponse.json();
                console.log(`✅ Fetched vet data for ${pet.pet_name}:`, vetData);
                return {
                  ...pet,
                  vet_firstName: vetData.usr_firstName,
                  vet_lastName: vetData.usr_lastName,
                  vet_specialization: vetData.vt_specialization,
                  vet_clinicName: vetData.vt_clinicName,
                  vet_vetLocation: vetData.vt_vetLocation
                };
              } else {
                console.error(`❌ Failed to fetch vet for ${pet.pet_name}. Status: ${vetResponse.status}`);
              }
            } catch (vetError) {
              console.error(`⚠️ Error fetching vet info for pet ${pet.pet_name}:`, vetError);
            }
          } else {
            console.log(`⚠️ Pet "${pet.pet_name}" has no assigned vet`);
          }
          return pet;
        })
      );
  
      // Filter only pets that have an assigned vet AND have vet info loaded
      const petsWithVet = petsWithVetInfo.filter(pet => 
        pet.pet_assignedVet !== null && pet.vet_firstName && pet.vet_lastName
      );
  
      console.log('🔍 All pets:', petsWithVetInfo);
      console.log('🔍 Pets with complete vet info:', petsWithVet);
      console.log('🔍 Filtered out pets:', petsWithVetInfo.filter(p => !petsWithVet.includes(p)));
            
      setMyPets(petsWithVet);
  
      console.log('📋 Pets with complete vet info:', petsWithVet);
  
      // Set first pet as selected by default if exists
      if (petsWithVet.length > 0) {
        setSelectedChat(`pet-${petsWithVet[0].pet_id}`);
        console.log('✅ Selected first pet:', petsWithVet[0].pet_name);
      } else {
        console.log('⚠️ No pets with assigned vets found');
      }
  
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching pets:', error);
      setLoading(false);
    }
  };

  // Add after fetchMyPets function:
  const initializeChat = async (pp_id, vt_id) => {
    try {
      const response = await fetch('http://localhost:5000/api/chat/get-or-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pp_id, vt_id })
      });
      const chat = await response.json();
      setChatId(chat.chat_id);
      return chat.chat_id;
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const fetchAppointmentDetails = async (pet_id, showModal = false) => {
    try {
      setLoadingAppointment(true);
      const response = await fetch(`http://localhost:5000/api/scheduled-appointment/${pet_id}`);

      if (response.status === 404) {
        console.log('No scheduled appointment found for this pet');
        setAppointmentDetails(null);
        setLoadingAppointment(false);
        if (showModal) {
          alert('No scheduled appointment found for this pet');
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

  const fetchLastVisit = async (pet_id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/last-completed-appointment/${pet_id}`);

      if (response.status === 404) {
        console.log('No completed appointment found');
        setLastVisitData(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLastVisitData(data);
    } catch (error) {
      console.error('❌ Error fetching last visit:', error);
      setLastVisitData(null);
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

  // Transform myPets into chat format
  const chats = myPets.map(pet => ({
    id: `pet-${pet.pet_id}`,
    name: pet.vet_firstName && pet.vet_lastName 
      ? `Dr. ${pet.vet_firstName} ${pet.vet_lastName}` 
      : `Vet ID: ${pet.pet_assignedVet}`,
    specialty: pet.vet_specialization || 'General Veterinarian',
    avatar: pet.vet_firstName && pet.vet_lastName 
      ? `${pet.vet_firstName.charAt(0)}${pet.vet_lastName.charAt(0)}` 
      : 'V',
    lastMessage: 'No recent messages',
    time: new Date(pet.pet_lastUpdated || Date.now()).toLocaleDateString(),
    unread: 0,
    online: false,
    petName: pet.pet_name,
    petType: pet.pet_species,
    petData: pet
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
    veterinarian: currentChat.name,
    vetSpecialty: currentChat.specialty,
    clinic: currentChat.petData.vet_clinicName || 'PawCare Clinic',
    clinicLocation: currentChat.petData.vet_vetLocation || 'Location not specified',
    lastVisit: lastVisitData && lastVisitData.appt_date 
      ? new Date(lastVisitData.appt_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'No previous visits',
    nextAppointment: appointmentDetails && appointmentDetails.appt_date
      ? new Date(appointmentDetails.appt_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
      : '-',
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
    <div className="petowner-dashboard-container">
      <PawPattern count={35} />
      
      <PetOwnerNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <div className="petowner-header">
          <ProfileNotification firstName={firstName} />
        </div>

        <div className="chat-container">
          {/* Chat List Sidebar */}
          <div className={`chat-list-panel ${!chatListOpen ? 'collapsed' : ''}`}>
            <div className="chat-list-header">
              <h2>{chatListOpen ? 'Messages' : ''}</h2>
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
                      <p>Loading your pets...</p>
                    </div>
                  ) : myPets.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                      <p>No pets with assigned veterinarians yet</p>
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
                    {currentChat?.online ? 'Online' : 'Offline'} • {currentChat?.specialty} • Treating {currentChat?.petName}
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
                    fetchAppointmentDetails(currentChat.petData.pet_id, true);
                  }
                }}
                disabled={loadingAppointment}
              >
                <Calendar size={14} />
                {loadingAppointment ? 'Loading...' : 'View Appointment Details'}
              </button>
              <button className="quick-action-chip">
                <FileText size={14} />
                View Medical Records
              </button>
              <button className="quick-action-chip">
                <Clock size={14} />
                Set Reminder
              </button>
            </div>

            {/* Messages Area */}
            <div className="messages-area">
              {messages.length === 0 ? (
                <div className="empty-messages-state">
                  <MessageCircle size={64} className="empty-message-icon" strokeWidth={1.5} />
                  <p className="empty-message-text">No messages yet</p>
                  {appointmentDetails && appointmentDetails.appt_date ? (
                    <p className="next-consultation">
                      Next consultation: {formatDate(appointmentDetails.appt_date)}
                    </p>
                  ) : (
                    <p className="next-consultation">Next consultation: -</p>
                  )}
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div 
                      key={msg.msg_id}
                      className={`message message-${msg.sender_role === 'pp' ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        <div className="message-bubble">
                          <p>{msg.msg}</p>
                          <span className="message-time">
                            {new Date(msg.created_at).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  )}
                </>
              )}
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
                onChange={(e) => {
                  setMessage(e.target.value);
                  sendTyping(e.target.value.length > 0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (message.trim()) {
                      sendMessage(message);
                      setMessage('');
                      sendTyping(false);
                    }
                  }
                }}
              />
              <button 
                className="send-button"
                onClick={async () => {
                  if (message.trim()) {
                    await sendMessage(message);
                    setMessage('');  // ✅ This already exists, should be working
                    sendTyping(false);
                  }
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>

          {/* Pet Info Panel */}
          {showPetInfo && currentPet && (
            <div className="pet-info-panel">
              <div className="pet-info-header">
                <h3>Pet Information</h3>
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
                    <span className="stat-label">Age</span>
                    <span className="stat-value">{currentPet.age}</span>
                  </div>
                  <div className="pet-stat">
                    <span className="stat-label">Gender</span>
                    <span className="stat-value">{currentPet.gender}</span>
                  </div>
                </div>
              </div>

              <div className="pet-info-section">
                <h4>Assigned Veterinarian</h4>
                <p className="info-text">{currentPet.veterinarian}</p>
                <p className="info-text small">{currentPet.vetSpecialty}</p>
              </div>

              <div className="pet-info-section">
                <h4>Clinic</h4>
                <p className="info-text">{currentPet.clinic}</p>
                <p className="info-text small">{currentPet.clinicLocation}</p>
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
                View Full Medical Records
              </button>

              <button className="update-info-btn">
                Update Pet Information
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

export default PetOwnerChat;