///components/VideoCall.jsx
import React, { useRef, useEffect, useState } from 'react';
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
  petInfo, // Pet information to display
  onClose 
}) => {
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState('');
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPetInfo, setShowPetInfo] = useState(true);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  

  useEffect(() => {
    // Get user media
    if (!socket) return;

    // Listen for incoming calls
    socket.on('callUser', ({ from, signal }) => {
      setReceivingCall(true);
      setCaller(from);
      setCallerSignal(signal);
    });

    socket.on('callEnded', () => {
      handleCallEnd();
    });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      socket.off('callUser');
      socket.off('callEnded');
    };
  }, [socket]); // eslint-disable-line

  const callUser = async () => {
    // Request media access when user clicks "Start Call"
    if (!stream) {
      try {
        // Check if permissions were previously denied
        const permissions = await navigator.permissions.query({ name: 'camera' });
        
        if (permissions.state === 'denied') {
          alert('Camera access was denied. Please enable it in your browser settings:\n\n1. Click the lock icon in the address bar\n2. Allow camera and microphone\n3. Refresh the page');
          return;
        }
  
        const currentStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
        
        // Now proceed with the call
        initiateCall(currentStream);
      } catch (err) {
        console.error('Error accessing media devices:', err);
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          alert('Camera and microphone access denied. Please:\n\n1. Click the camera icon in your browser\'s address bar\n2. Select "Always allow"\n3. Try again');
        } else if (err.name === 'NotFoundError') {
          alert('No camera or microphone found. Please check your devices.');
        } else {
          alert('Could not access camera/microphone. Please check browser permissions and try again.');
        }
        return;
      }
    } else {
      initiateCall(stream);
    }
  };
  
  const initiateCall = (currentStream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: currentStream,
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
  
    peer.on('stream', (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    });
  
    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });
  
    connectionRef.current = peer;
  };

  const answerCall = async () => {
    // Request media access when user answers
    if (!stream) {
      try {
        // Check if permissions were previously denied
        const permissions = await navigator.permissions.query({ name: 'camera' });
        
        if (permissions.state === 'denied') {
          alert('Camera access was denied. Please enable it in your browser settings:\n\n1. Click the lock icon in the address bar\n2. Allow camera and microphone\n3. Refresh the page');
          return;
        }
  
        const currentStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
        
        // Now answer the call
        proceedAnswerCall(currentStream);
      } catch (err) {
        console.error('Error accessing media devices:', err);
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          alert('Camera and microphone access denied. Please:\n\n1. Click the camera icon in your browser\'s address bar\n2. Select "Always allow"\n3. Try again');
        } else if (err.name === 'NotFoundError') {
          alert('No camera or microphone found. Please check your devices.');
        } else {
          alert('Could not access camera/microphone. Please check browser permissions and try again.');
        }
        return;
      }
    } else {
      proceedAnswerCall(stream);
    }
  };
  
  const proceedAnswerCall = (currentStream) => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: currentStream,
    });
  
    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: caller });
    });
  
    peer.on('stream', (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    });
  
    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    socket.emit('endCall', { to: otherUserId });
    handleCallEnd();
  };

  const handleCallEnd = () => {
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCallEnded(true);
    setTimeout(() => onClose(), 1000);
  };

  const toggleMute = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`video-call-overlay ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="video-call-container">
        {/* Header */}
        <div className="video-call-header">
          <div className="call-info">
            <h3>{callAccepted ? `In call with ${otherUserName}` : 'Video Call'}</h3>
            <p>{petInfo ? `Regarding ${petInfo.name}` : ''}</p>
          </div>
          <div className="header-actions">
            <button onClick={() => setShowPetInfo(!showPetInfo)} className="icon-btn">
              <Monitor size={20} />
            </button>
            <button onClick={toggleFullscreen} className="icon-btn">
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button onClick={onClose} className="icon-btn close-btn">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Video Grid */}
        <div className="video-grid">
          {/* Remote Video (Other User) */}
          <div className="video-container main-video">
            {callAccepted && !callEnded ? (
              <>
                <video ref={userVideo} autoPlay playsInline className="video-element" />
                <div className="video-label">{otherUserName}</div>
              </>
            ) : (
              <div className="waiting-screen">
                <div className="avatar-large">{otherUserName?.charAt(0)}</div>
                <h3>{receivingCall ? 'Incoming call...' : 'Calling...'}</h3>
                <p>{otherUserName}</p>
              </div>
            )}
          </div>

          {/* Local Video (Self) */}
          <div className="video-container local-video">
            <video 
              ref={myVideo} 
              autoPlay 
              playsInline 
              muted 
              className="video-element"
            />
            <div className="video-label">You</div>
          </div>

          {/* Pet Info Panel */}
          {showPetInfo && petInfo && (
            <div className="video-pet-info">
              <h4>Patient Information</h4>
              <div className="pet-info-item">
                <span className="pet-emoji">{petInfo.image}</span>
                <div>
                  <p className="pet-name">{petInfo.name}</p>
                  <p className="pet-details">{petInfo.species} • {petInfo.breed}</p>
                </div>
              </div>
              <div className="pet-vitals">
                <div className="vital-item">
                  <span className="vital-label">Age</span>
                  <span className="vital-value">{petInfo.age}</span>
                </div>
                <div className="vital-item">
                  <span className="vital-label">Weight</span>
                  <span className="vital-value">{petInfo.weight}</span>
                </div>
              </div>
              {petInfo.medications && petInfo.medications.length > 0 && (
                <div className="pet-medications">
                  <p className="info-label">Active Medications:</p>
                  {petInfo.medications.map((med, idx) => (
                    <p key={idx} className="info-value">💊 {med}</p>
                  ))}
                </div>
              )}
              {petInfo.allergies && petInfo.allergies.length > 0 && (
                <div className="pet-allergies">
                  <p className="info-label">Allergies:</p>
                  {petInfo.allergies.map((allergy, idx) => (
                    <span key={idx} className="allergy-tag">⚠️ {allergy}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Call Controls */}
        <div className="video-call-controls">
          {receivingCall && !callAccepted ? (
            <div className="incoming-call-actions">
              <button onClick={answerCall} className="accept-btn">
                <Video size={24} />
                Accept
              </button>
              <button onClick={leaveCall} className="decline-btn">
                <PhoneOff size={24} />
                Decline
              </button>
            </div>
          ) : callAccepted && !callEnded ? (
            <div className="active-call-controls">
              <button 
                onClick={toggleMute} 
                className={`control-btn ${isMuted ? 'active' : ''}`}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              <button 
                onClick={toggleVideo} 
                className={`control-btn ${isVideoOff ? 'active' : ''}`}
              >
                {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
              </button>
              <button onClick={leaveCall} className="end-call-btn">
                <PhoneOff size={24} />
              </button>
            </div>
          ) : !receivingCall ? (
            <button onClick={callUser} className="start-call-btn">
              <Video size={24} />
              Start Call
            </button>
          ) : null}
        </div>

        {callEnded && (
          <div className="call-ended-overlay">
            <h3>Call Ended</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall;