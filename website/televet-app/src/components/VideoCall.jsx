// REWRITTEN VideoCall.jsx — Clean, Correct Call Flow
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Peer from "simple-peer/simplepeer.min.js";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, X, Maximize2, Minimize2 } from 'lucide-react';
import '../styles/VideoCall.css';

/**
 * NEW FLOW IMPLEMENTED:
 * Caller clicks Start Call → UI shows "Calling… Waiting for answer"
 * Receiver gets notification with Accept / Decline
 * Receiver clicks Accept → emits answer but CALL DOES NOT START YET
 * Caller sees "Incoming Call… receiver is accepting"
 * When receiver accepts, then caller peer connects → video loads → call starts
 */

const VideoCall = ({ socket, currentUserId, currentUserName, otherUserId, otherUserName, petInfo, incomingCall, onClose }) => {
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState('');
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPetInfo, setShowPetInfo] = useState(true);
  const [endingMessage, setEndingMessage] = useState(''); // ✅ NEW
  const [showEndingScreen, setShowEndingScreen] = useState(false); // ✅ NEW
  const actualPetInfo = petInfo || incomingCall?.petInfo;

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

/** ---------------------- LEAVE CALL ---------------------- */
const leaveCall = useCallback((reason = 'ended') => {
  // ✅ Notify other user FIRST
  socket.emit('endCall', { to: otherUserId, reason });

  // ✅ Clean up peer connection
  if (connectionRef.current) {
    connectionRef.current.destroy();
  }

  // ✅ Stop all media tracks
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  // ✅ Show ending message based on reason
  const message = reason === 'cancelled' 
    ? 'Call Cancelled' 
    : reason === 'declined'
    ? 'Call Declined'
    : 'Call Ended';
  
  setEndingMessage(message);
  setShowEndingScreen(true);

  // ✅ Wait 1.5 seconds before closing (reduced from 2)
  setTimeout(() => {
    setCallEnded(true);
    onClose();
  }, 1500);
}, [socket, otherUserId, stream, onClose]);

  /** ---------------------- ANSWER CALL ---------------------- */
  const answerCall = useCallback(async () => {
    setReceivingCall(false);
    setCallAccepted(true);
    setCallStarted(true); // ✅ ADD THIS - start call immediately when accepting
  
    let mediaStream = null;
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (myVideo.current) myVideo.current.srcObject = mediaStream;
    } catch (err) {
      console.warn('Media stream error:', err);
    }
  
    const peer = new Peer({ initiator: false, trickle: false, stream: mediaStream });
  
    peer.on('signal', data => {
      socket.emit('answerCall', { signal: data, to: caller });
    });
  
    peer.on('stream', remoteStream => {
      if (userVideo.current) userVideo.current.srcObject = remoteStream;
    });
  
    peer.signal(callerSignal);
  
    connectionRef.current = peer;
  }, [socket, caller, callerSignal]);

  /** ---------------------- CALL USER (INITIATOR) ---------------------- */
const callUser = useCallback(async () => {
  setCallStarted(true);

  let mediaStream = null;
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setStream(mediaStream);
    if (myVideo.current) myVideo.current.srcObject = mediaStream;
  } catch (err) {
    console.warn('Media stream error:', err);
  }

  const peer = new Peer({ initiator: true, trickle: false, stream: mediaStream });

  peer.on('signal', data => {
    socket.emit('callUser', {
      userToCall: String(otherUserId),
      from: String(currentUserId),
      name: currentUserName,
      signalData: data,
      petInfo: petInfo  // ✅ ADD THIS LINE
    });
  });

  peer.on('stream', remoteStream => {
    if (userVideo.current) userVideo.current.srcObject = remoteStream;
  });

  connectionRef.current = peer;
}, [socket, otherUserId, currentUserId, currentUserName, petInfo]); // ✅ ADD petInfo to dependencies

/** ---------------------- SOCKET LISTENERS ---------------------- */
useEffect(() => {
  if (!socket) return;

  // ✅ Update this section to handle petInfo
  if (incomingCall) {
    setReceivingCall(true);
    setCaller(incomingCall.from);
    setCallerSignal(incomingCall.signal);
    // ✅ If petInfo was passed, you could store it here if needed
  }

  const incomingCallHandler = ({ from, name, signal, petInfo: incomingPetInfo }) => { // ✅ ADD petInfo parameter
    setReceivingCall(true);
    setCaller(from);
    setCallerSignal(signal);
    // ✅ If you need to use the incoming petInfo, you can store it in state
    // For now, the parent component should pass it via props
  };

  const callAcceptedHandler = ({ signal }) => {
    setCallAccepted(true);
    if (connectionRef.current) connectionRef.current.signal(signal);
  };

  const callEndedHandler = ({ reason }) => {
    const message = reason === 'cancelled' 
      ? 'Call Cancelled' 
      : reason === 'declined'
      ? 'Call Declined'
      : 'Call Ended';
    
    setEndingMessage(message);
    setShowEndingScreen(true);

    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    setTimeout(() => {
      setCallEnded(true);
      onClose();
    }, 2000);
  };

  socket.on('callUser', incomingCallHandler);
  socket.on('callAccepted', callAcceptedHandler);
  socket.on('callEnded', callEndedHandler);

  return () => {
    socket.off('callUser', incomingCallHandler);
    socket.off('callAccepted', callAcceptedHandler);
    socket.off('callEnded', callEndedHandler);
  };
}, [socket, leaveCall, incomingCall, stream, onClose]);

  /** ---------------------- TOGGLE AUDIO/VIDEO ---------------------- */
  const toggleMute = () => {
    if (!stream) return;
    
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;
    
    const newMutedState = !isMuted;
    audioTrack.enabled = !newMutedState;
    setIsMuted(newMutedState);
    
    console.log('🎤 Audio', newMutedState ? 'MUTED' : 'UNMUTED');
  };
  
  const toggleVideo = () => {
    if (!stream) return;
    
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;
    
    const newVideoOffState = !isVideoOff;
    videoTrack.enabled = !newVideoOffState;
    setIsVideoOff(newVideoOffState);
    
    console.log('📹 Video', newVideoOffState ? 'OFF' : 'ON');
  };
  /** ---------------------- UI ---------------------- */
  return (
    <div className={`video-call-overlay ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="video-call-container">
  
        {/* ✅ ENDING SCREEN */}
        {showEndingScreen && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            color: 'white'
          }}>
            <PhoneOff size={64} style={{ marginBottom: '20px', opacity: 0.7 }} />
            <h2 style={{ fontSize: '32px', fontWeight: '600', margin: 0 }}>
              {endingMessage}
            </h2>
            <p style={{ fontSize: '16px', opacity: 0.7, marginTop: '10px' }}>
              Closing...
            </p>
          </div>
        )}

        {/* HEADER */}
        <div className="video-call-header">
          <div className="call-info">
            <h3>
              {callAccepted && callStarted
                ? `In call with ${otherUserName}`
                : receivingCall
                ? `Incoming call from ${otherUserName}`
                : callStarted
                ? `Calling ${otherUserName}... Waiting for answer`
                : `Ready to Start`}
            </h3>
            <p>{actualPetInfo?.name ? `Patient: ${actualPetInfo.name}` : 'Telehealth Session'}</p>
          </div>

          <div className="header-actions">
            <button onClick={() => setShowPetInfo(!showPetInfo)} className="icon-btn"><Monitor size={20} /></button>
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="icon-btn">
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            {/* ✅ UPDATED: Call leaveCall only if in active call, otherwise just close */}
            <button 
              onClick={() => {
                if (callStarted || receivingCall) {
                  leaveCall('ended');
                } else {
                  // Just close without showing ending screen
                  if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                  }
                  onClose();
                }
              }} 
              className="icon-btn close-btn"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* VIDEO GRID */}
        <div className="video-grid">

          {/* REMOTE VIDEO */}
          <div className="video-container main-video">
            {callAccepted && !callEnded ? (
              <video ref={userVideo} autoPlay playsInline className="video-element" />
            ) : (
              <div className="waiting-screen">
                <div className="avatar-large">{otherUserName?.charAt(0)}</div>
                <h3>
                  {receivingCall
                    ? 'Incoming Call...'
                    : callStarted && !callAccepted
                    ? 'Calling... Waiting for answer'
                    : callStarted && callAccepted
                    ? 'Connecting...'
                    : 'Ready to Start'}
                </h3>
                <p>
                  {receivingCall
                    ? `${otherUserName} is calling you`
                    : callStarted
                    ? ''
                    : 'Click "Start Call" below'}
                </p>
              </div>
            )}
          </div>

          {/* LOCAL VIDEO */}
          <div className="video-container local-video">
          <video 
            ref={myVideo} 
            autoPlay 
            playsInline 
            muted 
            className={`video-element ${isVideoOff ? 'hidden' : ''}`} 
          />
          {(isVideoOff || !stream) && (
            <div className="video-placeholder" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1a1a1a'
            }}>
              <VideoOff size={32} style={{ opacity: 0.5 }} />
            </div>
          )}
          <div className="video-label">You</div>
          {/* ✅ Add visual indicators */}
          {isMuted && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.9)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              <MicOff size={14} style={{ verticalAlign: 'middle' }} /> Muted
            </div>
          )}
        </div>

          {/* PET INFO */}
          {showPetInfo && actualPetInfo && (
            <div className="video-pet-info">
              <h4>Patient Info</h4>
              <div className="pet-info-item">
                <span className="pet-emoji">{actualPetInfo.image || '🐾'}</span>
                <div>
                  <p className="pet-name">{actualPetInfo.name}</p>
                  <p className="pet-details">{actualPetInfo.species} • {actualPetInfo.breed}</p>
                </div>
              </div>
              <div className="pet-vitals">
                <div className="vital-item"><span>Age</span><span>{actualPetInfo.age}</span></div>
                <div className="vital-item"><span>Weight</span><span>{actualPetInfo.weight}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* CONTROLS */}
        <div className="video-call-controls">
          {receivingCall && !callAccepted ? (
            <div className="incoming-call-actions">
              <button onClick={answerCall} className="accept-btn">
                <Video size={24} /> Accept
              </button>
              <button onClick={() => leaveCall('declined')} className="decline-btn">
                <PhoneOff size={24} /> Decline
              </button>
            </div>
          ) : !callStarted ? (
            <button onClick={callUser} className="start-call-btn">
              <Video size={24} /> Start Call
            </button>
          ) : callStarted && callAccepted ? (
            <div className="active-call-controls">
              <button 
                onClick={toggleMute} 
                className={`control-btn ${isMuted ? 'active' : ''}`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              <button 
                onClick={toggleVideo} 
                className={`control-btn ${isVideoOff ? 'active' : ''}`}
                title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
              </button>
              <button onClick={() => leaveCall('ended')} className="end-call-btn">
                <PhoneOff size={24} />
              </button>
            </div>
          ) : (
            <div className="waiting-controls">
              <button onClick={() => leaveCall('cancelled')} className="end-call-btn">
                <PhoneOff size={24} /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCall;