//vet-chat.jsx
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
  Settings,
  Save,
  Sparkles,
} from "lucide-react";
import PawPattern from "./components/PawPattern";
import VetNavbar from "./components/vet-navbar";
import ProfileNotification from "./components/ProfileNotification";
import AppointmentDetailsModal from "./components/AppointmentDetailsModal";
import "./styles/vet-chat.css";
import { useChat } from "./hooks/useChat";
import { useNotification } from "./components/NotificationProvider";
import VideoCall from "./components/VideoCall";
import IncomingCallNotification from "./components/IncomingCallNotification";
import PatientProfileModal from "./components/PatientProfileModal";
import SuggestedReplies from "./components/SuggestedReplies";
import TemplateManager from "./components/TemplateManager";
import TemplateSearchModal from "./components/TemplateSearchModal";
import showStyledAlert from "./utils/styledAlert";

const VetChat = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [showPetInfo, setShowPetInfo] = useState(true);
  const [chatListOpen, setChatListOpen] = useState(true);
  const [firstName, setFirstName] = useState("");
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [show24x7Patients, setShow24x7Patients] = useState(false);
  const [consultation24x7Chats, setConsultation24x7Chats] = useState([]);
  const [loading24x7, setLoading24x7] = useState(false);
  const [selectedPetDisplay, setSelectedPetDisplay] = useState(null);
  const [ownerPets, setOwnerPets] = useState([]);
  const [available247, setAvailable247] = useState('yes');
  const [messagesWithSuggestions, setMessagesWithSuggestions] = useState(
    new Set()
  );
  const [searchResults, setSearchResults] = useState({
    patients: [],
    messages: [],
  });
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);
  const shouldAutoScroll = React.useRef(true);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [lastReceivedMessage, setLastReceivedMessage] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [suggestionsClosedForMessage, setSuggestionsClosedForMessage] =
    useState(null);
  const [messageToSave, setMessageToSave] = useState(null);
  const [showTemplateSearch, setShowTemplateSearch] = useState(false);
  const [hoveredPetMessage, setHoveredPetMessage] = useState(null);
  const [showSuggestionsFor, setShowSuggestionsFor] = useState(null);
  const [newTemplateData, setNewTemplateData] = useState({
    category: "",
    keywords: "",
  });

  const [chatId, setChatId] = useState(null);
  const {
    messages,
    isTyping,
    otherUserOnline,
    fetchMessages,
    sendMessage,
    sendTyping,
    markAsRead,
  } = useChat(
    chatId,
    userid,
    "vt" // or 'vt' for vet
  );

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

  React.useEffect(() => {
    if (socket && userid) {
      console.log("🔌 Emitting joinUser for userid:", userid);
      socket.emit("joinUser", userid);
    }
  }, [socket, userid]);

  // ✅ Add this useEffect to notify NotificationProvider we're on chat page
  React.useEffect(() => {
    console.log("🏠 Mounted on Vet Chat page");
    if (window.setIsOnChatPage) {
      window.setIsOnChatPage(true);
    }

    return () => {
      console.log("👋 Leaving Vet Chat page");
      if (window.setIsOnChatPage) {
        window.setIsOnChatPage(false);
      }
    };
  }, []);

  // Update the useEffect that receives messages to track last received message
  React.useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (
        lastMsg.sender_role !== "vt" &&
        lastMsg.msg_id !== suggestionsClosedForMessage
      ) {
        setLastReceivedMessage(lastMsg);
      }
    }
  }, [messages, suggestionsClosedForMessage]);

  // Request notification permission on mount
  React.useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Load userid from sessionStorage
  React.useEffect(() => {
    const storedUserId = sessionStorage.getItem("userid");
    console.log("🔑 Loading userid from session:", storedUserId);
    if (storedUserId) {
      setUserid(storedUserId);

      // ✅ Immediately join user room when userid is set
      if (socket) {
        console.log("🔌 Joining user room immediately:", storedUserId);
        socket.emit("joinUser", storedUserId);
      }
    }
  }, [socket]); // ✅ CHANGE: Add socket as dependency so it runs when socket is ready

  // Mark messages as read when viewing chat or when new messages arrive
  React.useEffect(() => {
    if (chatId && selectedChat && messages.length > 0) {
      const hasUnreadMessages = messages.some(
        (msg) => msg.sender_role !== "vt" && msg.is_read === "no" // Change to 'vt' for vet-chat.jsx
      );

      if (hasUnreadMessages) {
        console.log("📖 Marking messages as read for chat:", chatId);
        markAsRead().then(() => {
          // ✅ Clear unread count locally
          setMyPatients((prev) =>
            prev.map(
              (
                pet // Change to setMyPatients for vet-chat.jsx
              ) => (pet.chat_id === chatId ? { ...pet, unread_count: 0 } : pet)
            )
          );
        });
      } else {
        // ✅ Also clear if opening chat with no unread (prevents stale counts)
        setMyPatients((prev) =>
          prev.map(
            (
              pet // Change to setMyPatients for vet-chat.jsx
            ) => (pet.chat_id === chatId ? { ...pet, unread_count: 0 } : pet)
          )
        );
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

  const shouldShowDateDivider = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;

    const currentDate = new Date(currentMsg.created_at).toDateString();
    const previousDate = new Date(previousMsg.created_at).toDateString();

    return currentDate !== previousDate;
  };

  React.useEffect(() => {
    const storedName = sessionStorage.getItem("firstName");
    const storedVetId = sessionStorage.getItem("vt_id");

    console.log("🔑 Session data:", { storedName, storedVetId });

    if (storedName) {
      setFirstName(storedName);
    }

    if (storedVetId) {
      console.log("📞 Setting vt_id:", storedVetId);
      setVtId(storedVetId);
      fetchMyPatients(storedVetId); // ✅ ADD THIS BACK!
    } else {
      console.log("⚠️ No vt_id found in session storage");
      setLoading(false);
    }
  }, []);

  // Fetch appointment details when selectedChat changes
  React.useEffect(() => {
    if (selectedChat && currentChat?.petData?.pet_id) {
      fetchAppointmentDetails(currentChat.petData.pet_id);
      fetchLastVisit(currentChat.petData.pet_id);
    }
  }, [selectedChat]); // eslint-disable-line

  // ✅ Resolve the matching patient/24-7 chat OUTSIDE the effect, so we can
  // depend on stable primitive values instead of the whole arrays
  const selectedPatientForInit = myPatients.find(
    (p) => `patient-${p.pet_id}` === selectedChat
  );
  const selected247ChatForInit = consultation24x7Chats.find(
    (c) => c.id === selectedChat
  );

  // Combined effect to initialize chat when BOTH selectedChat and vtId are ready
  React.useEffect(() => {
    if (selectedChat && selectedPatientForInit?.pp_id && vtId) {
      console.log("🔄 Initializing regular patient chat for:", {
        selectedChat,
        pet_id: selectedPatientForInit.pet_id,
        pet_name: selectedPatientForInit.pet_name,
        pp_id: selectedPatientForInit.pp_id,
        vt_id: vtId,
      });
      initializeChat(selectedPatientForInit.pp_id, vtId);
    } else if (selectedChat && selected247ChatForInit?.petData?.pp_id && vtId) {
      console.log("🔄 Initializing 24/7 consultation chat for:", {
        selectedChat,
        chat_id: selected247ChatForInit.petData.chat_id,
        pp_id: selected247ChatForInit.petData.pp_id,
        vt_id: vtId,
      });

      // For 24/7 chats, we already have chat_id, so set it directly
      setChatId(selected247ChatForInit.petData.chat_id);

      // Mark messages as read after setting chat
      setTimeout(() => {
        markAsRead();
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedChat,
    vtId,
    selectedPatientForInit?.pp_id,
    selected247ChatForInit?.petData?.chat_id,
  ]);
  
  // Fetch vet info
  React.useEffect(() => {
    const fetchVetInfo = async () => {
      if (!userid) return;

      try {
        const response = await fetch(
          `https://fyp-pet-telehealth-system.onrender.com/api/profile/${userid}`
        );
        const data = await response.json();

        if (response.ok) {
          setVtId(data.vt_id);
          setClinicInfo({
            vetLocation: data.vt_vetLocation,
            clinicName: data.vt_clinicName,
            clinicPhone: data.vt_clinicPhone,
            clinicEmail: data.vt_clinicEmail,
          });
        }
      } catch (error) {
        console.error("Error fetching vet info:", error);
      }
    };

    fetchVetInfo();
  }, [userid]);

  // Fetch messages when chatId changes
  React.useEffect(() => {
    if (chatId) {
      console.log("🔄 chatId changed, fetching messages for chat_id:", chatId);
      fetchMessages();
    }
  }, [chatId, fetchMessages]);

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

  // Fetch patients assigned to this vet
  const fetchMyPatients = async (vt_id) => {
    try {
      setLoading(true);
      console.log("🔍 Fetching patients for vt_id:", vt_id);

      const response = await fetch(
        `https://fyp-pet-telehealth-system.onrender.com/api/vet-patients/${vt_id}`
      );

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📦 Received data:", data);

      setMyPatients(data);

      // Set first patient as selected by default if exists
      // Check if there's a pet_id in URL first
      const urlParams = new URLSearchParams(window.location.search);
      const petIdFromUrl = urlParams.get("pet_id");

      if (petIdFromUrl) {
        // URL parameter will be handled by separate useEffect
        console.log(
          "🔗 URL has pet_id parameter, waiting to select:",
          petIdFromUrl
        );
      } else if (data.length > 0) {
        // Only auto-select first patient if no URL parameter
        setSelectedChat(`patient-${data[0].pet_id}`);
        console.log("✅ Selected first patient:", data[0].pet_name);
      } else {
        console.log("⚠️ No patients found for this vet");
      }

      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching patients:", error);
      setLoading(false);
    }
  };

  const fetch24x7Consultations = React.useCallback(async () => {
    if (!vtId) return;
    
    try {
      setLoading24x7(true);
      const response = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/vet-24-7-chats/${vtId}`);
      const data = await response.json();
      
      console.log('✅ Fetched 24/7 consultations:', data);
      
      // Transform into chat format
      const formattedChats = data.map(consultation => ({
        id: `consultation-${consultation.chat_id}`,
        name: `${consultation.owner_firstName} ${consultation.owner_lastName}`,
        petName: '24/7 Consultation',
        petType: '',
        avatar: `${consultation.owner_firstName.charAt(0)}${consultation.owner_lastName.charAt(0)}`,
        lastMessage: consultation.last_msg || 'Start consultation',
        time: consultation.last_msg_at
          ? new Date(consultation.last_msg_at).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })
          : '',
        unread: consultation.unread_count || 0,
        online: consultation.owner_usr_isOnline === 'yes',
        petData: {
          ...consultation,
          pet_id: null,
          pet_name: '24/7 Consultation',
          pet_species: '',
        },
      }));
      
      setConsultation24x7Chats(formattedChats);
      setLoading24x7(false);
    } catch (error) {
      console.error('❌ Error fetching 24/7 consultations:', error);
      setLoading24x7(false);
    }
  }, [vtId]);

  // Initialize chat between vet and pet parent
  const lastInitializedPair = React.useRef(null);

// Initialize chat between vet and pet parent
const initializeChat = React.useCallback(
  async (pp_id, vt_id) => {
    // Skip if we already initialized this exact pp_id/vt_id pair
    if (
      chatId &&
      lastInitializedPair.current?.pp_id === pp_id &&
      lastInitializedPair.current?.vt_id === vt_id
    ) {
      return chatId;
    }

    try {
      console.log("📞 Initializing chat with pp_id:", pp_id, "vt_id:", vt_id);

      const response = await fetch(
        "https://fyp-pet-telehealth-system.onrender.com/api/chat/get-or-create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pp_id, vt_id }),
        }
      );
      const chat = await response.json();

      console.log(
        "✅ Chat initialized with chat_id:",
        chat.chat_id,
        "for pp_id:",
        pp_id
      );

      // Remember this pair so repeat calls are skipped
      lastInitializedPair.current = { pp_id, vt_id };

      setChatId((prevChatId) => {
        if (prevChatId !== chat.chat_id) {
          console.log(
            "🔄 Switching from chat_id",
            prevChatId,
            "to",
            chat.chat_id
          );
        }
        return chat.chat_id;
      });

      // Mark messages as read after initializing chat
      setTimeout(() => {
        markAsRead();
      }, 500);

      return chat.chat_id;
    } catch (error) {
      console.error("Error initializing chat:", error);
    }
  },
  [chatId, markAsRead]
);

  const fetchAppointmentDetails = async (pet_id, showModal = false) => {
    try {
      setLoadingAppointment(true);
      const response = await fetch(
        `https://fyp-pet-telehealth-system.onrender.com/api/scheduled-appointment/${pet_id}`
      );

      if (response.status === 404) {
        console.log("No scheduled appointment found for this patient");
        setAppointmentDetails(null);
        setLoadingAppointment(false);
        if (showModal) {
          showStyledAlert("No scheduled appointment found for this patient");
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
        `https://fyp-pet-telehealth-system.onrender.com/api/last-completed-appointment/${pet_id}`
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

  // Transform myPatients into chat format
  const chats = [
    ...myPatients.map((patient) => ({
      id: `patient-${patient.pet_id}`,
      name: `${patient.owner_firstName} ${patient.owner_lastName}`,
      petName: patient.pet_name,
      petType: patient.pet_species,
      avatar: `${patient.owner_firstName?.charAt(0) || ""}${
        patient.owner_lastName?.charAt(0) || ""
      }`,
      lastMessage: patient.last_msg || "No recent messages",
      time: patient.last_msg_at
        ? new Date(patient.last_msg_at).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : new Date(
            patient.pet_lastUpdated || patient.pp_createdAt
          ).toLocaleDateString(),
      unread: patient.unread_count || 0,
      online: patient.owner_usr_isOnline === "yes",
      petData: patient,
    })),
    ...consultation24x7Chats
  ];

  const currentChat = chats.find((c) => c.id === selectedChat);

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

  // Add this after your existing useEffect with socket listeners
  React.useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      console.log("📨 New message received:", message);

      // Always refresh the list to update unread counts
      if (userid && vtId) {
        fetchMyPatients(vtId);
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, userid, vtId]); // Remove chatId from dependencies

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
        setMyPatients(
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

  // ADD this new useEffect after your existing socket listeners (around line 320):
  React.useEffect(() => {
    if (!socket) return;
  
    const handleChatListUpdate = ({
      chat_id,
      last_msg,
      last_msg_at,
      sender_id,
    }) => {
      console.log("📋 Chat list update received for chat:", chat_id);
  
      // Update regular patients
      setMyPatients((prev) =>
        prev.map((patient) => {
          if (patient.chat_id === chat_id) {
            const shouldIncrement = String(sender_id) !== String(userid);
            return {
              ...patient,
              last_msg,
              last_msg_at,
              unread_count: shouldIncrement
                ? (patient.unread_count || 0) + 1
                : patient.unread_count,
            };
          }
          return patient;
        })
      );
  
      // ✅ Also update 24/7 consultation chats
      setConsultation24x7Chats((prev) =>
        prev.map((chat) => {
          if (chat.petData.chat_id === chat_id) {
            const shouldIncrement = String(sender_id) !== String(userid);
            return {
              ...chat,
              lastMessage: last_msg,
              time: new Date(last_msg_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              }),
              unread: shouldIncrement ? (chat.unread || 0) + 1 : chat.unread,
              petData: {
                ...chat.petData,
                last_msg,
                last_msg_at,
              }
            };
          }
          return chat;
        })
      );
    };
  
    socket.on("chatListUpdate", handleChatListUpdate);
  
    return () => {
      socket.off("chatListUpdate", handleChatListUpdate);
    };
  }, [socket, userid]);

  // ✅ Refresh 24/7 consultations when receiving new messages from outside clinic
  React.useEffect(() => {
    if (!socket || !vtId) return;

    const handle247NewMessage = ({ chat_id, sender_role }) => {
      console.log("📨 New message in 24/7 chat:", chat_id);
      
      // If it's from a pet owner (pp) and we're showing 24/7 section, refresh
      if (sender_role === 'pp' && show24x7Patients) {
        fetch24x7Consultations();
      }
    };

    socket.on("newMessage", handle247NewMessage);

    return () => {
      socket.off("newMessage", handle247NewMessage);
    };
  }, [socket, vtId, show24x7Patients, fetch24x7Consultations]);

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
        owner: `${currentChat.petData.owner_firstName} ${currentChat.petData.owner_lastName}`,
        ownerEmail: currentChat.petData.owner_email,
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

  // Add this search function
  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults({ patients: [], messages: [] });
      return;
    }

    const lowerQuery = query.toLowerCase();

    // Search through patients (from chats)
    const patientResults = chats.filter(
      (chat) =>
        chat.name.toLowerCase().includes(lowerQuery) ||
        chat.petName.toLowerCase().includes(lowerQuery) ||
        chat.petType.toLowerCase().includes(lowerQuery)
    );

    // Search through actual messages in database
    try {
      const response = await fetch(
        `https://fyp-pet-telehealth-system.onrender.com/api/chat/search-messages?query=${encodeURIComponent(
          query
        )}&usr_id=${userid}&role=vt`
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

      setSearchResults({ patients: patientResults, messages: uniqueMessages });
    } catch (error) {
      console.error("Error searching messages:", error);
      setSearchResults({ patients: patientResults, messages: [] });
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
    formData.append("sender_role", "vt"); // or 'vt' for vet-chat.jsx

    try {
      const response = await fetch(
        "https://fyp-pet-telehealth-system.onrender.com/api/chat/upload-file",
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

  // Add this new useEffect to listen for real-time status updates
  // Replace the existing handleUserStatusChanged function in vet-chat.jsx:
  React.useEffect(() => {
    if (!socket) return;

    const handleUserStatusChanged = ({ usr_id, is_online }) => {
      console.log("🔄 User status changed:", { usr_id, is_online });

      // Update the chat list with new online status
      setMyPatients((prev) =>
        prev.map((pet) => {
          // ✅ Check against owner_usr_id
          if (pet.owner_usr_id && String(pet.owner_usr_id) === String(usr_id)) {
            return {
              ...pet,
              owner_usr_isOnline: is_online,
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

  // Handle pet_id from URL parameter
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const petIdFromUrl = urlParams.get("pet_id");

    if (petIdFromUrl && myPatients.length > 0) {
      const targetPatient = myPatients.find(
        (p) => String(p.pet_id) === String(petIdFromUrl)
      );

      if (targetPatient) {
        const chatId = `patient-${targetPatient.pet_id}`;
        console.log(
          "🎯 Setting chat from URL pet_id:",
          petIdFromUrl,
          "→",
          chatId
        );
        setSelectedChat(chatId);

        // Clear the URL parameter after selecting
        window.history.replaceState({}, "", "/vet-chat");
      }
    }
  }, [myPatients]); // Run when myPatients is loaded

  React.useEffect(() => {
    if (!vtId || messages.length === 0) return;

    // Check all pet owner messages for suggestions
    messages.forEach((msg) => {
      if (
        msg.sender_role !== "vt" &&
        msg.msg_type === "text" &&
        !messagesWithSuggestions.has(msg.msg_id)
      ) {
        checkMessageForSuggestions(msg);
      }
    });
  }, [messages, vtId]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (show24x7Patients && vtId) {
      fetch24x7Consultations();
    }
  }, [show24x7Patients, vtId, fetch24x7Consultations]);

  const fetchPetsByOwner = React.useCallback(async (pp_id) => {
    try {
      const response = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/pets/by-parent/${pp_id}`);
      const data = await response.json();
      console.log(`✅ Fetched ${data.length} pets for pet owner pp_id: ${pp_id}`, data);
      setOwnerPets(data);
    } catch (error) {
      console.error('❌ Error fetching owner pets:', error);
      setOwnerPets([]);
    }
  }, []);

  React.useEffect(() => {
    if (currentChat?.petData?.pp_id && !currentChat?.petData?.pet_id) {
      // This is a 24/7 consultation, fetch the owner's pets
      console.log('🔍 Fetching pets for 24/7 consultation, pp_id:', currentChat.petData.pp_id);
      fetchPetsByOwner(currentChat.petData.pp_id);
    } else {
      // Clear ownerPets if not a 24/7 consultation
      setOwnerPets([]);
    }
  }, [currentChat?.petData?.pp_id, currentChat?.petData?.pet_id, fetchPetsByOwner]);

  // Fetch 24/7 availability status
React.useEffect(() => {
  const fetch247Status = async () => {
    if (!vtId) return;
    
    try {
      const response = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/vet/${vtId}/247-availability`);
      const data = await response.json();
      setAvailable247(data.available247);
    } catch (error) {
      console.error('Error fetching 24/7 status:', error);
    }
  };

  fetch247Status();
}, [vtId]);

const handle247Toggle = async () => {
  const newStatus = available247 === 'yes' ? 'no' : 'yes';
  
  try {
    const response = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/vet/${vtId}/toggle-247-availability`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available247: newStatus })
    });

    if (response.ok) {
      setAvailable247(newStatus);
      showStyledAlert(
        newStatus === 'yes' 
          ? 'You are now visible in 24/7 consultations' 
          : 'You are now hidden from 24/7 consultations'
      );
    }
  } catch (error) {
    console.error('Error toggling 24/7 availability:', error);
    showStyledAlert('Failed to update availability');
  }
};

  const renderMessageContent = (msg) => {
    if (msg.msg_type === "img") {
      return (
        <div className="message-image">
          <img
            src={`https://fyp-pet-telehealth-system.onrender.com${msg.msg}`}
            alt="Shared image"
            style={{
              maxWidth: "300px",
              maxHeight: "400px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
            onClick={() =>
              window.open(`https://fyp-pet-telehealth-system.onrender.com${msg.msg}`, "_blank")
            }
          />
        </div>
      );
    } else if (msg.msg_type === "file") {
      const fileName = msg.msg.split("/").pop();
      return (
        <div className="message-file">
          <a
            href={`https://fyp-pet-telehealth-system.onrender.com${msg.msg}`}
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

  // Add this function in your parent component
  const handleCancelAppointment = async (apptId, cancelReason) => {
    const cancelledBy = "veterinarian";

    try {
      const response = await fetch(
        `https://fyp-pet-telehealth-system.onrender.com/api/appointments/${apptId}/cancel`,
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

      // Refresh appointment details for this pet
      if (currentChat?.petData?.pet_id) {
        fetchAppointmentDetails(currentChat.petData.pet_id);
      }

      return data;
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      throw error;
    }
  };

  const handleRescheduleRequest = async (apptId, rescheduleReason) => {
    const requestedBy = "veterinarian"; // Fixed: hardcode it since this is petowner-chat

    try {
      const response = await fetch(
        `https://fyp-pet-telehealth-system.onrender.com/api/appointments/${apptId}/reschedule-request`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rescheduleReason,
            requestedBy: requestedBy,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to request reschedule");
      }

      const data = await response.json();
      showStyledAlert("Reschedule request sent successfully");

      // Refresh appointment details
      if (currentChat?.petData?.pet_id) {
        fetchAppointmentDetails(currentChat.petData.pet_id);
      }

      return data;
    } catch (error) {
      console.error("Error requesting reschedule:", error);
      throw error;
    }
  };

  // Add handler for selecting suggested reply
  const handleSelectSuggestedReply = async (template) => {
    setMessage(template.template_message);
    setSelectedTemplate(template);

    // Optional: Auto-focus the input
    const messageInput = document.querySelector(".message-input");
    if (messageInput) messageInput.focus();
  };

  // Add handler for sending message with template tracking
  const handleSendMessage = async () => {
    if (!message.trim()) return;

    shouldAutoScroll.current = true;
    const sentMessage = await sendMessage(message);

    // Log template usage if a template was used
    if (selectedTemplate && sentMessage) {
      const wasEdited = message !== selectedTemplate.template_message;

      await fetch("https://fyp-pet-telehealth-system.onrender.com/api/vet-templates/log-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplate.template_id,
          vt_id: vtId,
          chat_id: chatId,
          msg_id: sentMessage.msg_id,
          was_edited: wasEdited ? "yes" : "no",
        }),
      });
    }

    setMessage("");
    setSelectedTemplate(null);
    sendTyping(false);
  };

  const handleSaveAsTemplate = (msg) => {
    setMessageToSave(msg);
    setShowSaveTemplateModal(true);
    setNewTemplateData({
      category: "",
      keywords: "",
      editedMessage: msg.msg, // Add editable message
    });
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateData.category || !newTemplateData.keywords) {
      showStyledAlert("Please fill in category and keywords");
      return;
    }

    try {
      await fetch("https://fyp-pet-telehealth-system.onrender.com/api/vet-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vt_id: vtId,
          category: newTemplateData.category,
          keywords: newTemplateData.keywords,
          template_message: newTemplateData.editedMessage || messageToSave.msg, // Use edited version
        }),
      });

      showStyledAlert("Template saved successfully!");
      setShowSaveTemplateModal(false);
      setMessageToSave(null);
      setNewTemplateData({ category: "", keywords: "", editedMessage: "" });
    } catch (error) {
      console.error("Error saving template:", error);
      showStyledAlert("Failed to save template");
    }
  };

  const handleSelectTemplate = (template) => {
    setMessage(template.template_message);
    setSelectedTemplate(template);
    const messageInput = document.querySelector(".message-input");
    if (messageInput) messageInput.focus();
  };

  const checkMessageForSuggestions = async (msg) => {
    if (!vtId || !msg || msg.sender_role === "vt" || msg.msg_type !== "text")
      return;

    try {
      const response = await fetch(
        "https://fyp-pet-telehealth-system.onrender.com/api/vet-templates/analyze",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vt_id: vtId, message: msg.msg }),
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        setMessagesWithSuggestions((prev) => new Set([...prev, msg.msg_id]));
      }
    } catch (error) {
      console.error("Error checking for suggestions:", error);
    }
  };

  // Add these handler functions

  return (
    <div className="vet-dashboard-container">
      <PawPattern count={35} />

      <VetNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div
        className={`main-content ${!sidebarOpen ? "sidebar-collapsed" : ""}`}
      >
        <div className="vetadmin-header">
          <div className="location-info">
            <MapPin size={20} className="location-icon" />
            <span className="location-text">
              {clinicInfo.clinicName || "Clinic"}
            </span>
          </div>
          <ProfileNotification firstName={firstName} />
        </div>

        <div className="chat-container">
          {/* Chat List Sidebar */}
          <div
            className={`chat-list-panel ${!chatListOpen ? "collapsed" : ""}`}
          >
            <div className="chat-list-header">
              <h2>{chatListOpen ? "Patient Messages" : ""}</h2>
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
                    placeholder="Search patients or messages..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      className="search-clear"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults({ patients: [], messages: [] });
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {searchQuery && (
                  <div className="search-results">
                    {/* Patients Section */}
                    <div className="search-section">
                      <h4 className="search-section-title">
                        Patients ({searchResults.patients.length})
                      </h4>
                      {searchResults.patients.length > 0 ? (
                        <div className="search-items">
                          {searchResults.patients.map((chat) => (
                            <div
                              key={chat.id}
                              className="search-result-item"
                              onClick={() => {
                                setSelectedChat(chat.id);
                                setSearchOpen(false);
                                setSearchQuery("");
                                setSearchResults({
                                  patients: [],
                                  messages: [],
                                });
                              }}
                            >
                              <div className="chat-avatar">{chat.avatar}</div>
                              <div className="search-result-content">
                                <div className="search-result-name">
                                  {chat.name}
                                </div>
                                <div className="search-result-detail">
                                  {chat.petName} • {chat.petType}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="search-no-results">No patients found</p>
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
                                setSearchResults({
                                  patients: [],
                                  messages: [],
                                });
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


            {/* Add this section after the regular chat list and before the closing chatListOpen check */}
            {chatListOpen && (
              <>
                <div 
                  className="available-vets-toggle"
                  onClick={() => setShow24x7Patients(!show24x7Patients)}
                >
                  <h4>
                    <span className="toggle-icon">
                      {show24x7Patients ? '▼' : '▶'}
                    </span>
                    24/7 Consultations
                  </h4>
                  {/* ✅ ADD TOGGLE BUTTON HERE */}
                  <button
                    className={`availability-toggle-btn ${available247 === 'yes' ? 'available' : 'unavailable'}`}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent toggle collapse
                      handle247Toggle();
                    }}
                    title={available247 === 'yes' ? 'You are visible in 24/7 consultations' : 'You are hidden from 24/7 consultations'}
                  >
                    {available247 === 'yes' ? 'Available' : 'Unavailable'}
                  </button>
                </div>

                {show24x7Patients && (
                  <div className="consultation-247-list">
                    {loading24x7 ? (
                      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                        Loading...
                      </p>
                    ) : consultation24x7Chats.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                        No 24/7 consultations
                      </p>
                    ) : (
                      consultation24x7Chats.map((chat) => (
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
                            <span className="chat-specialty">24/7 Consultation</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}


            {chatListOpen && (
              <>
                <div className="chat-list">
                  {loading ? (
                    <div style={{ padding: "20px", textAlign: "center" }}>
                      <p>Loading patients...</p>
                    </div>
                  ) : myPatients.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center" }}>
                      <p>No patients assigned yet</p>
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
                  {currentChat?.online && <div className="online-indicator" />}
                </div>
                <div>
                  <h3>{currentChat?.name}</h3>
                  <p className="chat-header-status">
                    {otherUserOnline ? "Online" : "Offline"} •{" "}
                    {currentChat?.petData?.pet_id 
                      ? `${currentChat.petName} ${currentChat.petType ? `(${currentChat.petType})` : ''}`
                      : '24/7 Consultation'}
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
                <button
                  className="chat-action-btn"
                  title="Manage Templates"
                  onClick={() => setShowTemplateManager(true)}
                >
                  <Settings size={18} />
                </button>
              </div>
            </div>

            {/* Quick Actions Banner */}
            {currentChat?.petData?.pet_id && (
              <div className="quick-actions-banner">
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
                <button
                  className="quick-action-chip"
                  onClick={() => setShowHealthModal(true)}
                >
                  <FileText size={14} />
                  Add to Medical Records
                </button>
              </div>
            )}

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
                          msg.sender_role === "vt" ? "sent" : "received"
                        }`}
                      >
                        <div
                          className="message-content"
                          onMouseEnter={() => {
                            if (
                              msg.sender_role === "vt" &&
                              msg.msg_type === "text"
                            ) {
                              setHoveredMessageId(msg.msg_id);
                            } else if (
                              msg.sender_role !== "vt" &&
                              msg.msg_type === "text"
                            ) {
                              setHoveredPetMessage(msg.msg_id);
                            }
                          }}
                          onMouseLeave={(e) => {
                            // Check if mouse is moving towards the button
                            const relatedTarget = e.relatedTarget;
                            if (
                              relatedTarget &&
                              (relatedTarget.closest(".save-template-btn") ||
                                relatedTarget.closest(".suggest-reply-btn"))
                            ) {
                              return; // Don't hide if moving to button
                            }
                            setHoveredMessageId(null);
                            setHoveredPetMessage(null);
                          }}
                        >
                          {/* Save as Template Button - For vet's messages */}
                          {msg.sender_role === "vt" &&
                            msg.msg_type === "text" &&
                            hoveredMessageId === msg.msg_id && (
                              <button
                                className="save-template-btn"
                                onClick={() => handleSaveAsTemplate(msg)}
                                onMouseEnter={() =>
                                  setHoveredMessageId(msg.msg_id)
                                }
                                onMouseLeave={() => {
                                  setHoveredMessageId(null);
                                }}
                                title="Save as template"
                              >
                                <Save size={14} />
                              </button>
                            )}

                          {/* Suggested Replies Button - For pet owner's messages */}
                          {msg.sender_role !== "vt" &&
                            msg.msg_type === "text" &&
                            hoveredPetMessage === msg.msg_id &&
                            messagesWithSuggestions.has(msg.msg_id) && (
                              <button
                                className="suggest-reply-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSuggestionsClosedForMessage(null);
                                  setShowSuggestionsFor(msg);
                                  setLastReceivedMessage(null);
                                }}
                                onMouseEnter={() =>
                                  setHoveredPetMessage(msg.msg_id)
                                }
                                onMouseLeave={() => {
                                  setHoveredPetMessage(null);
                                }}
                                title="View suggested replies"
                              >
                                <Sparkles size={14} />
                              </button>
                            )}

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
                            {msg.sender_role === "vt" && (
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

            {/* Auto-show suggestions for last received message */}
            {/* Show suggestions - either from last message or hovered message */}
            {(lastReceivedMessage || showSuggestionsFor) && (
              <SuggestedReplies
                message={showSuggestionsFor || lastReceivedMessage}
                vtId={vtId}
                chatId={chatId}
                onSelectReply={(template) => {
                  if (template) {
                    handleSelectSuggestedReply(template);
                  }
                  // Close automatically when selecting a reply
                  const msgId = (showSuggestionsFor || lastReceivedMessage)
                    ?.msg_id;
                  setSuggestionsClosedForMessage(msgId);
                  setShowSuggestionsFor(null);
                  setLastReceivedMessage(null);
                }}
                onClose={() => {
                  const msgId = (showSuggestionsFor || lastReceivedMessage)
                    ?.msg_id;
                  setSuggestionsClosedForMessage(msgId);
                  setShowSuggestionsFor(null);
                  setLastReceivedMessage(null);
                }}
              />
            )}

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

              {/* Add Template Search Button */}
              <button
                className="template-search-button"
                title="Search Reply Templates"
                onClick={() => setShowTemplateSearch(true)}
              >
                <Sparkles size={18} />
              </button>

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
                      shouldAutoScroll.current = true;
                      sendMessage(message);
                      setMessage("");
                      sendTyping(false);
                    }
                  }
                }}
              />
              <button className="send-button" onClick={handleSendMessage}>
                <Send size={18} />
              </button>
            </div>
          </div>

          {/* Pet Info Panel */}
          {showPetInfo && (
            <div className="pet-info-panel">
              <div className="pet-info-header">
                <h3>{currentChat?.petData?.pet_id ? 'Patient Information' : 'Pet Information'}</h3>
                <button
                  className="close-panel-btn"
                  onClick={() => setShowPetInfo(false)}
                >
                  <X size={22} />
                </button>
              </div>

              {!currentChat?.petData?.pet_id ? (
              // 24/7 Consultation - Show pet selector
              <>
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
                    value={selectedPetDisplay || ''}
                    onChange={(e) => {
                      const petId = e.target.value;
                      setSelectedPetDisplay(petId);
                      if (petId) {
                        console.log('🐾 Selected pet_id:', petId);
                        fetchAppointmentDetails(petId);
                        fetchLastVisit(petId);
                      }
                    }}
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
                    <option value="">Choose a pet...</option>
                    {ownerPets.map((pet) => (
                      <option key={pet.pet_id} value={pet.pet_id}>
                        {pet.pet_name} ({pet.pet_species})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPetDisplay && ownerPets.length > 0 ? (
                    // Show selected pet info
                    <>
                      {(() => {
                        // ✅ FIX 1: Look in ownerPets (the list populated for this specific owner)
                        const selectedPatient = ownerPets.find(p => String(p.pet_id) === String(selectedPetDisplay));
                        if (!selectedPatient) return null;

                        const displayPet = {
                          pet_id: selectedPatient.pet_id,
                          name: selectedPatient.pet_name,
                          species: selectedPatient.pet_species,
                          breed: selectedPatient.pet_breed,
                          age: `${selectedPatient.pet_age} years`,
                          gender: selectedPatient.pet_gender === "m" ? "Male" : "Female",
                          weight: `${selectedPatient.pet_weight} kg`,
                          dietType: selectedPatient.pet_dietType || "Not specified",
                          image: selectedPatient.pet_image || null,
                          imageEmoji: selectedPatient.pet_species?.toLowerCase().includes("dog") ? "🐕" : "🐱",
                          // ✅ FIX 2: Fallback to currentChat data for owner info (since pet record might not have it)
                          owner: `${selectedPatient.owner_firstName || currentChat.petData.owner_firstName} ${selectedPatient.owner_lastName || currentChat.petData.owner_lastName}`,
                          ownerEmail: selectedPatient.owner_email || currentChat.petData.owner_email,
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
                          behavioralNotes: selectedPatient.pet_behavioralNotes || "No behavioral notes recorded",
                          medications: selectedPatient.pet_hasMedication === "yes" && selectedPatient.pet_medicationDetails
                            ? selectedPatient.pet_medicationDetails.split(",").map((med) => med.trim())
                            : ["No active medications"],
                          allergies: selectedPatient.pet_hasAllergies === "yes" && selectedPatient.pet_allergyDetails
                            ? selectedPatient.pet_allergyDetails.split(",").map((allergy) => allergy.trim())
                            : ["No known allergies"],
                          vaccinations: selectedPatient.pet_hasVaccination === "yes"
                            ? [`Last vaccination: ${selectedPatient.pet_vaccinationDate
                                ? new Date(selectedPatient.pet_vaccinationDate).toLocaleDateString()
                                : "N/A"}`]
                            : ["No vaccination records"],
                        };

                        return (
                          <>
                            <div className="pet-profile-card">
                              <div className="pet-image-large">
                                {displayPet.image ? (
                                  <img
                                    src={`https://fyp-pet-telehealth-system.onrender.com${displayPet.image}`}
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
                                  <span className="stat-label-chat">Age</span>
                                  <span className="stat-value-chat">{displayPet.age}</span>
                                </div>
                                <div className="pet-stat">
                                  <span className="stat-label-chat">Gender</span>
                                  <span className="stat-value-chat">{displayPet.gender}</span>
                                </div>
                              </div>
                            </div>

                            <div className="pet-info-section">
                              <h4>Owner</h4>
                              <p className="info-text">{displayPet.owner}</p>
                              <p className="info-text small">{displayPet.ownerEmail}</p>
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
                              <p className="info-text highlight">{displayPet.nextAppointment}</p>
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

                            {/* ✅ ADD THIS BUTTON FOR 24/7 CONSULTATIONS */}
                            <button
                              className="view-records-btn"
                              onClick={() => setShowHealthModal(true)}
                            >
                              <FileText size={16} />
                              View Medical Records
                            </button>
                          </>
                        );
                      })()}
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
                </>
              ) : currentPet ? (
                // Regular patient - Show current pet info
                <>
                  <div className="pet-profile-card">
                    <div className="pet-image-large">
                      {currentPet.image ? (
                        <img
                          src={`https://fyp-pet-telehealth-system.onrender.com${currentPet.image}`}
                          alt={currentPet.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "12px",
                          }}
                        />
                      ) : (
                        <span>{currentPet.imageEmoji}</span>
                      )}
                    </div>
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
                        <span key={idx} className="condition-tag alert">
                          {allergy}
                        </span>
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

                  <button
                    className="view-records-btn"
                    onClick={() => setShowHealthModal(true)}
                  >
                    <FileText size={16} />
                    Update Patient Records
                  </button>
                </>
              ) : null}
            </div>
          )}

          <AppointmentDetailsModal
            showModal={showAppointmentModal}
            appointmentDetails={appointmentDetails}
            onClose={() => setShowAppointmentModal(false)}
            formatDate={formatDate}
            onCancelAppointment={handleCancelAppointment} // Add this
            onRescheduleRequest={handleRescheduleRequest} // Add this
            userRole="vt"
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
          otherUserId={String(currentChat?.petData?.owner_usr_id)} // or vet_usr_id for petowner
          otherUserName={currentChat?.name}
          otherUserOnline={otherUserOnline}
          userRole="vt" // or "pp"
          petInfo={currentPet}
          petId={currentChat?.petData?.pet_id}
          vtId={vtId} // only for vet-chat.jsx
          onClose={() => {
            setShowVideoCall(false);
          }}
        />
      )}

      {/* Health Records Modal */}
      {showHealthModal && (currentChat?.petData?.pet_id || selectedPetDisplay) && (
        <PatientProfileModal
          // ✅ FIX: Use selectedPetDisplay if currentChat doesn't have a fixed pet_id
          petId={selectedPetDisplay || currentChat?.petData?.pet_id}
          vtId={vtId}
          onClose={() => setShowHealthModal(false)}
          // ✅ FIX: Pass ReadOnly flag for 24/7 consultations (when no fixed pet_id exists)
          isReadOnly={!currentChat?.petData?.pet_id}
        />
      )}

      {showTemplateManager && (
        <TemplateManager
          vtId={vtId}
          onClose={() => setShowTemplateManager(false)}
        />
      )}

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="template-manager-modal">
          <div
            className="template-manager-content"
            style={{ maxWidth: "500px" }}
          >
            <div className="template-manager-header">
              <h2>Save as Template</h2>
              <button
                className="close-btn"
                onClick={() => setShowSaveTemplateModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="template-manager-body">
              <div className="template-form">
                <label
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    marginBottom: "8px",
                    display: "block",
                    fontWeight: "600",
                  }}
                >
                  Message Preview (editable):
                </label>
                <textarea
                  value={newTemplateData.editedMessage}
                  onChange={(e) =>
                    setNewTemplateData({
                      ...newTemplateData,
                      editedMessage: e.target.value,
                    })
                  }
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#f8fafc",
                    border: "2px solid #e8f0f7",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    fontSize: "14px",
                    color: "#333",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />

                <input
                  type="text"
                  placeholder="Category (e.g., Skin Issues, Vaccination)"
                  value={newTemplateData.category}
                  onChange={(e) =>
                    setNewTemplateData({
                      ...newTemplateData,
                      category: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="Keywords (comma-separated, e.g., rash, itching, skin)"
                  value={newTemplateData.keywords}
                  onChange={(e) =>
                    setNewTemplateData({
                      ...newTemplateData,
                      keywords: e.target.value,
                    })
                  }
                />

                <div className="form-actions">
                  <button onClick={handleSaveTemplate} className="save-btn">
                    <Save size={16} /> Save Template
                  </button>
                  <button
                    onClick={() => setShowSaveTemplateModal(false)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Search Modal */}
      {showTemplateSearch && (
        <TemplateSearchModal
          vtId={vtId}
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplateSearch(false)}
        />
      )}
    </div>
  );
};

export default VetChat;
