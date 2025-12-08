// NotificationProvider.jsx (current one)
import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
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
  const isOnChatPageRef = useRef(false);

  useEffect(() => {
    // ✅ Set up the global function FIRST before connecting socket
    window.setIsOnChatPage = (value) => {
      console.log('🔄 Setting isOnChatPage to:', value);
      isOnChatPageRef.current = value;
      
      // ✅ Also notify the socket server
      if (socket) {
        socket.emit('setOnChatPage', { onChatPage: value });
      }
    };
  
    window.showToast = showToast;
    
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
      
      // ✅ Send initial chat page status
      newSocket.emit('setOnChatPage', { onChatPage: isOnChatPageRef.current });
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket.IO disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    // ✅ Socket listener is now set up AFTER the ref function
    newSocket.on('newNotification', (notification) => {
      console.log('📩 Received notification:', notification);
      console.log('📍 Current isOnChatPage:', isOnChatPageRef.current);

      // ✅ Check if on chat page
      const isOnChatPage = isOnChatPageRef.current || 
                          window.location.pathname === '/petowner-chat' || 
                          window.location.pathname === '/vet-chat';
      
      // ✅ Don't add message notifications to list if on chat page
      if (notification.notification_type === 'message' && isOnChatPage) {
        console.log('⏭️ Skipping message notification - user is on chat page');
        return; // Don't add to notifications list, don't show toast
      }

      // Add to notifications list (only non-message or when not on chat page)
      setNotifications(prev => [notification, ...prev]);

      // Toast configuration
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
        },
        'message': {
          type: 'message',
          title: 'New Message',
          message: notification.notification_message
        },
        'reminder': {
          type: 'reminder',
          title: '🔔 Reminder',
          message: notification.notification_message
        }
      };

      const toastData = toastConfig[notification.notification_type] || {
        type: 'info',
        title: 'New Notification',
        message: notification.notification_message
      };

      console.log(`🍞 Creating toast for ${notification.notification_type}`);
      setToast(toastData);

      // Play sound
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => console.log('Could not play notification sound'));
      } catch (e) {
        // ignore
      }

      // ✅ Show desktop notification
      // ✅ Show desktop notification (but NOT if on reminders page)
      const isOnRemindersPage = window.location.pathname === '/petowner-reminders';

      if ('Notification' in window && 
          Notification.permission === 'granted' && 
          !isOnRemindersPage) {
        new Notification(toastData.title, {
          body: toastData.message,
          icon: '/paw-icon.png',
          tag: notification.notification_id,
          requireInteraction: notification.notification_type === 'reminder'
        });
      }
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting Socket.IO');
      newSocket.disconnect();
      delete window.showToast;
      delete window.setIsOnChatPage;
    };
  }, []);

  // Request desktop notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleCloseToast = () => {
    setToast(null);
  };

  const showToast = (type, title, message) => {
    // ✅ Check BOTH the ref AND the current URL path
    const isOnChatPage = isOnChatPageRef.current || 
                         window.location.pathname === '/petowner-chat' || 
                         window.location.pathname === '/vet-chat';
    
    if (type === 'message' && isOnChatPage) {
      console.log('⏭️ Skipping manual toast for message (user is on chat page)');
      return;
    }
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