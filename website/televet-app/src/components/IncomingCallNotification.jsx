import React from 'react';
import { Video, PhoneOff } from 'lucide-react';

const IncomingCallNotification = ({ callerName, onAccept, onDecline }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      padding: '20px',
      zIndex: 10000,
      minWidth: '300px',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          {callerName?.charAt(0)}
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
            Incoming Video Call
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>
            {callerName} is calling...
          </p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onAccept}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: '#10b981',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Video size={18} />
          Accept
        </button>
        <button
          onClick={onDecline}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: '#ef4444',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <PhoneOff size={18} />
          Decline
        </button>
      </div>
    </div>
  );
};

export default IncomingCallNotification;