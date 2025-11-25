import React, { useState } from 'react';
import { Send, Paperclip, Video, Phone, Search, MoreVertical, Calendar, FileText, Camera, X, ChevronDown, Clock, ChevronLeft, Menu } from 'lucide-react';
import PawPattern from "./components/PawPattern";
import VetNavbar from './components/vet-navbar';
import ProfileNotification from "./components/ProfileNotification";
import './styles/vet-chat.css';

const VetChat = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedChat, setSelectedChat] = useState('max-owner');
  const [message, setMessage] = useState('');
  const [showPetInfo, setShowPetInfo] = useState(true);
  const [chatListOpen, setChatListOpen] = useState(true);
  const [firstName, setFirstName] = useState('');
  
  React.useEffect(() => {
    const storedName = sessionStorage.getItem('firstName');

    if (storedName) {
      setFirstName(storedName);
    }
  }, []);

  // Sample data - Pet Owner Chats
  const chats = [
    {
      id: 'max-owner',
      name: 'Sarah Mitchell',
      petName: 'Max',
      petType: 'Golden Retriever',
      avatar: 'SM',
      lastMessage: 'Will do! Should I book a follow-up appointment?',
      time: '9:52 AM',
      unread: 0,
      online: true
    },
    {
      id: 'luna-owner',
      name: 'James Anderson',
      petName: 'Luna',
      petType: 'Persian Cat',
      avatar: 'JA',
      lastMessage: 'She seems to be limping on her front paw',
      time: '8:30 AM',
      unread: 3,
      online: true
    },
    {
      id: 'buddy-owner',
      name: 'Emily Thompson',
      petName: 'Buddy',
      petType: 'Labrador',
      avatar: 'ET',
      lastMessage: 'Thank you for the vaccination!',
      time: 'Yesterday',
      unread: 0,
      online: false
    },
    {
      id: 'whiskers-owner',
      name: 'Michael Chen',
      petName: 'Whiskers',
      petType: 'Tabby Cat',
      avatar: 'MC',
      lastMessage: 'When should I bring him in?',
      time: 'Yesterday',
      unread: 1,
      online: false
    }
  ];

  const messages = [
    {
      id: 1,
      sender: 'vet',
      text: 'Good morning! How is Max doing today?',
      time: '9:45 AM',
      avatar: 'You'
    },
    {
      id: 2,
      sender: 'user',
      text: "He's been much better! The itching has reduced significantly.",
      time: '9:47 AM',
      avatar: 'SM'
    },
    {
      id: 3,
      sender: 'vet',
      text: "That's great to hear! Continue the medication for another week. Let me know if you notice any changes.",
      time: '9:50 AM',
      avatar: 'You'
    },
    {
      id: 4,
      sender: 'user',
      text: 'Will do! Should I book a follow-up appointment?',
      time: '9:52 AM',
      avatar: 'SM'
    },
    {
      id: 5,
      sender: 'vet',
      text: 'Yes, please book one for next week. We can do it virtually if you prefer.',
      time: '10:30 AM',
      avatar: 'You'
    }
  ];

  const currentPet = {
    name: 'Max',
    species: 'Golden Retriever',
    age: '3 years',
    weight: '32 kg',
    image: '🐕',
    owner: 'Sarah Mitchell',
    ownerContact: '+1 (555) 123-4567',
    ownerEmail: 'sarah.mitchell@email.com',
    lastVisit: 'Nov 15, 2025',
    nextAppointment: 'Nov 28, 2025',
    conditions: ['Allergies', 'Regular Checkup'],
    medications: ['Antihistamine - 2x daily'],
    allergies: ['Certain grass pollens'],
    vaccinations: ['Rabies (Valid until Dec 2025)', 'DHPP (Valid until Jan 2026)']
  };

  const currentChat = chats.find(c => c.id === selectedChat);

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
                  {chats.map(chat => (
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
                  ))}
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
              <button className="quick-action-chip">
                <FileText size={14} />
                Add to Medical Records
              </button>
              <button className="quick-action-chip">
                <Calendar size={14} />
                Schedule Follow-up
              </button>
              <button className="quick-action-chip">
                <Clock size={14} />
                Send Prescription
              </button>
            </div>

            {/* Messages Area */}
            <div className="messages-area">
              <div className="date-divider">
                <span>Today</span>
              </div>

              {messages.map(msg => (
                <div key={msg.id} className={`message ${msg.sender === 'vet' ? 'message-sent' : 'message-received'}`}>
                  {msg.sender === 'user' && (
                    <div className="message-avatar">{msg.avatar}</div>
                  )}
                  <div className="message-content">
                    <div className="message-bubble">
                      <p>{msg.text}</p>
                    </div>
                    <span className="message-time">{msg.time}</span>
                  </div>
                </div>
              ))}
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
          {showPetInfo && (
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
                    <span className="stat-label-chat">Weight</span>
                    <span className="stat-value-chat">{currentPet.weight}</span>
                  </div>
                </div>
              </div>

              <div className="pet-info-section">
                <h4>Owner</h4>
                <p className="info-text">{currentPet.owner}</p>
                <p className="info-text small">{currentPet.ownerContact}</p>
                <p className="info-text small">{currentPet.ownerEmail}</p>
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
                <h4>Current Conditions</h4>
                <div className="tags-container">
                  {currentPet.conditions.map((condition, idx) => (
                    <span key={idx} className="condition-tag">{condition}</span>
                  ))}
                </div>
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

        </div>
      </div>

    </div>
  );
};

export default VetChat;