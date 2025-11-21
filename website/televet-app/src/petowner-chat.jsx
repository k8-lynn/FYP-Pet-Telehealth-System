import React, { useState } from 'react';
import { Send, Paperclip, Video, Phone, Search, MoreVertical, Calendar, FileText, Camera, X, ChevronDown, Clock, ChevronLeft, Menu } from 'lucide-react';
import PawPattern from "./components/PawPattern";
import PetOwnerNavbar from './components/petowner-navbar';
import ProfileNotification from "./components/ProfileNotification";

const PetOwnerChat = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedChat, setSelectedChat] = useState('dr-wilson');
  const [message, setMessage] = useState('');
  const [showPetInfo, setShowPetInfo] = useState(true);
  const [showVetList, setShowVetList] = useState(false);
  const [chatListOpen, setChatListOpen] = useState(true);
  const [firstName, setFirstName] = useState('');
  
    React.useEffect(() => {
      const storedName = sessionStorage.getItem('firstName');
  
      if (storedName) {
        setFirstName(storedName);
      }
    }, []);

  // Sample data
  const chats = [
    {
      id: 'dr-wilson',
      name: 'Dr. Emily Wilson',
      specialty: 'General Veterinarian',
      avatar: 'EW',
      lastMessage: 'The medication should help with the symptoms',
      time: '10:30 AM',
      unread: 0,
      online: true
    },
    {
      id: 'dr-chen',
      name: 'Dr. Michael Chen',
      specialty: 'Pet Surgeon',
      avatar: 'MC',
      lastMessage: 'Surgery went well, recovery looks good',
      time: 'Yesterday',
      unread: 2,
      online: false
    },
    {
      id: 'support',
      name: 'PetCare Support',
      specialty: 'Customer Support',
      avatar: '🐾',
      lastMessage: 'How can we help you today?',
      time: 'Mon',
      unread: 0,
      online: true
    }
  ];

  const messages = [
    {
      id: 1,
      sender: 'vet',
      text: 'Good morning! How is Max doing today?',
      time: '9:45 AM',
      avatar: 'EW'
    },
    {
      id: 2,
      sender: 'user',
      text: "He's been much better! The itching has reduced significantly.",
      time: '9:47 AM'
    },
    {
      id: 3,
      sender: 'vet',
      text: "That's great to hear! Continue the medication for another week. Let me know if you notice any changes.",
      time: '9:50 AM',
      avatar: 'EW'
    },
    {
      id: 4,
      sender: 'user',
      text: 'Will do! Should I book a follow-up appointment?',
      time: '9:52 AM'
    },
    {
      id: 5,
      sender: 'vet',
      text: 'Yes, please book one for next week. We can do it virtually if you prefer.',
      time: '10:30 AM',
      avatar: 'EW'
    }
  ];

  const currentPet = {
    name: 'Max',
    species: 'Golden Retriever',
    age: '3 years',
    weight: '32 kg',
    image: '🐕',
    lastVisit: 'Nov 15, 2025',
    nextAppointment: 'Nov 28, 2025',
    conditions: ['Allergies', 'Regular Checkup'],
    medications: ['Antihistamine - 2x daily']
  };

  const availableVets = [
    { id: 1, name: 'Dr. Sarah Johnson', specialty: 'Emergency Care', status: 'Available Now', avatar: 'SJ' },
    { id: 2, name: 'Dr. Robert Lee', specialty: 'Dental Specialist', status: 'Available Now', avatar: 'RL' },
    { id: 3, name: 'Dr. Amanda Torres', specialty: 'Dermatology', status: 'Available in 15 min', avatar: 'AT' }
  ];

  const currentChat = chats.find(c => c.id === selectedChat);

  return (
    <div className="dashboard-container">
      <PawPattern count={35} />
      
      <PetOwnerNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="main-content">
        <ProfileNotification firstName={firstName} />

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
                {/* Pinned Message - Online Vet Banner */}
                <div className="pinned-message" onClick={() => setShowVetList(!showVetList)}>
                  <div className="pinned-icon">📌</div>
                  <div className="pinned-content">
                    <h4>Want to contact an online vet?</h4>
                    <p>Start messaging now - {availableVets.length} vets available</p>
                  </div>
                  <ChevronDown size={20} className={showVetList ? 'rotated' : ''} />
                </div>

                {/* Available Vets List */}
                {showVetList && (
                  <div className="available-vets-list">
                    <h4>Available Online Vets</h4>
                    {availableVets.map(vet => (
                      <div key={vet.id} className="vet-card-mini">
                        <div className="vet-avatar-mini">{vet.avatar}</div>
                        <div className="vet-info-mini">
                          <h5>{vet.name}</h5>
                          <p>{vet.specialty}</p>
                          <span className="status-badge available">{vet.status}</span>
                        </div>
                        <button className="start-chat-btn">Chat</button>
                      </div>
                    ))}
                  </div>
                )}

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
                        <span className="chat-specialty">{chat.specialty}</span>
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
                    title={chat.name}
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
                    {currentChat?.online ? 'Online' : 'Offline'} • {currentChat?.specialty}
                  </p>
                </div>
              </div>
              <div className="chat-header-actions">
                <button className="chat-action-btn video-call" title="Video Call">
                  <Video size={18} />
                </button>
                <button className="chat-action-btn" title="Book Appointment">
                  <Calendar size={18} />
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
                <Calendar size={14} />
                Book Virtual Appointment
              </button>
              <button className="quick-action-chip">
                <Clock size={14} />
                Set Reminder
              </button>
              <button className="quick-action-chip">
                <FileText size={14} />
                View Medical Records
              </button>
            </div>

            {/* Messages Area */}
            <div className="messages-area">
              <div className="date-divider">
                <span>Today</span>
              </div>

              {messages.map(msg => (
                <div key={msg.id} className={`message ${msg.sender === 'user' ? 'message-sent' : 'message-received'}`}>
                  {msg.sender === 'vet' && (
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
                    <span className="stat-label">Weight</span>
                    <span className="stat-value">{currentPet.weight}</span>
                  </div>
                </div>
              </div>

              <div className="pet-info-section">
                <h4>Recent Visit</h4>
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
                <h4>Medications</h4>
                {currentPet.medications.map((med, idx) => (
                  <div key={idx} className="medication-item">
                    <span className="medication-dot">💊</span>
                    <p>{med}</p>
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

        </div>
      </div>

      <style jsx>{`
        .chat-container {
          display: flex;
          gap: 0;
          height: calc(100vh - 140px);
          background: white;
          border-radius: 20px;
          border: 2px solid #e8f0f7;
          overflow: hidden;
          position: relative;
        }

        /* Chat List Panel */
        .chat-list-panel {
          width: 300px;
          background: #fafbfc;
          border-right: 2px solid #e8f0f7;
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease;
        }

        .chat-list-panel.collapsed {
          width: 60px;
        }

        .chat-list-header {
          padding: 1rem 1rem;
          border-bottom: 2px solid #e8f0f7;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-list-header h2 {
          margin: 0;
          font-size: 1.2rem;
          color: #1a2e35;
          font-weight: 800;
        }

        .header-actions {
          display: flex;
          gap: 0.4rem;
        }

        .search-button, .collapse-button {
          background: white;
          border: 2px solid #e8f0f7;
          border-radius: 8px;
          padding: 0.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: #64748b;
          transition: all 0.2s ease;
        }

        .search-button:hover, .collapse-button:hover {
          background: #f8fbff;
          border-color: #a8ceff;
        }

        /* Pinned Message */
        .pinned-message {
          background: linear-gradient(135deg, #fff9e6 0%, #ffe58f 100%);
          padding: 0.85rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 2px solid #ffd666;
        }

        .pinned-message:hover {
          background: linear-gradient(135deg, #ffe58f 0%, #ffd666 100%);
        }

        .pinned-icon {
          font-size: 1.2rem;
        }

        .pinned-content h4 {
          margin: 0 0 0.2rem 0;
          font-size: 0.8rem;
          color: #1a2e35;
          font-weight: 700;
        }

        .pinned-content p {
          margin: 0;
          font-size: 0.7rem;
          color: #64748b;
          font-weight: 600;
        }

        .rotated {
          transform: rotate(180deg);
          transition: transform 0.3s ease;
        }

        /* Available Vets List */
        .available-vets-list {
          padding: 0.85rem;
          background: white;
          border-bottom: 2px solid #e8f0f7;
          max-height: 240px;
          overflow-y: auto;
        }

        .available-vets-list h4 {
          margin: 0 0 0.7rem 0;
          font-size: 0.7rem;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .vet-card-mini {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.6rem;
          background: #f8fbff;
          border-radius: 10px;
          margin-bottom: 0.4rem;
          transition: all 0.2s ease;
        }

        .vet-card-mini:hover {
          background: #e8f4f8;
          transform: translateX(4px);
        }

        .vet-avatar-mini {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a8ceff 0%, #91befe 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 0.75rem;
        }

        .vet-info-mini {
          flex: 1;
        }

        .vet-info-mini h5 {
          margin: 0 0 0.15rem 0;
          font-size: 0.75rem;
          color: #1a2e35;
          font-weight: 700;
        }

        .vet-info-mini p {
          margin: 0 0 0.15rem 0;
          font-size: 0.65rem;
          color: #64748b;
        }

        .status-badge {
          display: inline-block;
          padding: 0.15rem 0.4rem;
          border-radius: 5px;
          font-size: 0.6rem;
          font-weight: 700;
        }

        .status-badge.available {
          background: #d1f4e0;
          color: #0f766e;
        }

        .start-chat-btn {
          background: linear-gradient(135deg, #a8ceff 0%, #91befe 100%);
          color: white;
          border: none;
          border-radius: 7px;
          padding: 0.4rem 0.75rem;
          font-size: 0.7rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .start-chat-btn:hover {
          transform: scale(1.05);
          background: linear-gradient(135deg, #91befe 0%, #7aabf5 100%);
        }

        /* Chat List */
        .chat-list {
          flex: 1;
          overflow-y: auto;
          padding: 0.4rem;
        }

        .chat-item {
          display: flex;
          gap: 0.6rem;
          padding: 0.75rem;
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.2s ease;
          margin-bottom: 0.2rem;
        }

        .chat-item:hover {
          background: white;
        }

        .chat-item.active {
          background: linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 100%);
          border: 2px solid #a8ceff;
        }

        .chat-avatar-container {
          position: relative;
        }

        .chat-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a8ceff 0%, #91befe 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 0.85rem;
        }

        .online-indicator {
          position: absolute;
          bottom: 1px;
          right: 1px;
          width: 10px;
          height: 10px;
          background: #22c55e;
          border: 2px solid white;
          border-radius: 50%;
        }

        .chat-item-content {
          flex: 1;
          min-width: 0;
        }

        .chat-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.2rem;
        }

        .chat-item-header h4 {
          margin: 0;
          font-size: 0.8rem;
          color: #1a2e35;
          font-weight: 700;
        }

        .chat-time {
          font-size: 0.65rem;
          color: #94a3b8;
          font-weight: 600;
        }

        .chat-item-preview {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.2rem;
        }

        .chat-item-preview p {
          margin: 0;
          font-size: 0.7rem;
          color: #64748b;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .unread-badge {
          background: #ef4444;
          color: white;
          border-radius: 8px;
          padding: 0.1rem 0.4rem;
          font-size: 0.65rem;
          font-weight: 700;
          min-width: 18px;
          text-align: center;
        }

        .chat-specialty {
          font-size: 0.65rem;
          color: #94a3b8;
          font-weight: 600;
        }

        /* Collapsed Chat List */
        .collapsed-chat-list {
          flex: 1;
          padding: 0.6rem 0.3rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          align-items: center;
        }

        .collapsed-chat-item {
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0.3rem;
          border-radius: 8px;
        }

        .collapsed-chat-item:hover {
          background: white;
        }

        .collapsed-chat-item.active {
          background: linear-gradient(135deg, #a8ceff 0%, #91befe 100%);
        }

        .collapsed-chat-item .chat-avatar {
          width: 36px;
          height: 36px;
        }

        .unread-dot {
          position: absolute;
          top: 0;
          right: 0;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border: 2px solid #fafbfc;
          border-radius: 50%;
        }

        /* Main Chat Area */
        .chat-main-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: white;
        }

        .chat-header {
          padding: 0.9rem 1.2rem;
          border-bottom: 2px solid #e8f0f7;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fafbfc;
        }

        .chat-header-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .chat-header-avatar {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a8ceff 0%, #91befe 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 0.85rem;
        }

        .chat-header-info h3 {
          margin: 0 0 0.2rem 0;
          font-size: 0.95rem;
          color: #1a2e35;
          font-weight: 700;
        }

        .chat-header-status {
          margin: 0;
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
        }

        .chat-header-actions {
          display: flex;
          gap: 0.4rem;
        }

        .chat-action-btn {
          background: white;
          border: 2px solid #e8f0f7;
          border-radius: 8px;
          padding: 0.6rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: #64748b;
          transition: all 0.2s ease;
        }

        .chat-action-btn:hover {
          background: #f8fbff;
          border-color: #a8ceff;
          color: #1a2e35;
          transform: translateY(-2px);
        }

        .chat-action-btn.video-call {
          background: linear-gradient(135deg, #a8ceff 0%, #91befe 100%);
          border-color: #a8ceff;
          color: white;
        }

        .chat-action-btn.video-call:hover {
          background: linear-gradient(135deg, #91befe 0%, #7aabf5 100%);
        }

        /* Quick Actions Banner */
        .quick-actions-banner {
          padding: 0.75rem 1.2rem;
          background: #f8fbff;
          border-bottom: 2px solid #e8f0f7;
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .quick-action-chip {
          background: white;
          border: 2px solid #e8f0f7;
          border-radius: 16px;
          padding: 0.45rem 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-action-chip:hover {
          background: linear-gradient(135deg, #a8ceff 0%, #91befe 100%);
          border-color: #a8ceff;
          color: white;
          transform: translateY(-2px);
        }

        /* Messages Area */
        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 1.2rem;
          background: #fafbfc;
        }

        .date-divider {
          text-align: center;
          margin: 1.2rem 0;
        }

        .date-divider span {
          background: white;
          padding: 0.4rem 0.8rem;
          border-radius: 16px;
          font-size: 0.7rem;
          color: #64748b;
          font-weight: 600;
          border: 2px solid #e8f0f7;
        }

        .message {
          display: flex;
          gap: 0.6rem;
          margin-bottom: 0.9rem;
        }

        .message-sent {
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a8ceff 0%, #91befe 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 0.75rem;
          flex-shrink: 0;
        }

        .message-content {
          max-width: 60%;
        }

        .message-sent .message-content {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .message-bubble {
          padding: 0.65rem 0.9rem;
          border-radius: 14px;
          margin-bottom: 0.25rem;
        }

        .message-received .message-bubble {
          background: white;
          border: 2px solid #e8f0f7;
        }

        .message-sent .message-bubble {
          background: linear-gradient(135deg, #a8ceff 0%, #91befe 100%);
          color: white;
        }

        .message-bubble p {
          margin: 0;
          font-size: 0.8rem;
          line-height: 1.4;
        }

        .message-time {
          font-size: 0.65rem;
          color: #94a3b8;
          font-weight: 600;
          padding: 0 0.4rem;
        }

        /* Message Input */
        .message-input-container {
          padding: 0.9rem 1.2rem;
          background: white;
          border-top: 2px solid #e8f0f7;
          display: flex;
          gap: 0.6rem;
          align-items: center;
        }

        .attach-button {
          background: #f8fafc;
          border: 2px solid #e8f0f7;
          border-radius: 8px;
          padding: 0.6rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: #64748b;
          transition: all 0.2s ease;
        }

        .attach-button:hover {
          background: #f1f5f9;
          border-color: #a8ceff;
          color: #1a2e35;
        }

        .message-input {
          flex: 1;
          background: #f8fafc;
          border: 2px solid #e8f0f7;
          border-radius: 10px;
          padding: 0.65rem 0.9rem;
          font-size: 0.8rem;
          color: #1a2e35;
          outline: none;
          transition: all 0.2s ease;
        }

        .message-input:focus {
          background: white;
          border-color: #a8ceff;
        }

        .message-input::placeholder {
          color: #94a3b8;
        }

        .send-button {
          background: linear-gradient(135deg, #a8ceff 0%, #91befe 100%);
          border: none;
          border-radius: 8px;
          padding: 0.7rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: white;
          transition: all 0.2s ease;
        }

        .send-button:hover {
          background: linear-gradient(135deg, #91befe 0%, #7aabf5 100%);
          transform: translateY(-2px);
        }call {
          background: linear-gradient(135deg, #a8ceff 0%, #91befe 100%);
          border-color: #a8ceff;
          color: white;
        }

        .chat-action-btn.video-call:hover {
          background: linear-gradient(135deg, #91befe 0%, #7aabf5 100%);
        }

        /* Quick Actions Banner */
        .quick-actions-banner {
          padding: 0.9rem 1.5rem;
          background: #f8fbff;
          border-bottom: 2px solid #e8f0f7;
          display: flex;
          gap: 0.65rem;
          flex-wrap: wrap;
        }

        .quick-action-chip {
          background: white;
          border: 2px solid #e8f0f7;
          border-radius: 20px;
          padding: 0.55rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-action-chip:hover {
          background: linear-gradient(135deg, #a8ceff 0%, #91befe 100%);
          border-color: #a8ceff;
          color: white;
          transform: translateY(-2px);
        }

        /* Messages Area */
        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          background: #fafbfc;
        }

        .date-divider {
          text-align: center;
          margin: 1.5rem 0;
        }

        .date-divider span {
          background: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 600;
          border: 2px solid #e8f0f7;
        }

        .message {
          display: flex;
          gap: 0.7rem;
          margin-bottom: 1.15rem;
        }

        .message-sent {
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a8ceff 0%, #91befe 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        .message-content {
          max-width: 60%;
        }

        .message-sent .message-content {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .message-bubble {
          padding: 0.8rem 1.1rem;
          border-radius: 18px;
          margin-bottom: 0.3rem;
        }

        .message-received .message-bubble {
          background: white;
          border: 2px solid #e8f0f7;
        }

        .message-sent .message-bubble {
          background: linear-gradient(135deg, #a8ceff 0%, #91befe 100%);
          color: white;
        }

        .message-bubble p {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .message-time {
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 600;
          padding: 0 0.5rem;
        }

        /* Message Input */
        .message-input-container {
          padding: 1.15rem 1.5rem;
          background: white;
          border-top: 2px solid #e8f0f7;
          display: flex;
          gap: 0.7rem;
          align-items: center;
        }

        .attach-button {
          background: #f8fafc;
          border: 2px solid #e8f0f7;
          border-radius: 10px;
          padding: 0.7rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: #64748b;
          transition: all 0.2s ease;
        }

        .attach-button:hover {
          background: #f1f5f9;
          border-color: #a8ceff;
          color: #1a2e35;
        }

        .message-input {
          flex: 1;
          background: #f8fafc;
          border: 2px solid #e8f0f7;
          border-radius: 12px;
          padding: 0.8rem 1.1rem;
          font-size: 0.9rem;
          color: #1a2e35;
          outline: none;
          transition: all 0.2s ease;
        }

        .message-input:focus {
          background: white;
          border-color: #a8ceff;
        }

        .message-input::placeholder {
          color: #94a3b8;
        }

        .send-button {
          background: linear-gradient(135deg, #a8ceff 0%, #91befe 100%);
          border: none;
          border-radius: 10px;
          padding: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: white;
          transition: all 0.2s ease;
        }

        .send-button:hover {
          background: linear-gradient(135deg, #91befe 0%, #7aabf5 100%);
          transform: translateY(-2px);
        }

        /* Pet Info Panel */
        .pet-info-panel {
          width: 320px;
          background: white;
          border-left: 2px solid #e8f0f7;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .pet-info-header {
          padding: 1.25rem 1.25rem;
          border-bottom: 2px solid #e8f0f7;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fafbfc;
        }

        .pet-info-header h3 {
          margin: 0;
          font-size: 1.3rem;
          color: #1a2e35;
          font-weight: 800;
        }

        .close-panel-btn {
          background: #f8fafc;
          border: 2px solid #e8f0f7;
          border-radius: 10px;
          padding: 0.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: #64748b;
          transition: all 0.2s ease;
        }

        .close-panel-btn:hover {
          background: #f1f5f9;
          border-color: #ef4444;
          color: #ef4444;
        }

        .pet-profile-card {
          padding: 1.75rem 1.25rem;
          text-align: center;
          background: linear-gradient(135deg, #f0f8ff 0%, #e8f4f8 100%);
          border-bottom: 2px solid #e8f0f7;
        }

        .pet-image-large {
          font-size: 4.5rem;
          margin-bottom: 1rem;
        }

        .pet-profile-card h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.75rem;
          color: #1a2e35;
          font-weight: 800;
        }

        .pet-species {
          margin: 0 0 1.25rem 0;
          font-size: 0.95rem;
          color: #64748b;
          font-weight: 600;
        }

        .pet-quick-stats {
          display: flex;
          gap: 0.85rem;
          justify-content: center;
        }

        .pet-stat {
          background: white;
          border: 2px solid #e8f0f7;
          border-radius: 12px;
          padding: 0.9rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-value {
          font-size: 1.05rem;
          color: #1a2e35;
          font-weight: 800;
        }

        .pet-info-section {
          padding: 1.25rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .pet-info-section h4 {
          margin: 0 0 0.65rem 0;
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .info-text {
          margin: 0;
          font-size: 0.9rem;
          color: #1a2e35;
          font-weight: 600;
        }

        .info-text.highlight {
          color: #a8ceff;
          font-weight: 800;
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .condition-tag {
          background: #fff3cd;
          border: 2px solid #ffd666;
          color: #1a2e35;
          padding: 0.5rem 0.9rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .medication-item {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.65rem;
          background: #f8fbff;
          border-radius: 10px;
          margin-bottom: 0.5rem;
        }

        .medication-dot {
          font-size: 1.1rem;
        }

        .medication-item p {
          margin: 0;
          font-size: 0.85rem;
          color: #475569;
          font-weight: 600;
        }

        .view-records-btn {
          margin: 1.25rem;
          background: linear-gradient(135deg, #a8ceff 0%, #91befe 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 700;
          transition: all 0.2s ease;
        }

        .view-records-btn:hover {
          background: linear-gradient(135deg, #91befe 0%, #7aabf5 100%);
          transform: translateY(-2px);
        }

        .update-info-btn {
          margin: 0 1.25rem 1.25rem 1.25rem;
          background: white;
          color: #475569;
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          padding: 0.9rem;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 700;
          transition: all 0.2s ease;
        }

        .update-info-btn:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          color: #1a2e35;
          transform: translateY(-2px);
        }

        .rotate-left {
          display: none;
        }

        /* Responsive */
        @media (max-width: 1400px) {
          .pet-info-panel {
            width: 320px;
          }
        }

        @media (max-width: 1200px) {
          .chat-list-panel {
            width: 340px;
          }
          
          .pet-info-panel {
            display: none;
          }
          
          .show-pet-info-btn {
            display: none;
          }
        }

        @media (max-width: 992px) {
          .chat-list-panel {
            width: 300px;
          }
          
          .message-content {
            max-width: 70%;
          }
        }

        @media (max-width: 768px) {
          .chat-container {
            height: calc(100vh - 120px);
          }

          .chat-list-panel {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            z-index: 10;
            box-shadow: 2px 0 10px rgba(0,0,0,0.1);
          }

          .chat-list-panel.collapsed {
            width: 0;
            overflow: hidden;
          }
          
          .quick-actions-banner {
            flex-wrap: nowrap;
            overflow-x: auto;
          }
          
          .chat-header-actions {
            gap: 0.4rem;
          }
          
          .chat-action-btn {
            padding: 0.7rem;
          }

          .message-content {
            max-width: 80%;
          }
        }
      `}</style>
    </div>
  );
};

export default PetOwnerChat;