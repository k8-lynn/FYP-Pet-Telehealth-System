//IncomingCallNotification.jsx
import React, { useState, useEffect } from 'react';
import { Video, PhoneOff } from 'lucide-react';
import '../styles/IncomingCallNotification.css';

const IncomingCallNotification = ({ callerName, onAccept, onDecline, callCancelled = false }) => {
  const [cancelled, setCancelled] = useState(callCancelled);

  useEffect(() => {
    setCancelled(callCancelled);
  }, [callCancelled]);

  if (cancelled) {
    return (
      <div className="incoming-call-notification call-cancelled">
        <div className="call-cancelled-content">
          <PhoneOff size={32} className="call-cancelled-icon" />
          <h4 className="call-cancelled-title">Call Cancelled</h4>
          <p className="call-cancelled-message">{callerName} cancelled the call</p>
        </div>
      </div>
    );
  }

  return (
    <div className="incoming-call-notification">
      <div className="call-header">
        <div className="caller-avatar">
          {callerName?.charAt(0)}
        </div>
        <div className="caller-info">
          <h4 className="call-title">Incoming Video Call</h4>
          <p className="caller-name">{callerName} is calling...</p>
        </div>
      </div>
      
      <div className="call-actions">
        <button onClick={onAccept} className="call-btn call-accept">
          <Video size={18} />
          Accept
        </button>
        <button onClick={onDecline} className="call-btn call-decline">
          <PhoneOff size={18} />
          Decline
        </button>
      </div>
    </div>
  );
};

export default IncomingCallNotification;