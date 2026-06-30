// VideoCall.jsx — Clean, Modern Design with Dropdown Menu
import React, { useRef, useEffect, useState, useCallback } from "react";
import Peer from "simple-peer/simplepeer.min.js";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  X,
  Maximize2,
  Minimize2,
  FileText,
  ChevronDown,
  User,
  Monitor,
  MonitorOff,
} from "lucide-react";
import PatientProfileModal from "./PatientProfileModal";
import "../styles/VideoCall.css";

const VideoCall = ({
  socket,
  currentUserId,
  currentUserName,
  otherUserId,
  otherUserName,
  otherUserOnline,
  petInfo,
  petId,
  vtId,
  incomingCall,
  onClose,
  userRole,
}) => {
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [endingMessage, setEndingMessage] = useState("");
  const [showEndingScreen, setShowEndingScreen] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const actualPetInfo = petInfo || incomingCall?.petInfo;
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  const leaveCall = useCallback(
    (reason = "ended") => {
      socket.emit("endCall", { to: otherUserId, reason });
      if (connectionRef.current) connectionRef.current.destroy();
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (screenStream)
        screenStream.getTracks().forEach((track) => track.stop());

      const message =
        reason === "cancelled"
          ? "Call Cancelled"
          : reason === "declined"
          ? "Call Declined"
          : "Call Ended";
      setEndingMessage(message);
      setShowEndingScreen(true);

      setTimeout(() => {
        setCallEnded(true);
        onClose();
      }, 1500);
    },
    [socket, otherUserId, stream, screenStream, onClose]
  );

  const answerCall = useCallback(async () => {
    setReceivingCall(false);
    setCallAccepted(true);
    setCallStarted(true);

    let mediaStream = null;
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      if (myVideo.current) myVideo.current.srcObject = mediaStream;
    } catch (err) {
      console.warn("Media stream error:", err);
    }

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: mediaStream,
    });
    peer.on("signal", (data) =>
      socket.emit("answerCall", { signal: data, to: caller })
    );
    peer.on("stream", (remoteStream) => {
      if (userVideo.current) userVideo.current.srcObject = remoteStream;
    });
    peer.signal(callerSignal);
    connectionRef.current = peer;
  }, [socket, caller, callerSignal]);

  const callUser = useCallback(async () => {
    // ✅ Ensure socket is connected before calling
    if (!socket || !socket.connected) {
      console.error("❌ Socket not connected, waiting...");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setCallStarted(true);
    let mediaStream = null;
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      if (myVideo.current) myVideo.current.srcObject = mediaStream;
    } catch (err) {
      console.warn("Media stream error:", err);
    }

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: mediaStream,
    });

    peer.on("signal", (data) => {
      console.log("📞 Emitting callUser to:", otherUserId);
      socket.emit("callUser", {
        userToCall: String(otherUserId),
        from: String(currentUserId),
        name: currentUserName,
        signalData: data,
        petInfo: petInfo,
      });
    });

    peer.on("stream", (remoteStream) => {
      if (userVideo.current) userVideo.current.srcObject = remoteStream;
    });

    connectionRef.current = peer;
  }, [socket, otherUserId, currentUserId, currentUserName, petInfo]);

  useEffect(() => {
    if (!socket) return;

    if (incomingCall) {
      setReceivingCall(true);
      setCaller(incomingCall.from);
      setCallerSignal(incomingCall.signal);
      // ✅ Store petInfo from incoming call
      if (incomingCall.petInfo && !petInfo) {
        // This ensures petInfo is available for the receiver
        console.log(
          "📞 Storing petInfo from incoming call:",
          incomingCall.petInfo
        );
      }
    }

    const incomingCallHandler = ({ from, signal }) => {
      setReceivingCall(true);
      setCaller(from);
      setCallerSignal(signal);
      // ✅ petInfo is already handled by actualPetInfo
    };

    const callAcceptedHandler = ({ signal }) => {
      setCallAccepted(true);
      if (connectionRef.current) connectionRef.current.signal(signal);
    };

    const callEndedHandler = ({ reason }) => {
      const message =
        reason === "cancelled"
          ? "Call Cancelled"
          : reason === "declined"
          ? "Call Declined"
          : "Call Ended";
      setEndingMessage(message);
      setShowEndingScreen(true);
      if (connectionRef.current) connectionRef.current.destroy();
      if (stream) stream.getTracks().forEach((track) => track.stop());
      setTimeout(() => {
        setCallEnded(true);
        onClose();
      }, 2000);
    };

    socket.on("callUser", incomingCallHandler);
    socket.on("callAccepted", callAcceptedHandler);
    socket.on("callEnded", callEndedHandler);

    return () => {
      socket.off("callUser", incomingCallHandler);
      socket.off("callAccepted", callAcceptedHandler);
      socket.off("callEnded", callEndedHandler);
    };
  }, [socket, leaveCall, incomingCall, stream, onClose, petInfo]);

  const toggleMute = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;
    const newMutedState = !isMuted;
    audioTrack.enabled = !newMutedState;
    setIsMuted(newMutedState);
  };

  const toggleVideo = () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;
    const newVideoOffState = !isVideoOff;
    videoTrack.enabled = !newVideoOffState;
    setIsVideoOff(newVideoOffState);
  };

  const startScreenShare = async () => {
    try {
      const screenMediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
        },
        audio: false,
      });

      setScreenStream(screenMediaStream);
      setIsScreenSharing(true);

      // Replace video track in peer connection
      if (connectionRef.current) {
        const videoTrack = screenMediaStream.getVideoTracks()[0];
        const sender = connectionRef.current._pc
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");

        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }

      // Stop screen sharing when user clicks "Stop Sharing" in browser
      screenMediaStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error("Error starting screen share:", err);
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
    }
    setIsScreenSharing(false);

    // Switch back to camera
    if (stream && connectionRef.current) {
      const videoTrack = stream.getVideoTracks()[0];
      const sender = connectionRef.current._pc
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");

      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
      }
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.95)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: isFullscreen ? "100%" : "90%",
          maxWidth: isFullscreen ? "none" : "1400px",
          height: isFullscreen ? "100vh" : "90vh",
          background: "#1a1a1a",
          borderRadius: isFullscreen ? 0 : "16px",
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Ending Screen */}
        {showEndingScreen && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.95)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              color: "white",
            }}
          >
            <PhoneOff
              size={64}
              style={{ marginBottom: "20px", opacity: 0.7 }}
            />
            <h2 style={{ fontSize: "32px", fontWeight: "600", margin: 0 }}>
              {endingMessage}
            </h2>
            <p style={{ fontSize: "16px", opacity: 0.7, marginTop: "10px" }}>
              Closing...
            </p>
          </div>
        )}

        {/* Header */}
        {/* Header */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: actualPetInfo ? "180px" : "10px", // Position next to Patient Info button
            zIndex: 10,
            background: "rgba(0, 0, 0, 0.7)",
            padding: "10px 16px",
            borderRadius: "20px",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            maxWidth: "280px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: callAccepted && callStarted ? "#10b981" : "#f59e0b",
              flexShrink: 0,
            }}
          />
          <div
            style={{
              fontSize: "13px",
              color: "white",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {callAccepted && callStarted
              ? `${otherUserName}`
              : receivingCall
              ? `Incoming: ${otherUserName}`
              : callStarted
              ? `Calling ${otherUserName}...`
              : "Ready"}
          </div>
          {actualPetInfo?.name && (
            <div
              style={{
                fontSize: "12px",
                color: "rgba(255, 255, 255, 0.6)",
                borderLeft: "1px solid rgba(255, 255, 255, 0.2)",
                paddingLeft: "8px",
              }}
            >
              {actualPetInfo.name}
            </div>
          )}
        </div>

        {/* Top Right Controls */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            zIndex: 20,
            display: "flex",
            gap: "8px",
          }}
        >
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "white",
              padding: "8px",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button
            onClick={() => {
              if (callStarted || receivingCall) {
                leaveCall("ended");
              } else {
                if (stream) stream.getTracks().forEach((track) => track.stop());
                onClose();
              }
            }}
            style={{
              background: "rgba(239, 68, 68, 0.3)",
              border: "none",
              color: "white",
              padding: "8px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Video Area */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "#000",
            overflow: "hidden",
          }}
        >
          {/* Remote Video */}
          {callAccepted && !callEnded ? (
            <video
              ref={userVideo}
              autoPlay
              playsInline
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover", // ← Use "cover" to fill the space
                backgroundColor: "#000",
              }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "white",
              }}
            >
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "48px",
                  fontWeight: "bold",
                  marginBottom: "20px",
                }}
              >
                {otherUserName?.charAt(0)}
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: "24px" }}>
                {receivingCall
                  ? "Incoming Call..."
                  : callStarted && !callAccepted
                  ? "Calling... Waiting for answer"
                  : callStarted && callAccepted
                  ? "Connecting..."
                  : otherUserOnline
                  ? "Ready to Start"
                  : "User Unavailable"}
              </h3>
              <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.7)" }}>
                {receivingCall
                  ? `${otherUserName} is calling you`
                  : callStarted
                  ? ""
                  : otherUserOnline
                  ? 'Click "Start Call" below'
                  : `${otherUserName} is currently offline`}
              </p>
            </div>
          )}

          {/* SCREEN SHARING INDICATOR */}
          {isScreenSharing && (
            <div
              style={{
                position: "absolute",
                top: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(59, 130, 246, 0.9)",
                color: "white",
                padding: "12px 24px",
                borderRadius: "50px",
                fontSize: "14px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                zIndex: 50,
              }}
            >
              <Monitor size={18} />
              You are sharing your screen
            </div>
          )}

          {/* Local Video */}
          <div
            style={{
              width: "240px",
              height: "180px",
              position: "absolute",
              bottom: "20px",
              right: "20px",
              background: "#000",
              borderRadius: "12px",
              overflow: "hidden",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              zIndex: 20,
            }}
          >
            <video
              ref={myVideo}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: isVideoOff ? "none" : "block",
              }}
            />
            {(isVideoOff || !stream) && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#1a1a1a",
                }}
              >
                <VideoOff size={32} style={{ opacity: 0.5, color: "white" }} />
              </div>
            )}
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                left: "12px",
                background: "rgba(0, 0, 0, 0.7)",
                color: "white",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "14px",
                backdropFilter: "blur(10px)",
              }}
            >
              You
            </div>
            {isMuted && (
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  backgroundColor: "rgba(239, 68, 68, 0.9)",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <MicOff size={14} /> Muted
              </div>
            )}
          </div>
        </div>

        {/* Patient Info Dropdown */}
        {actualPetInfo && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              zIndex: 100,
            }}
          >
            <button
              onClick={() => setShowPatientDropdown(!showPatientDropdown)}
              style={{
                background: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "white",
                padding: "12px 16px",
                borderRadius: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.2s",
              }}
            >
              <User size={18} />
              Patient Info
              <ChevronDown
                size={16}
                style={{
                  transform: showPatientDropdown
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </button>

            {showPatientDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: "8px",
                  background: "rgba(0, 0, 0, 0.9)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "12px",
                  padding: "16px",
                  minWidth: "320px",
                  maxWidth: "400px",
                  maxHeight: "60vh", // ← Changed from 500px to 60vh for better scaling
                  overflowY: "auto",
                  color: "white",
                }}
                // Add custom scrollbar styling
                onMouseEnter={(e) => {
                  e.currentTarget.style.setProperty("--scrollbar-visible", "1");
                }}
              >
                {/* Pet Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px",
                    paddingBottom: "16px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {actualPetInfo.image ? (
                    <img
                      src={`https://fyp-pet-telehealth-system.onrender.com${actualPetInfo.image}`}
                      alt={actualPetInfo.name}
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        background: "rgba(255, 255, 255, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "32px",
                      }}
                    >
                      {actualPetInfo.species?.toLowerCase().includes("dog")
                        ? "🐕"
                        : "🐱"}
                    </div>
                  )}
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "18px",
                        fontWeight: "600",
                      }}
                    >
                      {actualPetInfo.name}
                    </h3>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "14px",
                        color: "rgba(255, 255, 255, 0.7)",
                      }}
                    >
                      {actualPetInfo.species} • {actualPetInfo.breed}
                    </p>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    marginBottom: "16px",
                  }}
                >
                  {[
                    { label: "Gender", value: actualPetInfo.gender },
                    { label: "Age", value: actualPetInfo.age },
                    { label: "Weight", value: actualPetInfo.weight },
                    { label: "Diet", value: actualPetInfo.dietType || "N/A" },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        padding: "12px",
                        borderRadius: "8px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "11px",
                          color: "rgba(255, 255, 255, 0.6)",
                          marginBottom: "4px",
                          textTransform: "uppercase",
                          fontWeight: "600",
                        }}
                      >
                        {item.label}
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: "500" }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Medical Badges */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "8px",
                    marginBottom: "16px",
                  }}
                >
                  {[
                    {
                      icon: "💉",
                      label: "Vacc",
                      status:
                        actualPetInfo.vaccinations?.[0] !==
                        "No vaccination records",
                    },
                    {
                      icon: "💊",
                      label: "Meds",
                      status:
                        actualPetInfo.medications?.[0] !==
                        "No active medications",
                    },
                    {
                      icon: "⚠️",
                      label: "Allergy",
                      status:
                        actualPetInfo.allergies?.[0] !== "No known allergies",
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "12px",
                        background: item.status
                          ? "rgba(251, 191, 36, 0.2)"
                          : "rgba(255, 255, 255, 0.05)",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ fontSize: "24px", marginBottom: "4px" }}>
                        {item.icon}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "rgba(255, 255, 255, 0.6)",
                          fontWeight: "600",
                        }}
                      >
                        {item.label}
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: "500" }}>
                        {item.status ? "Yes" : "No"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Behavioral Notes */}
                {actualPetInfo.behavioralNotes && (
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      padding: "12px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "rgba(255, 255, 255, 0.6)",
                        textTransform: "uppercase",
                        marginBottom: "8px",
                      }}
                    >
                      Behavioral Notes
                    </div>
                    <div style={{ fontSize: "13px", lineHeight: "1.5" }}>
                      {actualPetInfo.behavioralNotes}
                    </div>
                  </div>
                )}

                {/* View Complete Records Button */}
                <button
                  onClick={() => {
                    setShowPatientDropdown(false);
                    setShowHealthModal(true);
                  }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(59, 130, 246, 0.2)",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    borderRadius: "8px",
                    color: "#60a5fa",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s",
                  }}
                >
                  <FileText size={16} />
                  View Complete Records
                </button>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            background: "rgba(0, 0, 0, 0.7)",
            padding: "16px 20px",
            borderRadius: "50px",
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          }}
        >
          {receivingCall && !callAccepted ? (
            <>
              <button
                onClick={answerCall}
                style={{
                  padding: "16px 32px",
                  borderRadius: "50px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#10b981",
                  color: "white",
                }}
              >
                <Video size={24} /> Accept
              </button>
              <button
                onClick={() => leaveCall("declined")}
                style={{
                  padding: "16px 32px",
                  borderRadius: "50px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#ef4444",
                  color: "white",
                }}
              >
                <PhoneOff size={24} /> Decline
              </button>
            </>
          ) : !callStarted ? (
            otherUserOnline ? (
              <button
                onClick={callUser}
                style={{
                  padding: "16px 32px",
                  borderRadius: "50px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#3b82f6",
                  color: "white",
                }}
              >
                <Video size={24} /> Start Call
              </button>
            ) : (
              <button
                disabled
                style={{
                  padding: "16px 32px",
                  borderRadius: "50px",
                  border: "none",
                  cursor: "not-allowed",
                  fontSize: "16px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#6b7280",
                  color: "#d1d5db",
                  opacity: 0.6,
                }}
              >
                <Video size={24} /> User Offline
              </button>
            )
          ) : callStarted && callAccepted ? (
            <>
              <button
                onClick={toggleMute}
                style={{
                  background: isMuted
                    ? "rgba(239, 68, 68, 0.3)"
                    : "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "white",
                  padding: "16px",
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              <button
                onClick={toggleVideo}
                style={{
                  background: isVideoOff
                    ? "rgba(239, 68, 68, 0.3)"
                    : "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "white",
                  padding: "16px",
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
                title={isVideoOff ? "Turn on camera" : "Turn off camera"}
              >
                {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
              </button>

              {/*SCREEN SHARE BUTTON */}
              <button
                onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                style={{
                  background: isScreenSharing
                    ? "rgba(59, 130, 246, 0.5)"
                    : "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "white",
                  padding: "16px",
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
                title={isScreenSharing ? "Stop sharing" : "Share screen"}
              >
                {isScreenSharing ? (
                  <MonitorOff size={24} />
                ) : (
                  <Monitor size={24} />
                )}
              </button>

              <button
                onClick={() => leaveCall("ended")}
                style={{
                  padding: "16px 32px",
                  borderRadius: "50px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                  background: "#ef4444",
                  color: "white",
                }}
              >
                <PhoneOff size={24} />
              </button>
            </>
          ) : (
            <button
              onClick={() => leaveCall("cancelled")}
              style={{
                padding: "16px 32px",
                borderRadius: "50px",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#ef4444",
                color: "white",
              }}
            >
              <PhoneOff size={24} /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Patient Profile Modal */}
      {showHealthModal && actualPetInfo && (
        <div style={{ position: "fixed", zIndex: 10001 }}>
          <PatientProfileModal
            petId={actualPetInfo.pet_id || petId}
            vtId={vtId || null}
            onClose={() => setShowHealthModal(false)}
            viewMode={userRole === "pp" ? "petowner" : "vet"}
          />
        </div>
      )}
    </div>
  );
};

export default VideoCall;
