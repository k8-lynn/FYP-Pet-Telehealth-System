//useChat.js
import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = 'https://fyp-pet-telehealth-system.onrender.com';

export const useChat = (chatId, userId, userRole) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef(null);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [otherUserId, setOtherUserId] = useState(null);
  const [, setIsInChatView] = useState(false);

  // ✅ Initialize socket connection ONCE
  useEffect(() => {
    if (!userId) return;

    if (!socketRef.current) {
      console.log('🔌 Initializing socket for userId:', userId);
      
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket', 'polling']
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Socket connected, ID:', socketRef.current.id);
        setIsConnected(true);
        socketRef.current.emit('joinUser', userId);
        console.log('📤 Emitted joinUser event for userId:', userId);
      });

      socketRef.current.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        setIsConnected(false);
      });
      
      socketRef.current.on('welcome', (data) => {
        console.log('👋 Received welcome:', data);
      });

      socketRef.current.on('joinedChat', (data) => {
        console.log('✅ Confirmed joined chat room:', data.chatId);
      });

      // In the handleNewMessage function, change it to:
      const handleNewMessage = (message) => {
        console.log('🎉 NEW MESSAGE RECEIVED VIA SOCKET:', message);
        console.log('🔍 Message details:', { 
          messageSenderId: message.sender_id, 
          messageSenderIdType: typeof message.sender_id,
          currentUserId: userId, 
          currentUserIdType: typeof userId,
          messageType: message.msg_type,
          msgId: message.msg_id
        });
        
        setMessages(prev => {
          // ✅ ALWAYS check if message already exists first (regardless of sender)
          const exists = prev.some(msg => msg.msg_id === message.msg_id);
          
          if (exists) {
            console.log('⚠️ Message already exists in state, skipping duplicate');
            return prev;
          }
          
          // ✅ If it's your own message and doesn't exist yet, add it
          // (This handles the case where socket arrives before local state update completes)
          if (String(message.sender_id) === String(userId)) {
            console.log('✅ Adding own message from socket');
            return [...prev, message];
          }
          
          // ✅ For other user's messages: add them
          console.log('✅ Adding new message from other user to state');
          return [...prev, message];
        });
      };

      socketRef.current.on('newMessage', handleNewMessage);
      console.log('✅ newMessage listener attached');

      // Add this after the newMessage listener setup
      const handleMessagesRead = ({ userId: readByUserId }) => {
        console.log('📖 Received messagesRead event for user:', readByUserId);
        if (String(readByUserId) !== String(userId)) {
          console.log('✅ Updating messages to read status');
          setMessages(prev => 
            prev.map(msg => 
              String(msg.sender_id) === String(userId) ? { ...msg, is_read: 'yes' } : msg
            )
          );
        }
      };

      socketRef.current.on('messagesRead', handleMessagesRead);
      console.log('✅ messagesRead listener attached');

      // ✅ ATTACH TYPING LISTENER HERE TOO
      const handleTyping = ({ userId: typingUserId, isTyping }) => {
        if (typingUserId !== userId) {
          setIsTyping(isTyping);
        }
      };

      socketRef.current.on('userTyping', handleTyping);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId]); // Only re-run if userId changes

// Fetch other user's online status
  useEffect(() => {
    const fetchOtherUserStatus = async () => {
      if (!chatId) return;
      
      try {
        // Get chat details to find the other user
        const chatResponse = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/chat/${chatId}/details`);
        const chatData = await chatResponse.json();
        
        // Determine other user's ID based on current user's role
        const otherUserId = userRole === 'pp' ? chatData.vt_usr_id : chatData.pp_usr_id;
        setOtherUserId(otherUserId);
        
        // Add this right after line where you do: setOtherUserId(otherUserId);
        console.log('👤 Other user ID set to:', otherUserId);

        // Force refresh the status
        const statusResponse = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/user/online-status/${otherUserId}`);
        const statusData = await statusResponse.json();
        console.log('📊 Initial status for other user:', statusData);
        setOtherUserOnline(statusData.is_online);
      } catch (error) {
        console.error('Error fetching user status:', error);
      }
    };
    
    fetchOtherUserStatus();
  }, [chatId, userRole]);

  // Listen for status changes
  useEffect(() => {
    if (!socketRef.current || !otherUserId) return;
    
    // Replace the existing handleStatusChange function with this:
    const handleStatusChange = ({ usr_id, is_online }) => {
      console.log('🔄 Status change received:', { usr_id, is_online, otherUserId });
      
      // Convert both to strings for comparison
      if (String(usr_id) === String(otherUserId)) {
        const isOnline = is_online === 'yes' || is_online === true;
        console.log('✅ Updating other user online status to:', isOnline);
        setOtherUserOnline(isOnline);
      }
    };
    
    socketRef.current.on('userStatusChanged', handleStatusChange);
    
    return () => {
      if (socketRef.current) {
        socketRef.current.off('userStatusChanged', handleStatusChange);
      }
    };
  }, [otherUserId]);
  
  // ✅ Join/leave chat rooms when chatId changes
  useEffect(() => {
    if (!socketRef.current || !chatId) return;

    const joinRoom = () => {
      if (socketRef.current.connected) {
        console.log('🚪 Joining chat room:', chatId);
        socketRef.current.emit('joinChat', chatId);
      } else {
        console.log('⚠️ Socket not connected yet, waiting...');
        socketRef.current.once('connect', () => {
          console.log('✅ Now connected, joining chat room:', chatId);
          socketRef.current.emit('joinChat', chatId);
        });
      }
    };

    joinRoom();

    return () => {
      if (socketRef.current && socketRef.current.connected) {
        console.log('👋 Leaving chat room:', chatId);
        socketRef.current.emit('leaveChat', chatId);
      }
    };
  }, [chatId]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    
    try {
      const response = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/chat/${chatId}/messages`);
      const data = await response.json();
      console.log('📨 Fetched messages:', data);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [chatId]);

  // Send message
  const sendMessage = useCallback(async (messageText) => {
    if (!chatId || !messageText.trim() || !userId) return;
  
    try {
      const response = await fetch('https://fyp-pet-telehealth-system.onrender.com/api/chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          sender_id: userId,
          sender_role: userRole,
          msg: messageText.trim()
        })
      });
      
      const newMessage = await response.json();
      
      // ✅ DON'T add to state here - let socket event handle it
      console.log('✅ Message sent successfully:', newMessage.msg_id);
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [chatId, userId, userRole]);

  // Mark messages as read
const markAsRead = useCallback(async () => {
  if (!chatId || !userId) return;
  
  try {
    const response = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/chat/${chatId}/mark-read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usr_id: userId })
    });

    if (response.ok) {
      console.log('✅ Messages marked as read');
      // ✅ Emit socket event that messages were read
      if (socketRef.current) {
        socketRef.current.emit('messagesRead', { chatId, userId });
      }
      fetchMessages(); // Refresh to update read status
    }
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
  }
}, [chatId, userId, fetchMessages]);

  // Send typing indicator
  const sendTyping = useCallback((isTyping) => {
    if (socketRef.current && chatId && userId) {
      socketRef.current.emit('typing', { chatId, userId, isTyping });
    }
  }, [chatId, userId]);

  // Add this function before the return statement:
  const setActiveChat = useCallback((active) => {
    setIsInChatView(active);
    if (socketRef.current && chatId) {
      socketRef.current.emit('setActiveChat', { chatId, active });
    }
  }, [chatId]);
  
  return {
    messages,
    setMessages,
    isConnected,
    isTyping,
    otherUserOnline,
    fetchMessages,
    sendMessage,
    sendTyping,
    markAsRead,  // ✅ Add this
    setActiveChat
  };
};