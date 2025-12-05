//vet-chat.jsx
import React, { useState } from 'react';
import { Send, Paperclip, Video, Phone, Search, MoreVertical, Calendar, FileText, Camera, X, ChevronDown, Clock, ChevronLeft, Menu, MessageCircle, MapPin } from 'lucide-react';
import PawPattern from "./components/PawPattern";
import VetNavbar from './components/vet-navbar';
import ProfileNotification from "./components/ProfileNotification";
import AppointmentDetailsModal from './components/AppointmentDetailsModal';
import './styles/vet-chat.css';
import { useChat } from './hooks/useChat';
import { useNotification } from './components/NotificationProvider';

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
  const [vtId, setVtId] = useState(null);
  const [userid, setUserid] = useState(null);
  const [clinicInfo, setClinicInfo] = useState({});
  const [lastVisitData, setLastVisitData] = useState(null);
  const { socket } = useNotification();

  const [chatId, setChatId] = useState(null);
  const { messages, isTyping, otherUserOnline, fetchMessages, sendMessage, sendTyping, markAsRead } = useChat(
    chatId, 
    userid, 
    'vt'  // or 'vt' for vet
  );

  // ✅ Add this useEffect to notify NotificationProvider we're on chat page
React.useEffect(() => {
  console.log('🏠 Mounted on Vet Chat page');
  if (window.setIsOnChatPage) {
    window.setIsOnChatPage(true);
  }

  return () => {
    console.log('👋 Leaving Vet Chat page');
    if (window.setIsOnChatPage) {
      window.setIsOnChatPage(false);
    }
  };
}, []);

  // Request notification permission on mount
  React.useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Load userid from sessionStorage
  React.useEffect(() => {
    const storedUserId = sessionStorage.getItem('userid');
    console.log('🔑 Loading userid from session:', storedUserId); // ADD THIS
    if (storedUserId) {
      setUserid(storedUserId);
    }
  }, []);

// Mark messages as read when viewing chat or when new messages arrive
React.useEffect(() => {
  if (chatId && selectedChat && messages.length > 0) {
    const hasUnreadMessages = messages.some(msg => 
      msg.sender_role !== 'vt' && msg.is_read === 'no'
    );
    
    if (hasUnreadMessages) {
      markAsRead().then(() => {
        // ✅ Update local state to clear unread count
        setMyPatients(prev => prev.map(patient => 
          patient.chat_id === chatId ? { ...patient, unread_count: 0 } : patient
        ));
      });
    } else if (messages.length > 0) {
      // ✅ If no unread messages but we just opened chat, also clear count
      setMyPatients(prev => prev.map(patient => 
        patient.chat_id === chatId ? { ...patient, unread_count: 0 } : patient
      ));
    }
  }
}, [chatId, selectedChat, messages, markAsRead]);

  const formatDateDivider = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    }
  };

  const shouldShowDateDivider = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;
    
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const previousDate = new Date(previousMsg.created_at).toDateString();
    
    return currentDate !== previousDate;
  };

  React.useEffect(() => {
    const storedName = sessionStorage.getItem('firstName');
    const storedVetId = sessionStorage.getItem('vt_id');

    console.log('🔑 Session data:', { storedName, storedVetId });

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
      fetchLastVisit(currentChat.petData.pet_id);
      
      // Initialize chat
      if (vtId && currentChat.petData.pp_id) {
        initializeChat(currentChat.petData.pp_id, vtId);
      }
    }
  }, [selectedChat, vtId]); // eslint-disable-line

  // Fetch vet info
  React.useEffect(() => {
    const fetchVetInfo = async () => {
      if (!userid) return;

      try {
        const response = await fetch(`http://localhost:5000/api/profile/${userid}`);
        const data = await response.json();

        if (response.ok) {
          setVtId(data.vt_id);
          setClinicInfo({
            vetLocation: data.vt_vetLocation,
            clinicName: data.vt_clinicName,
            clinicPhone: data.vt_clinicPhone,
            clinicEmail: data.vt_clinicEmail
          });
        }
      } catch (error) {
        console.error('Error fetching vet info:', error);
      }
    };

    fetchVetInfo();
  }, [userid]);

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

  // Add this useEffect after your existing useEffects
  React.useEffect(() => {
    if (selectedChat && chatId && userid) {
      // Mark messages as read when viewing this chat
      markAsRead();
    }
  }, [selectedChat, chatId, userid, markAsRead]);

  

  // Fetch patients assigned to this vet
  const fetchMyPatients = async (vt_id) => {
    try {
      setLoading(true);
      console.log('🔍 Fetching patients for vt_id:', vt_id);
      
      const response = await fetch(`http://localhost:5000/api/vet-patients/${vt_id}`);
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Received data:', data);
      
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

  // Initialize chat between vet and pet parent
  const initializeChat = async (pp_id, vt_id) => {
    try {
      const response = await fetch('http://localhost:5000/api/chat/get-or-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pp_id, vt_id })
      });
      const chat = await response.json();
      setChatId(chat.chat_id);
      
      // ✅ Mark messages as read after initializing chat
      setTimeout(() => {
        markAsRead();
      }, 500);
      
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

  // Transform myPatients into chat format
  const chats = myPatients.map(patient => ({
    id: `patient-${patient.pet_id}`,
    name: `${patient.owner_firstName} ${patient.owner_lastName}`,
    petName: patient.pet_name,
    petType: patient.pet_species,
    avatar: `${patient.owner_firstName?.charAt(0) || ''}${patient.owner_lastName?.charAt(0) || ''}`,
    lastMessage: patient.last_msg || 'No recent messages',
    time: patient.last_msg_at 
      ? new Date(patient.last_msg_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      : new Date(patient.pet_lastUpdated || patient.pp_createdAt).toLocaleDateString(),
    unread: patient.unread_count || 0,
    online: patient.owner_usr_isOnline === 'yes',
    petData: patient
  }));

  const currentChat = chats.find(c => c.id === selectedChat);

  React.useEffect(() => {
    if (!socket) return;
  
    const handleMessageNotification = ({ senderName, message, chat_id, sender_id }) => {
      console.log('📨 Message notification received:', { senderName, message, chat_id });
      
      // ✅ Don't show toast if we're already viewing this chat
      if (selectedChat && currentChat?.petData?.chat_id === chat_id) {
        console.log('⏭️ Already in this chat, skipping notification');
        return;
      }
      
      // ✅ Don't show toast if we're on the chat page at all
      console.log('⏭️ On chat page, skipping toast notification');
      
      // Only play sound, no toast
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => console.log('Could not play sound'));
      
      // Browser notification only (if permission granted)
      if (Notification.permission === 'granted') {
        new Notification(senderName, {
          body: message,
          icon: '/paw-icon.png'
        });
      }
    };
  
    socket.on('newMessageNotification', handleMessageNotification);
  
    return () => {
      socket.off('newMessageNotification', handleMessageNotification);
    };
  }, [socket, selectedChat, currentChat]);
  

  // Add this after your existing useEffect with socket listeners
  React.useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      console.log('📨 New message received:', message);
      
      // Always refresh the list to update unread counts
      if (userid && vtId) {
        fetchMyPatients(vtId);
      }
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, userid, vtId]); // Remove chatId from dependencies

  React.useEffect(() => {
    if (!socket) return;
  
    const handleMessagesRead = ({ chatId, userId: readByUserId }) => {
      console.log('📖 Vet: messagesRead received for chat', chatId);
  
      // Only clear unread count if the OTHER user read messages
      if (String(readByUserId) !== String(userid)) {
        setMyPatients(prev =>
          prev.map(patient =>
            patient.chat_id === chatId
              ? { ...patient, unread_count: 0 }
              : patient
          )
        );
      }
    };
  
    socket.on('messagesRead', handleMessagesRead);
  
    return () => {
      socket.off('messagesRead', handleMessagesRead);
    };
  }, [socket, userid]);

  // ADD this new useEffect after your existing socket listeners (around line 320):
  React.useEffect(() => {
    if (!socket) return;

    const handleChatListUpdate = ({ chat_id, last_msg, last_msg_at, sender_id }) => {
      console.log('📋 Chat list update received for chat:', chat_id);
      
      // Update the local state without full refresh
      setMyPatients(prev => prev.map(patient => {
        if (patient.chat_id === chat_id) {
          // If sender is not current user, increment unread
          const shouldIncrement = String(sender_id) !== String(userid);
          
          return {
            ...patient,
            last_msg,
            last_msg_at,
            unread_count: shouldIncrement 
              ? (patient.unread_count || 0) + 1 
              : patient.unread_count
          };
        }
        return patient;
      }));
    };

    socket.on('chatListUpdate', handleChatListUpdate);

    return () => {
      socket.off('chatListUpdate', handleChatListUpdate);
    };
  }, [socket, userid]);

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
    <div className="vet-dashboard-container">
      <PawPattern count={35} />
      
      <VetNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <div className="vetadmin-header">
          <div className="location-info">
            <MapPin size={20} className="location-icon" />
            <span className="location-text">{clinicInfo.clinicName || 'PawCare Veterinary Clinic'}</span>
          </div>
          <ProfileNotification firstName={firstName} />
        </div>

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
                          {chat.unread > 0 && <div className="unread-dot" />}
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
                    {otherUserOnline ? 'Online' : 'Offline'} • {currentChat?.petName} ({currentChat?.petType})
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
                Add to Medical Records
              </button>
              <button className="quick-action-chip">
                <Clock size={14} />
                Schedule Follow-up
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
                  {messages.map((msg, index) => (
                    <React.Fragment key={msg.msg_id}>
                      {shouldShowDateDivider(msg, messages[index - 1]) && (
                        <div className="date-divider">
                          <span>{formatDateDivider(msg.created_at)}</span>
                        </div>
                      )}
                      <div 
                        className={`message message-${msg.sender_role === 'vt' ? 'sent' : 'received'}`}
                      >
                        <div className="message-content">
                          <div className="message-bubble">
                            <p>{msg.msg}</p>
                          </div>
                          <span className="message-time">
                            {new Date(msg.created_at).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                            {msg.sender_role === 'vt' && (
                              <span style={{ marginLeft: '4px' }}>
                                {msg.is_read === 'yes' ? '✓✓' : '✓'}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
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
                    setMessage('');
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