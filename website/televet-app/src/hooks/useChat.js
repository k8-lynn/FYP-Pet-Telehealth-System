//useChat.js
import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const useChat = (chatId, userId, userRole) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef(null);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [otherUserId, setOtherUserId] = useState(null);
  const [isInChatView, setIsInChatView] = useState(false);

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
        console.log('🔍 Comparing:', { 
          messageSenderId: message.sender_id, 
          messageSenderIdType: typeof message.sender_id,
          currentUserId: userId, 
          currentUserIdType: typeof userId 
        });
        
        setMessages(prev => {
          // ✅ Convert both to strings for comparison
          if (String(message.sender_id) === String(userId)) {
            console.log('⚠️ Ignoring own message from socket (already added optimistically)');
            return prev;
          }
          
          // For receivers: check if message already exists by msg_id
          const exists = prev.some(msg => msg.msg_id === message.msg_id);
          
          if (exists) {
            console.log('⚠️ Message already exists, skipping duplicate');
            return prev;
          }
          
          console.log('✅ Adding new message to state');
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
        const chatResponse = await fetch(`http://localhost:5000/api/chat/${chatId}/details`);
        const chatData = await chatResponse.json();
        
        // Determine other user's ID based on current user's role
        const otherUserId = userRole === 'pp' ? chatData.vt_usr_id : chatData.pp_usr_id;
        setOtherUserId(otherUserId);
        
        // Fetch their online status
        const statusResponse = await fetch(`http://localhost:5000/api/user/online-status/${otherUserId}`);
        const statusData = await statusResponse.json();
        
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
    
    const handleStatusChange = ({ usr_id, is_online }) => {
      // Only update if it's the other user in this chat
      if (String(usr_id) === String(otherUserId)) {
        setOtherUserOnline(is_online === 'yes');
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
      const response = await fetch(`http://localhost:5000/api/chat/${chatId}/messages`);
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
  
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      msg_id: tempId,
      chat_id: chatId,
      sender_id: userId,
      sender_role: userRole,
      msg: messageText.trim(),
      created_at: new Date().toISOString(),
      is_read: 'no'
    };

    setMessages(prev => [...prev, tempMessage]);
  
    try {
      const response = await fetch('http://localhost:5000/api/chat/send-message', {
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
      
      setMessages(prev => 
        prev.map(msg => 
          msg.msg_id === tempId ? newMessage : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.msg_id !== tempId));
    }
  }, [chatId, userId, userRole]);

  // Mark messages as read
const markAsRead = useCallback(async () => {
  if (!chatId || !userId) return;
  
  try {
    await fetch(`http://localhost:5000/api/chat/${chatId}/mark-read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usr_id: userId })
    });
    
    // ✅ Emit socket event so other user's message list updates
    if (socketRef.current) {
      socketRef.current.emit('messagesRead', { chatId, userId });
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}, [chatId, userId]);

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