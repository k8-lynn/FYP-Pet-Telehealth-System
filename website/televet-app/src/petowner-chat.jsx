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
      alert("Appointment cancelled successfully");

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

  const handleRescheduleRequest = async (apptId, rescheduleReason) => {
    const requestedBy = "petParent"; // Fixed: hardcode it since this is petowner-chat

    try {
      const response = await fetch(
        `http://localhost:5000/api/appointments/${apptId}/reschedule-request`,
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
      alert("Reschedule request sent successfully");

      // Refresh appointment details
      setShowAppointmentModal(false);
      setAppointmentDetails(null);

      // Refresh appointments list

      return data;
    } catch (error) {
      console.error("Error requesting reschedule:", error);
      throw error;
    }
  };

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

      setMyPets(petsWithVet);

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
          alert("No scheduled appointment found for this pet");
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
        alert("Failed to fetch appointment details");
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
    name:
      pet.vet_firstName && pet.vet_lastName
        ? `Dr. ${pet.vet_firstName} ${pet.vet_lastName}`
        : `Vet ID: ${pet.pet_assignedVet}`,
    specialty: pet.vet_specialization || "General Veterinarian",
    avatar:
      pet.vet_firstName && pet.vet_lastName
        ? `${pet.vet_firstName.charAt(0)}${pet.vet_lastName.charAt(0)}`
        : "V",
    lastMessage: pet.last_msg || "No recent messages",
    time: pet.last_msg_at
      ? new Date(pet.last_msg_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : new Date(pet.pet_lastUpdated || Date.now()).toLocaleDateString(),
    unread: pet.unread_count || 0,
    online: pet.vet_usr_isOnline === "yes",
    petName: pet.pet_name,
    petType: pet.pet_species,
    petData: pet,
  }));

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
        clinic: currentChat.petData.vet_clinicName || "PawCare Clinic",
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
      alert("File size must be less than 10MB");
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
      alert(
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
      alert("Failed to upload file. Please try again.");
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
      alert("Please fill in all required fields");
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
        alert("Reminder created successfully!");
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
        alert("Failed to create reminder");
      }
    } catch (error) {
      console.error("❌ Error creating reminder:", error);
      alert("Failed to create reminder");
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
                  {otherUserOnline && <div className="online-indicator" />}
                </div>
                <div>
                  <h3>{currentChat?.name}</h3>
                  <p className="chat-header-status">
                    {otherUserOnline ? "Online" : "Offline"} •{" "}
                    {currentChat?.specialty} • Treating {currentChat?.petName}
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
                {loadingAppointment ? "Loading..." : "View Appointment Details"}
              </button>
              <button
                className="quick-action-chip"
                onClick={() => setShowHealthModal(true)}
              >
                <FileText size={14} />
                View Medical Records
              </button>
              <button
                className="quick-action-chip"
                onClick={() => setShowCreateReminderModal(true)}
              >
                <Clock size={14} />
                Set Reminder
              </button>
              <button
                className="quick-action-chip"
                onClick={() => setShowBookingModal(true)}
                disabled={!registeredClinic}
              >
                <Calendar size={14} />
                Schedule Follow-Up
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
                <div className="pet-image-large">
                  {currentPet.image ? (
                    <img
                      src={`http://localhost:5000${currentPet.image}`}
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
                <p className="info-text highlight">
                  {currentPet.nextAppointment}
                </p>
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
                View Full Medical Records
              </button>
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
          otherUserId={String(currentChat?.petData?.vet_usr_id)} // or owner_usr_id for vet
          otherUserName={currentChat?.name}
          userRole="pp" // or "vt" for vet
          petInfo={currentPet} // ✅ Just pass currentPet directly, pet_id is already in it
          petId={currentChat?.petData?.pet_id}
          onClose={() => {
            setShowVideoCall(false);
          }}
        />
      )}

      {showHealthModal && currentChat?.petData?.pet_id && (
        <PatientProfileModal
          petId={currentChat.petData.pet_id}
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
          onClick={() => setShowBookingModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <BookAppointment
              clinicId={registeredClinic.clinic_id}
              onClose={() => setShowBookingModal(false)}
              onBookingSuccess={(details) => {
                setShowBookingModal(false);
                // Optionally show success message
                alert(`Follow-up appointment booked for ${details.time}`);
              }}
              initialDescription={`Follow-up with ${
                currentChat?.name || "veterinarian"
              }`}
              autoFillDescription={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PetOwnerChat;
