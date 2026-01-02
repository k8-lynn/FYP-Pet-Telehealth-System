//petowner-chat.jsx
import React, { useState } from "react";
import {
  Send,
  Paperclip,
  Video,
  Phone,
  Search,
  MoreVertical,
  Calendar,
  FileText,
  Camera,
  X,
  ChevronDown,
  Clock,
  ChevronLeft,
  Menu,
  MessageCircle,
  MapPin,
} from "lucide-react";
import PawPattern from "./components/PawPattern";
import PetOwnerNavbar from "./components/petowner-navbar";
import ProfileNotification from "./components/ProfileNotification";
import AppointmentDetailsModal from "./components/AppointmentDetailsModal";
import "./styles/petowner-chat.css";
import { useChat } from "./hooks/useChat";
import { useNotification } from "./components/NotificationProvider";
import VideoCall from "./components/VideoCall";
import IncomingCallNotification from "./components/IncomingCallNotification";
import PatientProfileModal from "./components/PatientProfileModal";
import BookAppointment from "./components/bookAppointment";
import showStyledAlert from "./utils/styledAlert";

const PetOwnerChat = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [showPetInfo, setShowPetInfo] = useState(true);
  const [chatListOpen, setChatListOpen] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [myPets, setMyPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [loadingAppointment, setLoadingAppointment] = useState(false);
  const [userid, setUserid] = useState(null);
  const [ppId, setPpId] = useState(null);
  const [lastVisitData, setLastVisitData] = useState(null);
  const { socket } = useNotification();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState(null);
  const [searchResults, setSearchResults] = useState({
    vets: [],
    messages: [],
  });
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);
  const shouldAutoScroll = React.useRef(true);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showCreateReminderModal, setShowCreateReminderModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [registeredClinic, setRegisteredClinic] = useState(null);
  const [show24x7Vets, setShow24x7Vets] = useState(false);
  const [onlineVets, setOnlineVets] = useState([]);
  const [loading24x7, setLoading24x7] = useState(false);
  const [selectedPetDisplay, setSelectedPetDisplay] = useState(null);
  const [newReminder, setNewReminder] = useState({
    title: "",
    pet_id: "",
    date: "",
    time: "",
    description: "",
    recurring: false,
    recurringPeriod: "day",
  });
  const [userPets, setUserPets] = useState([]);

  const [chatId, setChatId] = useState(null);
  const {
    messages,
    isTyping,
    otherUserOnline,
    fetchMessages,
    sendMessage,
    sendTyping,
    markAsRead,
    setActiveChat,
  } = useChat(chatId, userid, "pp");
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
      return "Today";
    } else if (date.getTime() === yesterday.getTime()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  };

  React.useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log("✅ Socket connected, re-joining user room");
      if (userid) {
        socket.emit("joinUser", userid);
      }
    };

    socket.on("connect", handleConnect);

    // If already connected, join immediately
    if (socket.connected && userid) {
      socket.emit("joinUser", userid);
    }

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [socket, userid]);

  // Add this function in your parent component
  const handleCancelAppointment = async (apptId, cancelReason) => {
    const cancelledBy = "petParent";

    try {
      const response = await fetch(
        `http://localhost:5000/api/appointments/${apptId}/cancel`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cancelReason: cancelReason || null,
            cancelledBy: cancelledBy,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel appointment");
      }

      const data = await response.json();
      showStyledAlert("Appointment cancelled successfully");

      // Close the modal and refresh appointments
      setShowAppointmentModal(false);
      setAppointmentDetails(null);

      // Refresh appointments list

      return data;
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      throw error;
    }
  };

  const handleRescheduleRequest = (appointmentDetails) => {
    // The reason is already collected in AppointmentDetailsModal
    // Just store the appointment data and open booking modal
    setRescheduleData(appointmentDetails);
    setShowBookingModal(true);
    setShowAppointmentModal(false); // Close the appointment details modal
  };

  const handleBookingSuccess = (details) => {
    if (details.rescheduled) {
      showStyledAlert(
        `Appointment rescheduled successfully to ${details.date.toLocaleDateString()} at ${
          details.time
        }. Your appointment is now pending approval.`
      );
    } else {
      showStyledAlert(`Follow-up appointment booked for ${details.time}`);
    }

    setRescheduleData(null);
    setShowBookingModal(false);

    // Refresh appointment details if current pet is selected
    if (currentChat?.petData?.pet_id) {
      fetchAppointmentDetails(currentChat.petData.pet_id);
    }
  };

  React.useEffect(() => {
    if (socket && userid) {
      console.log("🔌 Emitting joinUser for userid:", userid);
      socket.emit("joinUser", userid);
    }
  }, [socket, userid]);

  // ✅ Add this useEffect to notify NotificationProvider we're on chat page
  React.useEffect(() => {
    console.log("🏠 Mounted on PetOwner Chat page");
    if (window.setIsOnChatPage) {
      window.setIsOnChatPage(true);
    }

    return () => {
      console.log("👋 Leaving PetOwner Chat page");
      if (window.setIsOnChatPage) {
        window.setIsOnChatPage(false);
      }
    };
  }, []);

  // Request notification permission on mount
  React.useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Mark messages as read when viewing chat or when new messages arrive
  React.useEffect(() => {
    if (chatId && selectedChat && messages.length > 0) {
      const hasUnreadMessages = messages.some(
        (msg) => msg.sender_role !== "pp" && msg.is_read === "no" // Change to 'vt' for vet-chat.jsx
      );

      if (hasUnreadMessages) {
        console.log("📖 Marking messages as read for chat:", chatId);
        markAsRead().then(() => {
          // ✅ Clear unread count locally
          setMyPets((prev) =>
            prev.map(
              (
                pet // Change to setMyPatients for vet-chat.jsx
              ) => (pet.chat_id === chatId ? { ...pet, unread_count: 0 } : pet)
            )
          );
        });
      } else {
        // ✅ Also clear if opening chat with no unread (prevents stale counts)
        setMyPets((prev) =>
          prev.map(
            (
              pet // Change to setMyPatients for vet-chat.jsx
            ) => (pet.chat_id === chatId ? { ...pet, unread_count: 0 } : pet)
          )
        );
      }
    }
  }, [chatId, selectedChat, messages, markAsRead]);

  const shouldShowDateDivider = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;

    const currentDate = new Date(currentMsg.created_at).toDateString();
    const previousDate = new Date(previousMsg.created_at).toDateString();

    return currentDate !== previousDate;
  };

  React.useEffect(() => {
    const storedName = sessionStorage.getItem("firstName");
    const storedUserId = sessionStorage.getItem("userid");

    console.log("🔑 Session data:", { storedName, storedUserId });

    if (storedName) {
      setFirstName(storedName);
    }

    if (storedUserId) {
      setUserid(storedUserId);

      // ✅ Immediately join user room when userid is set
      if (socket) {
        console.log("🔌 Joining user room immediately:", storedUserId);
        socket.emit("joinUser", storedUserId);
      }

      fetchPetParentInfo(storedUserId);
    } else {
      console.log("⚠️ No userid found in session storage");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch appointment details when selectedChat changes
  // Update the selectedChat useEffect:
  React.useEffect(() => {
    if (selectedChat && currentChat?.petData) {
      // ✅ Only fetch appointment details if there's a pet_id
      if (currentChat.petData.pet_id) {
        fetchAppointmentDetails(currentChat.petData.pet_id);
        fetchLastVisit(currentChat.petData.pet_id);
      }
  
      // ✅ Initialize chat if we have chat_id already OR need to create one
      if (ppId && currentChat.petData.pet_assignedVet) {
        // ✅ If chat_id exists (24/7 or returning to existing chat), use it directly
        if (currentChat.petData.chat_id) {
          console.log('🔄 Reusing existing chat_id:', currentChat.petData.chat_id);
          setChatId(currentChat.petData.chat_id);
        } else {
          // ✅ Otherwise, initialize/create chat
          initializeChat(ppId, currentChat.petData.pet_assignedVet);
        }
      }
    }
  }, [selectedChat, ppId]); // eslint-disable-line

  // Fetch messages when chatId changes
  React.useEffect(() => {
    if (chatId) {
      console.log("🔄 chatId changed, fetching messages for chat_id:", chatId);
      fetchMessages();
      setActiveChat?.(true); // ✅ Add this line
    }

    return () => {
      setActiveChat?.(false); // ✅ Add this line
    };
  }, [chatId, fetchMessages, setActiveChat]);

  React.useEffect(() => {
    // Only auto-scroll if user is near bottom or if it's a new message from current user
    if (shouldAutoScroll.current) {
      scrollToBottom();
    }
  }, [messages]);

  // Detect if user is scrolling up
  const handleScroll = (e) => {
    const element = e.target;
    const isNearBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight < 100;
    shouldAutoScroll.current = isNearBottom;
  };

  const scrollToBottom = () => {
    const messagesArea = document.querySelector(".messages-area");
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

  // Add this new useEffect to listen for real-time status updates
  React.useEffect(() => {
    if (!socket) return;

    const handleUserStatusChanged = ({ usr_id, is_online }) => {
      console.log("🔄 User status changed:", { usr_id, is_online });

      // Update the chat list with new online status
      setMyPets((prev) =>
        prev.map((pet) => {
          // ✅ Check against vet_usr_id
          if (pet.vet_usr_id && String(pet.vet_usr_id) === String(usr_id)) {
            return {
              ...pet,
              vet_usr_isOnline: is_online,
            };
          }
          return pet;
        })
      );
    };

    socket.on("userStatusChanged", handleUserStatusChanged);

    return () => {
      socket.off("userStatusChanged", handleUserStatusChanged);
    };
  }, [socket]);

  // Fetch registered clinic for booking
  React.useEffect(() => {
    const fetchRegisteredClinic = async () => {
      if (!userid) return;

      try {
        const res = await fetch(
          `http://localhost:5000/api/user-clinic/${userid}`
        );
        const data = await res.json();

        if (data.clinic) {
          const vetRes = await fetch(
            `http://localhost:5000/api/vet-by-name/${encodeURIComponent(
              data.clinic
            )}`
          );
          const vetData = await vetRes.json();

          if (vetRes.ok && vetData) {
            setRegisteredClinic(vetData);
          }
        }
      } catch (error) {
        console.error("❌ Error fetching registered clinic:", error);
      }
    };

    if (userid) {
      fetchRegisteredClinic();
    }
  }, [userid]);

  // In your frontend - petowner-chat.jsx
  const fetchPetParentInfo = async (userId) => {
    try {
      console.log("🔍 Fetching pet parent for userId:", userId); // ADD THIS
      const response = await fetch(
        `http://localhost:5000/api/petparent/${userId}`
      );
      const data = await response.json();

      console.log("📦 Pet parent info:", data);
      console.log("📦 pp_id received:", data.pp_id); // ADD THIS

      if (response.ok && data.pp_id) {
        setPpId(data.pp_id);
        console.log("🚀 About to fetch pets for pp_id:", data.pp_id); // ADD THIS
        fetchMyPets(data.pp_id);
      } else {
        console.log("⚠️ No pet parent found for this user");
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Error fetching pet parent info:", error);
      setLoading(false);
    }
  };

  const fetchMyPets = async (pp_id) => {
    try {
      setLoading(true);
      console.log("🔍 Fetching pets for pp_id:", pp_id);

      // ✅ Use the new endpoint
      const response = await fetch(
        `http://localhost:5000/api/pets/by-parent/${pp_id}`
      );

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📦 Received pets:", data);
      console.log("📦 First pet assignedVet:", data[0]?.pet_assignedVet);

      // For each pet, fetch vet information if assigned
      const petsWithVetInfo = await Promise.all(
        data.map(async (pet) => {
          if (pet.pet_assignedVet) {
            try {
              console.log(
                `🔍 Fetching vet info for pet "${pet.pet_name}" with vt_id: ${pet.pet_assignedVet}`
              );
              const vetResponse = await fetch(
                `http://localhost:5000/api/veterinarian/${pet.pet_assignedVet}`
              );

              console.log(
                `📡 Vet API response status for ${pet.pet_name}:`,
                vetResponse.status
              );

              if (vetResponse.ok) {
                const vetData = await vetResponse.json();
                console.log(
                  `✅ Fetched vet data for ${pet.pet_name}:`,
                  vetData
                );
                return {
                  ...pet,
                  vet_firstName: vetData.usr_firstName,
                  vet_lastName: vetData.usr_lastName,
                  vet_specialization: vetData.vt_specialization,
                  vet_clinicName: vetData.vt_clinicName,
                  vet_vetLocation: vetData.vt_vetLocation,
                };
              } else {
                console.error(
                  `❌ Failed to fetch vet for ${pet.pet_name}. Status: ${vetResponse.status}`
                );
              }
            } catch (vetError) {
              console.error(
                `⚠️ Error fetching vet info for pet ${pet.pet_name}:`,
                vetError
              );
            }
          } else {
            console.log(`⚠️ Pet "${pet.pet_name}" has no assigned vet`);
          }
          return pet;
        })
      );

      // Filter only pets that have an assigned vet AND have vet info loaded
      const petsWithVet = petsWithVetInfo.filter(
        (pet) =>
          pet.pet_assignedVet !== null && pet.vet_firstName && pet.vet_lastName
      );

      console.log("🔍 All pets:", petsWithVetInfo);
      console.log("🔍 Pets with complete vet info:", petsWithVet);
      console.log(
        "🔍 Filtered out pets:",
        petsWithVetInfo.filter((p) => !petsWithVet.includes(p))
      );

      // ✅ Don't override existing 24/7 consultations
      setMyPets(prev => {
        const existing247 = prev.filter(p => String(p.pet_id).startsWith('consultation-'));
        return [...existing247, ...petsWithVet];
      });

      console.log("📋 Pets with complete vet info:", petsWithVet);

      // Set first pet as selected by default if exists
      if (petsWithVet.length > 0) {
        setSelectedChat(`pet-${petsWithVet[0].pet_id}`);
        console.log("✅ Selected first pet:", petsWithVet[0].pet_name);
      } else {
        console.log("⚠️ No pets with assigned vets found");
      }

      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching pets:", error);
      setLoading(false);
    }
  };

  const fetch24x7OnlineVets = async () => {
    if (!userid) return;
    
    try {
      setLoading24x7(true);
      const response = await fetch(`http://localhost:5000/api/online-vets/${userid}`);
      const data = await response.json();
      
      console.log('✅ Fetched 24/7 online vets:', data);
      setOnlineVets(data);
      setLoading24x7(false);
    } catch (error) {
      console.error('❌ Error fetching 24/7 vets:', error);
      setLoading24x7(false);
    }
  };

  // ✅ Fetch existing 24/7 consultations when component mounts
  // ✅ Fetch existing 24/7 consultations when component mounts
  React.useEffect(() => {
    const fetch247Consultations = async () => {
      if (!ppId) return;
      
      try {
        const response = await fetch(`http://localhost:5000/api/petowner-24-7-chats/${ppId}`);
        const data = await response.json();
        
        console.log('✅ Fetched existing 24/7 consultations:', data);
        
        // Enhance data by fetching latest vet status and details for each chat
        const enhancedData = await Promise.all(data.map(async (consultation) => {
          let extraVetData = {};
          
          // Fetch latest availability and specialization directly from vet profile
          if (consultation.vt_id) {
            try {
              // 1. Get Availability
              const availRes = await fetch(`http://localhost:5000/api/vet/${consultation.vt_id}/247-availability`);
              if (availRes.ok) {
                const availData = await availRes.json();
                extraVetData.vet_available247 = availData.available247;
              }

              // 2. Get Profile (for Specialization)
              const profileRes = await fetch(`http://localhost:5000/api/veterinarians/${consultation.vt_id}`); 
              // Note: endpoint might vary, using the one that fetches by ID or similar
              // If that endpoint doesn't exist, we rely on what we have, but usually we try to fetch details.
              
            } catch (e) {
              console.error("Error fetching extra vet details", e);
            }
          }

          return {
            pet_id: `consultation-${consultation.chat_id}`,
            pet_name: '24/7 Consultation',
            pet_species: '',
            pet_assignedVet: consultation.vt_id,
            chat_id: consultation.chat_id,
            last_msg: consultation.last_msg || 'Start a 24/7 consultation',
            last_msg_at: consultation.last_msg_at,
            unread_count: consultation.unread_count || 0,
            vet_usr_id: consultation.vet_usr_id,
            vet_firstName: consultation.vet_firstName,
            vet_lastName: consultation.vet_lastName,
            // Prioritize the direct fetch, then the DB column, then fallback
            vet_specialization: consultation.vt_specialization || consultation.vet_specialization || "General Veterinarian", 
            vet_clinicName: consultation.vet_clinicName || consultation.vt_clinicName,
            vet_usr_isOnline: consultation.vet_usr_isOnline,
            // Use the fresh fetched availability if possible
            vet_available247: extraVetData.vet_available247 || consultation.vt_available247 || consultation.vet_available247 || 'yes'
          };
        }));
        
        setMyPets(prev => {
          const regularPets = prev.filter(p => !String(p.pet_id).startsWith('consultation-'));
          return [...enhancedData, ...regularPets];
        });
      } catch (error) {
        console.error('❌ Error fetching 24/7 consultations:', error);
      }
    };
  
    if (ppId) {
      fetch247Consultations();
    }
  }, [ppId]);

  

  // Add after fetchMyPets function:
  const initializeChat = async (pp_id, vt_id) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/chat/get-or-create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pp_id, vt_id }),
        }
      );
      const chat = await response.json();
      setChatId(chat.chat_id);

      // ✅ Mark messages as read after initializing chat
      setTimeout(() => {
        markAsRead();
      }, 500);

      return chat.chat_id;
    } catch (error) {
      console.error("Error initializing chat:", error);
    }
  };

  // ✅ Keep this one and update it to handle both refresh AND notifications
  React.useEffect(() => {
    if (!socket) return;

    const handleChatListUpdate = ({
      chat_id,
      last_msg,
      last_msg_at,
      sender_id,
    }) => {
      console.log("📋 Chat list update received for chat:", chat_id);

      // Update the local state without full refresh
      setMyPets((prev) =>
        prev.map((pet) => {
          if (pet.chat_id === chat_id) {
            // If sender is not current user, increment unread
            const shouldIncrement = String(sender_id) !== String(userid);

            return {
              ...pet,
              last_msg,
              last_msg_at,
              unread_count: shouldIncrement
                ? (pet.unread_count || 0) + 1
                : pet.unread_count,
            };
          }
          return pet;
        })
      );
    };

    socket.on("chatListUpdate", handleChatListUpdate);

    return () => {
      socket.off("chatListUpdate", handleChatListUpdate);
    };
  }, [socket, userid]);

  // In BOTH petowner-chat.jsx and vet-chat.jsx
  React.useEffect(() => {
    if (!socket) return;

    const handleMessagesRead = ({ chatId, userId: readByUserId }) => {
      console.log(
        "📖 messagesRead received for chat",
        chatId,
        "by user",
        readByUserId
      );

      // ✅ Only clear unread count if OTHER user read messages
      if (String(readByUserId) !== String(userid)) {
        setMyPets(
          (
            prev // Change to setMyPatients for vet-chat.jsx
          ) =>
            prev.map((pet) =>
              pet.chat_id === chatId ? { ...pet, unread_count: 0 } : pet
            )
        );
      }
    };

    socket.on("messagesRead", handleMessagesRead);

    return () => {
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [socket, userid]);

  const fetchAppointmentDetails = async (pet_id, showModal = false) => {
    try {
      setLoadingAppointment(true);
      const response = await fetch(
        `http://localhost:5000/api/scheduled-appointment/${pet_id}`
      );

      if (response.status === 404) {
        console.log("No scheduled appointment found for this pet");
        setAppointmentDetails(null);
        setLoadingAppointment(false);
        if (showModal) {
          showStyledAlert("No scheduled appointment found for this pet");
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
      console.error("❌ Error fetching appointment:", error);
      setAppointmentDetails(null);
      setLoadingAppointment(false);
      if (showModal) {
        showStyledAlert("Failed to fetch appointment details");
      }
    }
  };

  const fetchLastVisit = async (pet_id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/last-completed-appointment/${pet_id}`
      );

      if (response.status === 404) {
        console.log("No completed appointment found");
        setLastVisitData(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLastVisitData(data);
    } catch (error) {
      console.error("❌ Error fetching last visit:", error);
      setLastVisitData(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Transform myPets into chat format
  const chats = myPets.map((pet) => ({
    id: `pet-${pet.pet_id}`,
    name: pet.vet_firstName ? `Dr. ${pet.vet_firstName} ${pet.vet_lastName}` : "Veterinarian",
    petName: pet.pet_name,
    petType: pet.pet_species,
    specialty: pet.vet_specialization || "General Veterinarian",
    avatar: (
      <div className={`avatar-circle ${String(pet.pet_id).startsWith('consultation-') ? 'consultation-avatar' : ''}`}>
        {pet.vet_firstName ? pet.vet_firstName.charAt(0) : "V"}
      </div>
    ),
    lastMessage: pet.last_msg || "No recent messages",
    time: pet.last_msg_at
      ? new Date(pet.last_msg_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : "",
    unread: pet.unread_count || 0,
    // ✅ FIX: Hide green dot if vet is 'Offline' OR 'Unavailable' for 24/7 chats
    online: pet.vet_usr_isOnline === "yes" && 
            (!String(pet.pet_id).startsWith('consultation-') || pet.vet_available247 !== 'no'),
    petData: pet,
  }));

  const currentChat = chats.find((c) => c.id === selectedChat);

  // ✅ POLLING: Check 24/7 Availability every 5 seconds if looking at a 24/7 chat
  React.useEffect(() => {
    let intervalId;

    // Only poll if we are in a 24/7 chat and have a vet ID
    if (selectedChat && String(currentChat?.petData?.pet_id).startsWith('consultation-') && currentChat?.petData?.pet_assignedVet) {
      const vtId = currentChat.petData.pet_assignedVet;
      
      const checkAvailability = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/vet/${vtId}/247-availability`);
          if (response.ok) {
            const data = await response.json();
            
            // Update state ONLY if it changed to avoid re-renders
            setMyPets(prev => prev.map(pet => {
              if (String(pet.pet_id) === String(currentChat.petData.pet_id)) {
                if (pet.vet_available247 !== data.available247) {
                  console.log("🔄 Detected availability change:", data.available247);
                  return { ...pet, vet_available247: data.available247 };
                }
              }
              return pet;
            }));
          }
        } catch (error) {
          console.error("Error polling availability:", error);
        }
      };

      // Poll immediately and then every 5 seconds
      checkAvailability();
      intervalId = setInterval(checkAvailability, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedChat, currentChat?.petData?.pet_id, currentChat?.petData?.pet_assignedVet]);

  const activePetId = React.useMemo(() => {
    // 1. Use manual selection if exists
    if (selectedPetDisplay) return selectedPetDisplay;
    
    // 2. If Regular Chat, use chat's pet
    if (currentChat?.petData?.pet_id && !String(currentChat.petData.pet_id).startsWith('consultation-')) {
      return currentChat.petData.pet_id;
    }

    // 3. If 24/7 Chat, fallback to first real pet
    const firstRealPet = myPets.find(p => !String(p.pet_id).startsWith('consultation-'));
    return firstRealPet?.pet_id;
  }, [selectedPetDisplay, currentChat, myPets]);

  // In BOTH petowner-chat.jsx and vet-chat.jsx
  React.useEffect(() => {
    if (!socket) return;

    const handleMessageNotification = ({ senderName, message, chat_id }) => {
      console.log("📨 Message notification received:", {
        senderName,
        message,
        chat_id,
      });

      // ✅ Don't show anything if we're viewing this specific chat
      if (selectedChat && currentChat?.petData?.chat_id === chat_id) {
        console.log("⏭️ Already viewing this chat, skipping all notifications");
        return;
      }

      // ✅ Play sound for messages on chat page
      const audio = new Audio("/notification.mp3");
      audio.play().catch(() => console.log("Could not play sound"));

      // ✅ Show desktop notification only if window is not focused
      if (Notification.permission === "granted" && !document.hasFocus()) {
        new Notification(senderName, {
          body: message,
          icon: "/paw-icon.png",
          requireInteraction: false,
        });
      }
    };

    socket.on("newMessageNotification", handleMessageNotification);

    return () => {
      socket.off("newMessageNotification", handleMessageNotification);
    };
  }, [socket, selectedChat, currentChat]);

  // Add this new useEffect to listen for real-time status updates
  // Replace the existing handleUserStatusChanged function in petowner-chat.jsx:
  React.useEffect(() => {
    if (!socket) return;

    const handleUserStatusChanged = ({ usr_id, is_online }) => {
      console.log("🔄 User status changed:", { usr_id, is_online });

      // Update the chat list with new online status
      setMyPets((prev) =>
        prev.map((pet) => {
          // ✅ Check against vet_usr_id
          if (pet.vet_usr_id && String(pet.vet_usr_id) === String(usr_id)) {
            return {
              ...pet,
              vet_usr_isOnline: is_online,
            };
          }
          return pet;
        })
      );
    };

    socket.on("userStatusChanged", handleUserStatusChanged);

    return () => {
      socket.off("userStatusChanged", handleUserStatusChanged);
    };
  }, [socket]);

  const currentPet = currentChat
    ? {
        pet_id: currentChat.petData.pet_id,
        name: currentChat.petData.pet_name,
        species: currentChat.petData.pet_species,
        breed: currentChat.petData.pet_breed,
        age: `${currentChat.petData.pet_age} years`,
        gender: currentChat.petData.pet_gender === "m" ? "Male" : "Female",
        weight: `${currentChat.petData.pet_weight} kg`,
        dietType: currentChat.petData.pet_dietType || "Not specified",
        image: currentChat.petData.pet_image || null, // Changed to use pet_image
        imageEmoji: currentChat.petData.pet_species
          ?.toLowerCase()
          .includes("dog")
          ? "🐕"
          : "🐱", // Keep emoji as fallback
        veterinarian: currentChat.name,
        vetSpecialty: currentChat.specialty,
        clinic: currentChat.petData.vet_clinicName || "Clinic",
        clinicLocation:
          currentChat.petData.vet_vetLocation || "Location not specified",
        lastVisit:
          lastVisitData && lastVisitData.appt_date
            ? new Date(lastVisitData.appt_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "No previous visits",
        nextAppointment:
          appointmentDetails && appointmentDetails.appt_date
            ? new Date(appointmentDetails.appt_date).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }
              )
            : "-",
        conditions: currentChat.petData.pet_behavioralNotes
          ? [currentChat.petData.pet_behavioralNotes]
          : ["Regular Checkup"],
        behavioralNotes:
          currentChat.petData.pet_behavioralNotes ||
          "No behavioral notes recorded",
        medications:
          currentChat.petData.pet_hasMedication === "yes" &&
          currentChat.petData.pet_medicationDetails
            ? currentChat.petData.pet_medicationDetails
                .split(",")
                .map((med) => med.trim())
            : ["No active medications"],
        allergies:
          currentChat.petData.pet_hasAllergies === "yes" &&
          currentChat.petData.pet_allergyDetails
            ? currentChat.petData.pet_allergyDetails
                .split(",")
                .map((allergy) => allergy.trim())
            : ["No known allergies"],
        vaccinations:
          currentChat.petData.pet_hasVaccination === "yes"
            ? [
                `Last vaccination: ${
                  currentChat.petData.pet_vaccinationDate
                    ? new Date(
                        currentChat.petData.pet_vaccinationDate
                      ).toLocaleDateString()
                    : "N/A"
                }`,
              ]
            : ["No vaccination records"],
      }
    : null;

  // Get the pet to display (either selected manually or current chat's pet)
  // Get the pet to display (either selected manually or current chat's pet)
  const displayPet = React.useMemo(() => {
    // ✅ FIX: Logic to determine which pet to show
    let displayPetId = selectedPetDisplay;

    // If no pet is manually selected in the dropdown...
    if (!displayPetId) {
      const chatPetId = currentChat?.petData?.pet_id;

      // 1. If the current chat is a specific pet chat (not a 24/7 consultation), use that pet
      if (chatPetId && !String(chatPetId).startsWith('consultation-')) {
        displayPetId = chatPetId;
      } 
      // 2. If it IS a 24/7 consultation, default to the FIRST REAL PET in your list
      else {
        const firstRealPet = myPets.find(p => !String(p.pet_id).startsWith('consultation-'));
        if (firstRealPet) {
          displayPetId = firstRealPet.pet_id;
        }
      }
    }

    // If we still don't have an ID, return null
    if (!displayPetId) return null;
    
    const pet = myPets.find(p => String(p.pet_id) === String(displayPetId));
    if (!pet) return null;
    
    return {
      pet_id: pet.pet_id,
      name: pet.pet_name,
      species: pet.pet_species,
      breed: pet.pet_breed,
      age: `${pet.pet_age} years`,
      gender: pet.pet_gender === "m" ? "Male" : "Female",
      weight: `${pet.pet_weight} kg`,
      dietType: pet.pet_dietType || "Not specified",
      image: pet.pet_image || null,
      imageEmoji: pet.pet_species?.toLowerCase().includes("dog") ? "🐕" : "🐱",
      veterinarian: pet.vet_firstName && pet.vet_lastName
        ? `Dr. ${pet.vet_firstName} ${pet.vet_lastName}`
        : "Veterinarian",
      vetSpecialty: pet.vet_specialization || "General Veterinarian",
      clinic: pet.vet_clinicName || "Clinic",
      clinicLocation: pet.vet_vetLocation || "Location not specified",
      lastVisit: lastVisitData && lastVisitData.appt_date
        ? new Date(lastVisitData.appt_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "No previous visits",
      nextAppointment: appointmentDetails && appointmentDetails.appt_date
        ? new Date(appointmentDetails.appt_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : "-",
      conditions: pet.pet_behavioralNotes ? [pet.pet_behavioralNotes] : ["Regular Checkup"],
      behavioralNotes: pet.pet_behavioralNotes || "No behavioral notes recorded",
      medications: pet.pet_hasMedication === "yes" && pet.pet_medicationDetails
        ? pet.pet_medicationDetails.split(",").map((med) => med.trim())
        : ["No active medications"],
      allergies: pet.pet_hasAllergies === "yes" && pet.pet_allergyDetails
        ? pet.pet_allergyDetails.split(",").map((allergy) => allergy.trim())
        : ["No known allergies"],
      vaccinations: pet.pet_hasVaccination === "yes"
        ? [`Last vaccination: ${pet.pet_vaccinationDate
            ? new Date(pet.pet_vaccinationDate).toLocaleDateString()
            : "N/A"}`]
        : ["No vaccination records"],
    };
  }, [selectedPetDisplay, currentChat, myPets, lastVisitData, appointmentDetails]);
  
  // Add this search function after your other functions
  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults({ vets: [], messages: [] });
      return;
    }

    const lowerQuery = query.toLowerCase();

    // Search through vets (from chats)
    const vetResults = chats.filter(
      (chat) =>
        chat.name.toLowerCase().includes(lowerQuery) ||
        chat.petName.toLowerCase().includes(lowerQuery) ||
        chat.petType.toLowerCase().includes(lowerQuery) ||
        chat.specialty.toLowerCase().includes(lowerQuery)
    );

    // Search through actual messages in database
    try {
      const response = await fetch(
        `http://localhost:5000/api/chat/search-messages?query=${encodeURIComponent(
          query
        )}&usr_id=${userid}&role=pp`
      );
      const dbMessages = await response.json();

      // Transform database results to match chat format
      const messageResults = dbMessages
        .map((msg) => {
          const matchingChat = chats.find(
            (c) => c.petData.chat_id === msg.chat_id
          );
          return matchingChat
            ? {
                ...matchingChat,
                matchedMessage: msg.msg,
                messageDate: new Date(msg.created_at).toLocaleString(),
              }
            : null;
        })
        .filter(Boolean);

      // Remove duplicates
      const uniqueMessages = Array.from(
        new Map(messageResults.map((item) => [item.id, item])).values()
      );

      setSearchResults({ vets: vetResults, messages: uniqueMessages });
    } catch (error) {
      console.error("Error searching messages:", error);
      setSearchResults({ vets: vetResults, messages: [] });
    }
  };

  // Add after handleSearch function
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showStyledAlert("File size must be less than 10MB");
      return;
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/mov",
      "video/avi",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      showStyledAlert(
        "Invalid file type. Only images, videos, and documents are allowed."
      );
      return;
    }

    await uploadFile(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (file) => {
    if (!chatId) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("chat_id", chatId);
    formData.append("sender_id", userid);
    formData.append("sender_role", "pp"); // or 'vt' for vet-chat.jsx

    try {
      const response = await fetch(
        "http://localhost:5000/api/chat/upload-file",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const newMessage = await response.json();
      console.log("✅ File uploaded:", newMessage);

      // ✅ DON'T add to state - socket event handles it

      setShowFileMenu(false);
    } catch (error) {
      console.error("❌ Error uploading file:", error);
      showStyledAlert("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const renderMessageContent = (msg) => {
    if (msg.msg_type === "img") {
      return (
        <div className="message-image">
          <img
            src={`http://localhost:5000${msg.msg}`}
            alt="Shared image"
            style={{
              maxWidth: "300px",
              maxHeight: "400px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
            onClick={() =>
              window.open(`http://localhost:5000${msg.msg}`, "_blank")
            }
          />
        </div>
      );
    } else if (msg.msg_type === "file") {
      const fileName = msg.msg.split("/").pop();
      return (
        <div className="message-file">
          <a
            href={`http://localhost:5000${msg.msg}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "inherit",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Paperclip size={16} />
            <span>{fileName}</span>
          </a>
        </div>
      );
    } else {
      return <p>{msg.msg}</p>;
    }
  };

  // Fetch user's pets for reminder dropdown
  const fetchUserPetsForReminder = React.useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/user-pets/${userid}`
      );
      const data = await response.json();
      setUserPets(data);
    } catch (error) {
      console.error("❌ Error fetching pets:", error);
    }
  }, [userid]);

  // Handle reminder input change
  const handleReminderInputChange = (field, value) => {
    setNewReminder((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Create new reminder
  const handleCreateReminder = async () => {
    if (!newReminder.title || !newReminder.date || !newReminder.time) {
      showStyledAlert("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pp_id: ppId,
          pet_id: newReminder.pet_id || null,
          rmd_title: newReminder.title,
          rmd_desc: newReminder.description,
          rmd_date: newReminder.date,
          rmd_time: newReminder.time,
          rmd_repeat: newReminder.recurring ? "yes" : "no",
          rmd_repeat_period: newReminder.recurring
            ? newReminder.recurringPeriod
            : "",
        }),
      });

      if (response.ok) {
        showStyledAlert("Reminder created successfully!");
        setShowCreateReminderModal(false);
        setNewReminder({
          title: "",
          pet_id: "",
          date: "",
          time: "",
          description: "",
          recurring: false,
          recurringPeriod: "day",
        });
      } else {
        showStyledAlert("Failed to create reminder");
      }
    } catch (error) {
      console.error("❌ Error creating reminder:", error);
      showStyledAlert("Failed to create reminder");
    }
  };

  // Close reminder modal
  const handleCloseReminderModal = () => {
    setShowCreateReminderModal(false);
    setNewReminder({
      title: "",
      pet_id: "",
      date: "",
      time: "",
      description: "",
      recurring: false,
      recurringPeriod: "day",
    });
  };

  // Fetch pets when reminder modal opens
  React.useEffect(() => {
    if (showCreateReminderModal && userid) {
      fetchUserPetsForReminder();
    }
  }, [showCreateReminderModal, userid, fetchUserPetsForReminder]);

  // Modify existing useEffect:
  React.useEffect(() => {
    if (show24x7Vets && userid) {
      fetch24x7OnlineVets();
    }
  }, [show24x7Vets, userid]);

  // ✅ ADD: Auto-refresh when vets become available/unavailable
  React.useEffect(() => {
    if (!socket) return;

    const handleVet247AvailabilityChanged = () => {
      if (show24x7Vets && userid) {
        fetch24x7OnlineVets(); // Refresh the list
      }
    };

    socket.on('vet247AvailabilityChanged', handleVet247AvailabilityChanged);

    return () => {
      socket.off('vet247AvailabilityChanged', handleVet247AvailabilityChanged);
    };
  }, [socket, show24x7Vets, userid]);

  const start24x7Chat = async (vet) => {
    if (!ppId) {
      showStyledAlert('Please wait, loading your profile...');
      return;
    }
  
    try {
      // Create/get chat with this vet
      const response = await fetch('http://localhost:5000/api/chat/start-24-7', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pp_id: ppId, vt_id: vet.vt_id })
      });
      
      const chat = await response.json();
      
      // ✅ Create a temporary pet entry for 24/7 chat in myPets state
      const temp24x7Pet = {
        pet_id: `consultation-${chat.chat_id}`,
        pet_name: '24/7 Consultation',
        pet_species: '',
        pet_assignedVet: vet.vt_id,
        chat_id: chat.chat_id,
        last_msg: 'Start a 24/7 consultation',
        last_msg_at: new Date().toISOString(),
        unread_count: 0,
        vet_usr_id: vet.usr_id,
        vet_firstName: vet.usr_firstName,
        vet_lastName: vet.usr_lastName,
        vet_specialization: vet.vt_specialization,
        vet_clinicName: vet.vt_clinicName,
        vet_usr_isOnline: 'yes',
        vet_available247: 'yes' // ✅ ADD THIS LINE (they're starting a chat, so must be available)
      };
      
      // ✅ Add to myPets state so it appears in the chat list
      setMyPets(prev => {
        const exists = prev.some(p => p.chat_id === chat.chat_id);
        if (exists) {
          return prev;
        }
        return [temp24x7Pet, ...prev];
      });
      
      // ✅ IMPORTANT: Wait for state to update before selecting
      setTimeout(() => {
        setChatId(chat.chat_id);
        setSelectedChat(`pet-${temp24x7Pet.pet_id}`);
        setShow24x7Vets(false);
      }, 100);
      
      showStyledAlert(`Connected to Dr. ${vet.usr_firstName} ${vet.usr_lastName}`);
    } catch (error) {
      console.error('❌ Error starting 24/7 chat:', error);
      showStyledAlert('Failed to connect. Please try again.');
    }
  };

  // ✅ Listen for vet availability changes
  React.useEffect(() => {
    if (!socket) return;

    const handleAvailabilityChange = ({ vt_id, available247 }) => {
      console.log("🔔 Real-time update: Vet availability changed", vt_id, available247);
      
      setMyPets((prevPets) => 
        prevPets.map((pet) => {
          // Check if this pet/consultation is assigned to the vet who changed status
          // We check both pet_assignedVet and vet_usr_id just in case
          if (String(pet.pet_assignedVet) === String(vt_id) || String(pet.vet_usr_id) === String(vt_id)) {
            return { ...pet, vet_available247: available247 };
          }
          return pet;
        })
      );
    };

    // Note: Event name must match backend (vetAvailabilityChanged)
    socket.on("vetAvailabilityChanged", handleAvailabilityChange);

    return () => {
      socket.off("vetAvailabilityChanged", handleAvailabilityChange);
    };
  }, [socket]);

  // ✅ FIX: Auto-select the first chat when list loads (if nothing selected)
  React.useEffect(() => {
    if (!loading && myPets.length > 0 && !selectedChat) {
      const firstPet = myPets[0];
      const firstChatId = `patient-${firstPet.pet_id}`;
      console.log('🎯 Auto-selecting first chat:', firstChatId);
      setSelectedChat(firstChatId);
    }
  }, [myPets, loading, selectedChat]);

  return (
    <div className="petowner-dashboard-container">
      <PawPattern count={35} />

      <PetOwnerNavbar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div
        className={`main-content ${!sidebarOpen ? "sidebar-collapsed" : ""}`}
      >
        <div className="petowner-header">
          <ProfileNotification firstName={firstName} />
        </div>

        <div className="chat-container">
          {/* Chat List Sidebar */}
          <div
            className={`chat-list-panel ${!chatListOpen ? "collapsed" : ""}`}
          >
            <div className="chat-list-header">
              <h2>{chatListOpen ? "Messages" : ""}</h2>
              <div className="header-actions">
                {chatListOpen && (
                  <button
                    className="search-button"
                    onClick={() => setSearchOpen(!searchOpen)}
                  >
                    <Search size={20} />
                  </button>
                )}
                <button
                  className="collapse-button"
                  onClick={() => setChatListOpen(!chatListOpen)}
                >
                  {chatListOpen ? (
                    <ChevronLeft size={20} />
                  ) : (
                    <Menu size={20} />
                  )}
                </button>
              </div>
            </div>

            {searchOpen && chatListOpen && (
              <div className="search-container">
                <div className="search-input-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search veterinarians or messages..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      className="search-clear"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults({ vets: [], messages: [] });
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {searchQuery && (
                  <div className="search-results">
                    {/* Veterinarians Section */}
                    <div className="search-section">
                      <h4 className="search-section-title">
                        Veterinarians ({searchResults.vets.length})
                      </h4>
                      {searchResults.vets.length > 0 ? (
                        <div className="search-items">
                          {searchResults.vets.map((chat) => (
                            <div
                              key={chat.id}
                              className="search-result-item"
                              onClick={() => {
                                setSelectedChat(chat.id);
                                setSearchOpen(false);
                                setSearchQuery("");
                                setSearchResults({ vets: [], messages: [] });
                              }}
                            >
                              <div className="chat-avatar">{chat.avatar}</div>
                              <div className="search-result-content">
                                <div className="search-result-name">
                                  {chat.name}
                                </div>
                                <div className="search-result-detail">
                                  {chat.specialty} • {chat.petName}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="search-no-results">
                          No veterinarians found
                        </p>
                      )}
                    </div>

                    {/* Messages Section */}
                    <div className="search-section">
                      <h4 className="search-section-title">
                        Messages ({searchResults.messages.length})
                      </h4>
                      {searchResults.messages.length > 0 ? (
                        <div className="search-items">
                          {searchResults.messages.map((chat) => (
                            <div
                              key={chat.id}
                              className="search-result-item"
                              onClick={() => {
                                setSelectedChat(chat.id);
                                setSearchOpen(false);
                                setSearchQuery("");
                                setSearchResults({ vets: [], messages: [] });
                              }}
                            >
                              <div className="chat-avatar">{chat.avatar}</div>
                              <div className="search-result-content">
                                <div className="search-result-name">
                                  {chat.name}
                                </div>
                                <div className="search-result-message">
                                  {chat.matchedMessage}
                                </div>
                                <div
                                  className="search-result-detail"
                                  style={{ fontSize: "11px", color: "#888" }}
                                >
                                  {chat.messageDate}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="search-no-results">No messages found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 24/7 Online Vets Section */}
            {chatListOpen && (
              <>
                <div 
                  className="available-vets-toggle"
                  onClick={() => setShow24x7Vets(!show24x7Vets)}
                >
                  <h4>
                    <span className="toggle-icon">
                      {show24x7Vets ? '▼' : '▶'}
                    </span>
                    24/7 Online Vets
                  </h4>
                </div>

                {show24x7Vets && (
                  <div className="available-vets-list">
                    {loading24x7 ? (
                      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                        Loading...
                      </p>
                    ) : onlineVets.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                        No vets online right now
                      </p>
                    ) : (
                      onlineVets.map((vet) => (
                        <div key={vet.vt_id} className="vet-card-mini">
                          <div className="vet-avatar-mini">
                            {vet.usr_firstName.charAt(0)}{vet.usr_lastName.charAt(0)}
                          </div>
                          <div className="vet-info-mini">
                            <h5>Dr. {vet.usr_firstName} {vet.usr_lastName}</h5>
                            <p>{vet.vt_specialization || 'General Veterinarian'}</p>
                            <p style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
                              {vet.vt_clinicName}
                            </p>
                          </div>
                          <button 
                            className="start-chat-btn"
                            onClick={() => start24x7Chat(vet)}
                          >
                            Chat
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}

            {chatListOpen && (
              <>
                {/* Chat List */}
                <div className="chat-list">
                  {loading ? (
                    <div style={{ padding: "20px", textAlign: "center" }}>
                      <p>Loading your pets...</p>
                    </div>
                  ) : myPets.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center" }}>
                      <p>No pets with assigned veterinarians yet</p>
                    </div>
                  ) : (
                    chats.map((chat) => (
                      <div
                        key={chat.id}
                        className={`chat-item ${
                          selectedChat === chat.id ? "active" : ""
                        }`}
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
                              <span className="unread-badge">
                                {chat.unread}
                              </span>
                            )}
                          </div>
                          <span className="chat-specialty">
                            {chat.petName}
                            {chat.petType ? ` • ${chat.petType}` : ''}
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
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`collapsed-chat-item ${
                      selectedChat === chat.id ? "active" : ""
                    }`}
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
                  
                  {/* ✅ FIX: Only show Green Dot if Online AND Available */}
                  {(() => {
                     // 1. Check if they are technically online via socket
                     // (You already have the 'otherUserOnline' variable calculated in your component)
                     const isOnline = otherUserOnline; 

                     // 2. Check if this is a 24/7 chat
                     const is247 = String(currentChat?.petData?.pet_id || '').startsWith('consultation-');
                     
                     // 3. Check specific availability toggle
                     const availability = currentChat?.petData?.vet_available247 || 
                                          currentChat?.petData?.vt_available247 || 
                                          'yes';

                     // 4. Determine if they are "Unavailable"
                     const isUnavailable = is247 && availability === 'no';
                     
                     // 5. Render: Show dot ONLY if Online AND NOT Unavailable
                     if (isOnline && !isUnavailable) {
                       return <div className="online-indicator" />;
                     }
                     return null;
                  })()}
                </div>
                <div>
                  <h3>{currentChat?.name}</h3>
                  <p className="chat-header-status">
                  {(() => {
                    const is247 = String(currentChat?.petData?.pet_id || '').startsWith('consultation-');
                    
                    // 1. Determine Status
                    let statusText = otherUserOnline ? "Online" : "Offline";
                    
                    // ✅ CHECK: If 24/7 chat and vet toggled to 'no', force Unavailable
                    // We check multiple property names to be safe
                    const availability = currentChat?.petData?.vet_available247 || 
                                         currentChat?.petData?.vt_available247 || 
                                         'yes';
                                         
                    if (is247 && availability === 'no') {
                      statusText = "Unavailable";
                    }

                    // 2. Get Specialization
                    const specialization = currentChat?.petData?.vet_specialization || 
                                           currentChat?.petData?.vt_specialization || 
                                           currentChat?.specialty ||
                                           "General Veterinarian";

                    // 3. Get Pet Name
                    const treating = currentChat?.petName || (is247 ? "24/7 Consultation" : "Unknown");

                    return `${statusText} • ${specialization} • Treating ${treating}`;
                  })()}
                </p>
                </div>
              </div>
              <div className="chat-header-actions">
                <button
                  className="chat-action-btn video-call"
                  title="Video Call"
                  onClick={() => setShowVideoCall(true)}
                >
                  <Video size={18} />
                </button>
                <button
                  className="chat-action-btn"
                  title={showPetInfo ? "Hide Pet Info" : "Show Pet Info"}
                  onClick={() => setShowPetInfo(!showPetInfo)}
                >
                  <FileText size={18} />
                </button>
              </div>
            </div>

            {/* Quick Actions Banner */}
            <div className="quick-actions-banner">
              {/* 1. View Appointment Details - Regular Only (Hide if 24/7) */}
              {currentChat?.petData?.pet_id && !String(currentChat.petData.pet_id).startsWith('consultation-') && (
                <button
                  className="quick-action-chip"
                  onClick={() => {
                    fetchAppointmentDetails(currentChat.petData.pet_id, true);
                  }}
                  disabled={loadingAppointment}
                >
                  <Calendar size={14} />
                  {loadingAppointment ? "Loading..." : "View Appointment Details"}
                </button>
              )}

              {/* 2. View Medical Records - Available for BOTH */}
              <button
                className="quick-action-chip"
                onClick={() => setShowHealthModal(true)}
              >
                <FileText size={14} />
                View Medical Records
              </button>

              {/* 3. Schedule Follow-Up - Regular Only (Hide if 24/7) */}
              {currentChat?.petData?.pet_id && !String(currentChat.petData.pet_id).startsWith('consultation-') && (
                <button
                  className="quick-action-chip"
                  onClick={() => setShowBookingModal(true)}
                  disabled={!registeredClinic}
                >
                  <Calendar size={14} />
                  Schedule Follow-Up
                </button>
              )}
              
              {/* 4. Set Reminder - Available for BOTH */}
              <button
                className="quick-action-chip"
                onClick={() => setShowCreateReminderModal(true)}
              >
                <Clock size={14} />
                Set Reminder
              </button>
            </div>

            {/* Messages Area */}
            <div className="messages-area" onScroll={handleScroll}>
              {messages.length === 0 ? (
                <div className="empty-messages-state">
                  <MessageCircle
                    size={64}
                    className="empty-message-icon"
                    strokeWidth={1.5}
                  />
                  <p className="empty-message-text">No messages yet</p>
                  {appointmentDetails && appointmentDetails.appt_date ? (
                    <p className="next-consultation">
                      Next consultation:{" "}
                      {formatDate(appointmentDetails.appt_date)}
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
                        className={`message message-${
                          msg.sender_role === "pp" ? "sent" : "received"
                        }`}
                      >
                        <div className="message-content">
                          <div className="message-bubble">
                            {renderMessageContent(msg)}
                          </div>
                          <span className="message-time">
                            {new Date(msg.created_at).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )}
                            {msg.sender_role === "pp" && (
                              <span style={{ marginLeft: "4px" }}>
                                {msg.is_read === "yes" ? "✓✓" : "✓"}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                  {isTyping && (
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="message-input-container">
              <div style={{ position: "relative" }}>
                <button
                  className="attach-button"
                  title="Attach File"
                  onClick={() => setShowFileMenu(!showFileMenu)}
                  disabled={uploading}
                >
                  <Paperclip size={18} />
                </button>

                {showFileMenu && (
                  <div className="file-menu">
                    <button
                      className="file-menu-item"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowFileMenu(false);
                      }}
                    >
                      <Camera size={16} />
                      <span>Photo/Video</span>
                    </button>
                    <button
                      className="file-menu-item"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowFileMenu(false);
                      }}
                    >
                      <Paperclip size={16} />
                      <span>Document</span>
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                />
              </div>

              {uploading && (
                <span
                  style={{ fontSize: "12px", color: "#666", marginLeft: "8px" }}
                >
                  Uploading...
                </span>
              )}
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
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (message.trim()) {
                      shouldAutoScroll.current = true; // Force scroll when sending
                      sendMessage(message);
                      setMessage("");
                      sendTyping(false);
                    }
                  }
                }}
              />
              <button
                className="send-button"
                onClick={async () => {
                  if (message.trim()) {
                    shouldAutoScroll.current = true; // Force scroll when sending
                    await sendMessage(message);
                    setMessage("");
                    sendTyping(false);
                  }
                }}
              >
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

            {/* Pet Selector */}
            <div className="pet-selector" style={{ padding: '16px', borderBottom: '1px solid #e8f0f7' }}>
              <label style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                marginBottom: '8px', 
                display: 'block',
                color: '#334155'
              }}>
                Choose pet to display:
              </label>
              <select
                className="pet-select-dropdown"
                value={activePetId || ''} // ✅ FIX: Use activePetId here
                onChange={(e) => setSelectedPetDisplay(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '2px solid #e8f0f7',
                  background: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
              >
                {/* Option to clear selection */}
                <option value="">Choose a pet...</option>

                {/* Filter out '24/7 Consultation' entries so they don't appear in the list */}
                {myPets
                  .filter(pet => !String(pet.pet_id).startsWith('consultation-'))
                  .map((pet) => (
                    <option key={pet.pet_id} value={pet.pet_id}>
                      {pet.pet_name} ({pet.pet_species})
                    </option>
                ))}
              </select>
            </div>

            {/* Display selected pet info */}
            {displayPet ? (
              <>
                <div className="pet-profile-card">
                  <div className="pet-image-large">
                    {displayPet.image ? (
                      <img
                        src={`http://localhost:5000${displayPet.image}`}
                        alt={displayPet.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "12px",
                        }}
                      />
                    ) : (
                      <span>{displayPet.imageEmoji}</span>
                    )}
                  </div>
                  <h2>{displayPet.name}</h2>
                  <p className="pet-species">{displayPet.species}</p>

                  <div className="pet-quick-stats">
                    <div className="pet-stat">
                      <span className="stat-label">Age</span>
                      <span className="stat-value">{displayPet.age}</span>
                    </div>
                    <div className="pet-stat">
                      <span className="stat-label">Gender</span>
                      <span className="stat-value">{displayPet.gender}</span>
                    </div>
                  </div>
                </div>

                <div className="pet-info-section">
                  <h4>Assigned Veterinarian</h4>
                  <p className="info-text">{displayPet.veterinarian}</p>
                  <p className="info-text small">{displayPet.vetSpecialty}</p>
                </div>

                <div className="pet-info-section">
                  <h4>Clinic</h4>
                  <p className="info-text">{displayPet.clinic}</p>
                  <p className="info-text small">{displayPet.clinicLocation}</p>
                </div>

                <div className="pet-info-section">
                  <h4>Breed</h4>
                  <p className="info-text">{displayPet.breed}</p>
                </div>

                <div className="pet-info-section">
                  <h4>Weight</h4>
                  <p className="info-text">{displayPet.weight}</p>
                </div>

                <div className="pet-info-section">
                  <h4>Diet Type</h4>
                  <p className="info-text">{displayPet.dietType}</p>
                </div>

                <div className="pet-info-section">
                  <h4>Last Visit</h4>
                  <p className="info-text">{displayPet.lastVisit}</p>
                </div>

                <div className="pet-info-section">
                  <h4>Next Appointment</h4>
                  <p className="info-text highlight">
                    {displayPet.nextAppointment}
                  </p>
                </div>

                <div className="pet-info-section">
                  <h4>Behavioral Notes</h4>
                  <p className="info-text">{displayPet.behavioralNotes}</p>
                </div>

                <div className="pet-info-section">
                  <h4>Active Medications</h4>
                  {displayPet.medications.map((med, idx) => (
                    <div key={idx} className="medication-item">
                      <span className="medication-dot">💊</span>
                      <p>{med}</p>
                    </div>
                  ))}
                </div>

                <div className="pet-info-section">
                  <h4>Known Allergies</h4>
                  <div className="tags-container">
                    {displayPet.allergies.map((allergy, idx) => (
                      <span key={idx} className="condition-tag alert">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pet-info-section">
                  <h4>Vaccinations</h4>
                  {displayPet.vaccinations.map((vac, idx) => (
                    <div key={idx} className="medication-item">
                      <span className="medication-dot">💉</span>
                      <p>{vac}</p>
                    </div>
                  ))}
                </div>

                <button
                  className="view-records-btn"
                  onClick={() => setShowHealthModal(true)}
                >
                  <FileText size={16} />
                  View Full Medical Records
                </button>
              </>
            ) : (
              <div style={{ 
                padding: '40px 16px', 
                textAlign: 'center', 
                color: '#94a3b8' 
              }}>
                <p>Select a pet to view information</p>
              </div>
            )}
          </div>
        )}

          <AppointmentDetailsModal
            showModal={showAppointmentModal}
            appointmentDetails={appointmentDetails}
            onClose={() => setShowAppointmentModal(false)}
            formatDate={formatDate}
            userRole="pp"
            onContactVet={() => {
              // Already on chat page, just close modal
              setShowAppointmentModal(false);
            }}
            onCancelAppointment={handleCancelAppointment}
            onRescheduleRequest={handleRescheduleRequest}
          />
        </div>
      </div>

      {showVideoCall && (
        <VideoCall
          socket={socket}
          chatId={chatId}
          currentUserId={String(userid)}
          currentUserName={`${firstName} ${
            sessionStorage.getItem("lastName") || ""
          }`}
          otherUserId={String(currentChat?.petData?.vet_usr_id)} // or vet_usr_id for petowner
          otherUserName={currentChat?.name}
          otherUserOnline={otherUserOnline}
          userRole="pp" // or "pp"
          petInfo={currentPet}
          petId={currentChat?.petData?.pet_id}
          onClose={() => {
            setShowVideoCall(false);
          }}
        />
      )}

      {/* Health Records Modal */}
      {showHealthModal && activePetId && (
        <PatientProfileModal
          petId={activePetId} // ✅ FIX: Pass activePetId here
          vtId={null}
          onClose={() => setShowHealthModal(false)}
          viewMode="petowner"
        />
      )}

      {/* Create Reminder Modal */}
      {showCreateReminderModal && (
        <div className="modal-overlay" onClick={handleCloseReminderModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Reminder</h2>
              <button
                className="modal-close"
                onClick={handleCloseReminderModal}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Reminder Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter reminder title"
                  value={newReminder.title}
                  onChange={(e) =>
                    handleReminderInputChange("title", e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assign to Pet</label>
                <select
                  className="form-select"
                  value={newReminder.pet_id}
                  onChange={(e) =>
                    handleReminderInputChange("pet_id", e.target.value)
                  }
                >
                  <option value="">None</option>
                  {userPets.map((pet) => (
                    <option key={pet.pet_id} value={pet.pet_id}>
                      {pet.pet_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Remind me on... *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newReminder.date}
                    onChange={(e) =>
                      handleReminderInputChange("date", e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Select Time *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={newReminder.time}
                    onChange={(e) =>
                      handleReminderInputChange("time", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Add a Description (Optional)
                </label>
                <textarea
                  className="form-textarea"
                  placeholder="Enter description"
                  rows="3"
                  value={newReminder.description}
                  onChange={(e) =>
                    handleReminderInputChange("description", e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-checkbox-label">
                  <input
                    type="checkbox"
                    className="form-checkbox-input"
                    checked={newReminder.recurring}
                    onChange={(e) =>
                      handleReminderInputChange("recurring", e.target.checked)
                    }
                  />
                  <span className="form-checkbox-text">Recurring</span>
                </label>
              </div>

              {newReminder.recurring && (
                <div className="form-group">
                  <label className="form-label">Remind every...</label>
                  <select
                    className="form-select"
                    value={newReminder.recurringPeriod}
                    onChange={(e) =>
                      handleReminderInputChange(
                        "recurringPeriod",
                        e.target.value
                      )
                    }
                  >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                  </select>
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="modal-button-cancel"
                  onClick={handleCloseReminderModal}
                >
                  Cancel
                </button>
                <button
                  className="modal-button-save"
                  onClick={handleCreateReminder}
                >
                  Create Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Follow-Up Appointment Modal */}
      {showBookingModal && registeredClinic && (
        <div
          className="myvet-modal-overlay"
          onClick={() => {
            setShowBookingModal(false);
            setRescheduleData(null);
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <BookAppointment
              clinicId={rescheduleData?.clinic_id || registeredClinic.clinic_id}
              onClose={() => {
                setShowBookingModal(false);
                setRescheduleData(null);
              }}
              onBookingSuccess={handleBookingSuccess}
              rescheduleMode={!!rescheduleData}
              oldAppointmentId={rescheduleData?.appt_id}
              rescheduleData={rescheduleData}
              initialDescription={
                rescheduleData?.appt_description ||
                `Follow-up with ${currentChat?.name || "veterinarian"}`
              }
              autoFillDescription={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PetOwnerChat;
