//GlobalIncomingCall.jsx
import React from 'react';
import IncomingCallNotification from './IncomingCallNotification';
import { useNotification } from './NotificationProvider';
import VideoCall from './VideoCall';

const GlobalIncomingCall = ({ onAccept, onSetShowVideoCall }) => {
  const { incomingCall, setIncomingCall, socket } = useNotification();
  const [callCancelled, setCallCancelled] = React.useState(false);
  const [showVideoCall, setShowVideoCall] = React.useState(false);

  // ✅ ADD THIS DEBUG LOG
  React.useEffect(() => {
    if (incomingCall) {
      console.log('📞 GlobalIncomingCall - incomingCall:', incomingCall);
      console.log('📞 GlobalIncomingCall - petInfo:', incomingCall.petInfo);
    }
  }, [incomingCall]);

  React.useEffect(() => {
    if (!incomingCall) return;

    const audio = new Audio('/ringtone.mp3');
    audio.loop = true;
    audio.play().catch(err => console.log('Could not play ringtone:', err));
    window.callRingtone = audio;

    return () => {
      if (window.callRingtone) {
        window.callRingtone.pause();
        window.callRingtone = null;
      }
    };
  }, [incomingCall]);

  const handleAccept = () => {
    if (window.callRingtone) {
      window.callRingtone.pause();
      window.callRingtone = null;
    }
    
    // ✅ ADD THIS DEBUG LOG
    console.log('📞 handleAccept - passing petInfo:', incomingCall.petInfo);
    
    onAccept?.(incomingCall);
    onSetShowVideoCall?.(true);
    setShowVideoCall(true);
  };

  const handleDecline = () => {
    if (window.callRingtone) {
      window.callRingtone.pause();
      window.callRingtone = null;
    }
    
    const { socket } = window;
    if (socket && incomingCall) {
      socket.emit('endCall', { to: incomingCall.from, reason: 'declined' });
    }
    
    setIncomingCall(null);
    setCallCancelled(false);
  };

  React.useEffect(() => {
    const handleCallEnded = ({ reason }) => {
      if (window.callRingtone) {
        window.callRingtone.pause();
        window.callRingtone = null;
      }

      if (incomingCall && reason === 'cancelled') {
        setCallCancelled(true);
        setTimeout(() => {
          setIncomingCall(null);
          setCallCancelled(false);
        }, 3000);
      } else {
        setIncomingCall(null);
      }
    };

    const { socket } = window;
    if (socket) {
      socket.on('callEnded', handleCallEnded);
      return () => socket.off('callEnded', handleCallEnded);
    }
  }, [incomingCall, setIncomingCall]);

  if (!incomingCall) return null;

  return (
    <>
      {!showVideoCall && (
        <IncomingCallNotification
          callerName={incomingCall.name}
          onAccept={handleAccept}
          onDecline={handleDecline}
          callCancelled={callCancelled}
        />
      )}

      {showVideoCall && incomingCall && (
        <VideoCall
          socket={socket}
          currentUserId={String(sessionStorage.getItem('userid'))}
          currentUserName={`${sessionStorage.getItem('firstName') || ''} ${sessionStorage.getItem('lastName') || ''}`}
          otherUserId={String(incomingCall.from)}
          otherUserName={incomingCall.name}
          petInfo={incomingCall.petInfo} // ✅ This should now have data
          incomingCall={incomingCall}
          onClose={() => {
            setShowVideoCall(false);
            setIncomingCall(null);
          }}
        />
      )}
    </>
  );
};

export default GlobalIncomingCall;