// NotificationProvider.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import ToastContainer from './ToastContainer';

const NotificationContext = createContext();

// Custom hook to use notifications
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // ✅ Use sessionStorage with correct key
    const usr_id = sessionStorage.getItem('userid');
    const userType = sessionStorage.getItem('userType');

    // Only connect if user is logged in
    if (!usr_id) {
      console.log('⚠️ No userid found in sessionStorage, skipping socket connection');
      return;
    }

    console.log('🔌 Connecting to Socket.IO for userid:', usr_id, 'userType:', userType);

    // Connect to your backend Socket.IO server
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket.IO connected:', newSocket.id);
      
      // Join user-specific room
      newSocket.emit('joinUser', usr_id);
      console.log('👤 Joined user room:', `user_${usr_id}`);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket.IO disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    // Listen for new notifications
    newSocket.on('newNotification', (notification) => {
      console.log('📩 Received notification:', notification);

      // Add to notifications list
      setNotifications(prev => [notification, ...prev]);

      // Show toast based on notification type
      const toastConfig = {
        'approved': {
          type: 'success',
          title: '✅ Appointment Approved!',
          message: notification.notification_message
        },
        'pending': {
          type: 'pending',
          title: '⏳ Appointment Pending',
          message: notification.notification_message
        },
        'assigned': {
          type: 'info',
          title: '👨‍⚕️ Vet Assigned',
          message: notification.notification_message
        },
        'cancelled': {
          type: 'error',
          title: '❌ Appointment Cancelled',
          message: notification.notification_message
        },
        'completed': {
          type: 'success',
          title: '✅ Appointment Completed',
          message: notification.notification_message
        }
      };

      const toastData = toastConfig[notification.notification_type] || {
        type: 'info',
        title: 'New Notification',
        message: notification.notification_message
      };

      setToast(toastData);
      console.log(`🍞 Toast created for ${notification.notification_type}:`, toastData);

      // Play notification sound (optional)
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => console.log('Could not play notification sound'));
      // eslint-disable-next-line no-unused-vars
      } catch (e) {
        // ignore sound error
      }
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting Socket.IO');
      newSocket.disconnect();
    };
  }, []); // Empty dependency array - only run once on mount

  const handleCloseToast = () => {
    setToast(null);
  };

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  return (
    <NotificationContext.Provider value={{ 
      setToast: showToast, 
      socket, 
      notifications,
      setNotifications 
    }}>
      {children}
      <ToastContainer toast={toast} onClose={handleCloseToast} />
    </NotificationContext.Provider>
  );
};