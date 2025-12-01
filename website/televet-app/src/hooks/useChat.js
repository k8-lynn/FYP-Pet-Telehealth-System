//useChat.js
import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const useChat = (chatId, userId, userRole) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
  
    // Initialize socket connection ONCE
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket', 'polling']
      });
  
      socketRef.current.on('connect', () => {
        console.log('✅ Socket connected');
        setIsConnected(true);
        socketRef.current.emit('joinUser', userId);
      });
  
      socketRef.current.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        setIsConnected(false);
      });
    }
  
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId]);
  
  // ✅ NEW: Separate effect for joining/leaving chat rooms
  useEffect(() => {
    if (!socketRef.current || !chatId) return;
  
    console.log('🚪 Joining chat room:', chatId);
    socketRef.current.emit('joinChat', chatId);
  
    return () => {
      console.log('👋 Leaving chat room:', chatId);
      socketRef.current.emit('leaveChat', chatId);
    };
  }, [chatId]);

  // Listen for new messages
useEffect(() => {
    if (!socketRef.current) return;
  
    const handleNewMessage = (message) => {
      console.log('🎉 NEW MESSAGE RECEIVED VIA SOCKET:', message);
      setMessages(prev => [...prev, message]);
    };
  
    socketRef.current.on('newMessage', handleNewMessage);
  
    return () => {
      socketRef.current.off('newMessage', handleNewMessage);
    };
  }, []);

  // Listen for typing indicator
  useEffect(() => {
    if (!socketRef.current || !userId) return;

    const handleTyping = ({ userId: typingUserId, isTyping }) => {
      if (typingUserId !== userId) {
        setIsTyping(isTyping);
      }
    };

    socketRef.current.on('userTyping', handleTyping);

    return () => {
      socketRef.current.off('userTyping', handleTyping);
    };
  }, [userId]);

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
  
    const tempMessage = {
      msg_id: `temp-${Date.now()}`,
      chat_id: chatId,
      sender_id: userId,
      sender_role: userRole,
      msg: messageText.trim(),
      created_at: new Date().toISOString()
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
          msg.msg_id === tempMessage.msg_id ? newMessage : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.msg_id !== tempMessage.msg_id));
    }
  }, [chatId, userId, userRole]);

  // Send typing indicator
  const sendTyping = useCallback((isTyping) => {
    if (socketRef.current && chatId && userId) {
      socketRef.current.emit('typing', { chatId, userId, isTyping });
    }
  }, [chatId, userId]);

  return {
    messages,
    isConnected,
    isTyping,
    fetchMessages,
    sendMessage,
    sendTyping
  };
};