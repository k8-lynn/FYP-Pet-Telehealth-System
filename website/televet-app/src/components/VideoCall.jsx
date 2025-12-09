import React, { useRef, useEffect, useState, useCallback } from 'react';
import Peer from 'simple-peer';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, X, Maximize2, Minimize2 } from 'lucide-react';
import '../styles/VideoCall.css';

const VideoCall = ({ 
  socket, 
  chatId, 
  currentUserId, 
  currentUserName,
  otherUserId,
  otherUserName,
  petInfo, 
  onClose,
  incomingCall // Data passed if opening from a notification
}) => {
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState('');
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callInitiated, setCallInitiated] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPetInfo, setShowPetInfo] = useState(true);
  
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  // ------------------------------------------------------------
  // 1. Helper Functions (Wrapped in useCallback for dependencies)
  // ------------------------------------------------------------

  // Helper to get media stream (Safe Mode - doesn't throw)
  const getMediaStream = useCallback(async () => {
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setStream(currentStream);
      if (myVideo.current) myVideo.current.srcObject = currentStream;
      setIsMuted(false);
      setIsVideoOff(false);
      return currentStream;
    } catch (err) {
      console.error('⚠️ Media access failed/denied:', err);
      setIsMuted(true);
      setIsVideoOff(true);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('You joined without camera/mic permissions. You can see/hear the other person.');
      }
      return null;
    }
  }, []);

  // Cleanup/Leave Call
  const leaveCall = useCallback(() => {
    setCallEnded(true);
    if (socket) socket.emit('endCall', { to: otherUserId });
    if (connectionRef.current) connectionRef.current.destroy();
    
    // Stop tracks
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    onClose();
  }, [socket, otherUserId, stream, onClose]);

  // Answer Call Logic
  const answerCall = useCallback(async (signalOverride = null, callerOverride = null) => {
    setCallAccepted(true);
    const currentStream = await getMediaStream();

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: currentStream || undefined,
    });

    peer.on('signal', (data) => {
      // Use override if provided (for auto-answer), otherwise state
      const target = callerOverride || caller;
      socket.emit('answerCall', { signal: data, to: target });
    });

    peer.on('stream', (remoteStream) => {
      if (userVideo.current) userVideo.current.srcObject = remoteStream;
    });

    peer.on('error', err => console.error('Peer error:', err));

    // Use override if provided, otherwise state
    const signalToUse = signalOverride || callerSignal;
    if (signalToUse) {
      peer.signal(signalToUse);
    }
    
    connectionRef.current = peer;
  }, [getMediaStream, socket, caller, callerSignal]);

  // Call User Logic (Initiator)
  const callUser = useCallback(async () => {
    setCallInitiated(true);
    const currentStream = await getMediaStream();
    
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: currentStream || undefined, 
    });

    peer.on('signal', (data) => {
      socket.emit('callUser', {
        userToCall: otherUserId,
        signalData: data,
        from: currentUserId,
        name: currentUserName,
        chatId: chatId
      });
    });

    peer.on('stream', (remoteStream) => {
      if (userVideo.current) userVideo.current.srcObject = remoteStream;
    });

    peer.on('error', err => console.error('Peer error:', err));

    connectionRef.current = peer;
  }, [getMediaStream, socket, otherUserId, currentUserId, currentUserName, chatId]);

  // ------------------------------------------------------------
  // 2. Effects
  // ------------------------------------------------------------

  // Handle Socket Events & Incoming Call Prop
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = ({ from, signal }) => {
      console.log('📞 Incoming call from:', from);
      setReceivingCall(true);
      setCaller(from);
      setCallerSignal(signal);
    };

    const handleCallAccepted = (signal) => {
      console.log('✅ Call accepted by other user');
      setCallAccepted(true);
      if (connectionRef.current) {
        connectionRef.current.signal(signal);
      }
    };

    const handleCallEnded = () => {
      console.log('📴 Call ended by other user');
      setCallEnded(true);
      if (connectionRef.current) {
        connectionRef.current.destroy();
      }
      setTimeout(() => onClose(), 2000);
    };

    socket.on('callUser', handleIncomingCall);
    socket.on('callAccepted', handleCallAccepted);
    socket.on('callEnded', handleCallEnded);

    // 🟢 HANDLE PROP: If opened via incoming call prop (Auto Answer Logic)
    if (incomingCall && !callAccepted) {
      console.log('📞 Component mounted with incoming call prop');
      setReceivingCall(true);
      setCaller(incomingCall.from);
      setCallerSignal(incomingCall.signal);
      
      // Auto-answer after a brief delay to ensure state is set
      setTimeout(() => {
        answerCall(incomingCall.signal, incomingCall.from);
      }, 500);
    } 
    // 🟢 AUTO-START: If not receiving and not initiated, assume we are calling
    else if (!incomingCall && !receivingCall && !callInitiated) {
      // Small delay to prevent double-firing
      setTimeout(() => {
        callUser();
      }, 500);
    }

    return () => {
      socket.off('callUser', handleIncomingCall);
      socket.off('callAccepted', handleCallAccepted);
      socket.off('callEnded', handleCallEnded);
    };
  }, [
    socket, 
    onClose, 
    incomingCall, 
    callUser, 
    answerCall, 
    callAccepted, 
    callInitiated, 
    receivingCall
  ]); 

  // Stream Cleanup on Unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // ------------------------------------------------------------
  // 3. UI Controls
  // ------------------------------------------------------------

  const toggleMute = () => {
    if (stream && stream.getAudioTracks()[0]) {
      stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
      setIsMuted(!stream.getAudioTracks()[0].enabled);
    }
  };

  const toggleVideo = () => {
    if (stream && stream.getVideoTracks()[0]) {
      stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
      setIsVideoOff(!stream.getVideoTracks()[0].enabled);
    }
  };

  return (
    <div className={`video-call-overlay ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="video-call-container">
        {/* HEADER */}
        <div className="video-call-header">
          <div className="call-info">
            <h3>{callAccepted ? `In call with ${otherUserName}` : receivingCall ? `Incoming call from ${otherUserName}` : `Calling ${otherUserName}...`}</h3>
            <p>{petInfo?.name ? `Patient: ${petInfo.name}` : 'Telehealth Session'}</p>
          </div>
          <div className="header-actions">
            <button onClick={() => setShowPetInfo(!showPetInfo)} className="icon-btn"><Monitor size={20} /></button>
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="icon-btn">
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button onClick={leaveCall} className="icon-btn close-btn"><X size={20} /></button>
          </div>
        </div>

        {/* VIDEO GRID */}
        <div className="video-grid">
          {/* Remote Video */}
          <div className="video-container main-video">
            {callAccepted && !callEnded ? (
              <>
                <video ref={userVideo} autoPlay playsInline className="video-element" />
                <div className="video-label">{otherUserName}</div>
              </>
            ) : (
              <div className="waiting-screen">
                <div className="avatar-large">{otherUserName?.charAt(0)}</div>
                <h3>{receivingCall ? 'Incoming Call...' : 'Calling...'}</h3>
                <p>{receivingCall ? `${otherUserName} is calling you` : `Waiting for answer...`}</p>
              </div>
            )}
          </div>

          {/* Local Video */}
          <div className="video-container local-video">
            <video ref={myVideo} autoPlay playsInline muted className={`video-element ${isVideoOff ? 'hidden' : ''}`} />
            {(isVideoOff || !stream) && <div className="video-placeholder"><VideoOff size={24} /></div>}
            <div className="video-label">You</div>
          </div>

          {/* PET INFO */}
          {showPetInfo && petInfo && (
            <div className="video-pet-info">
              <h4>Patient Info</h4>
              <div className="pet-info-item">
                <span className="pet-emoji">{petInfo.image || '🐾'}</span>
                <div>
                  <p className="pet-name">{petInfo.name}</p>
                  <p className="pet-details">{petInfo.species} • {petInfo.breed}</p>
                </div>
              </div>
              <div className="pet-vitals">
                <div className="vital-item"><span>Age</span><span>{petInfo.age}</span></div>
                <div className="vital-item"><span>Weight</span><span>{petInfo.weight}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* CONTROLS */}
        <div className="video-call-controls">
          {receivingCall && !callAccepted ? (
            <div className="incoming-call-actions">
              <button onClick={() => answerCall()} className="accept-btn"><Video size={24} /> Accept</button>
              <button onClick={leaveCall} className="decline-btn"><PhoneOff size={24} /> Decline</button>
            </div>
          ) : (
            <div className="active-call-controls">
              <button onClick={toggleMute} className={`control-btn ${isMuted ? 'active' : ''}`} title="Mute/Unmute">
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              <button onClick={toggleVideo} className={`control-btn ${isVideoOff ? 'active' : ''}`} title="Cam On/Off">
                {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
              </button>
              <button onClick={leaveCall} className="end-call-btn"><PhoneOff size={24} /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCall;