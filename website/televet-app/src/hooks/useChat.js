//useChat.js
import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const useChat = (chatId, userId, userRole) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef(null);

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
          msg.msg_id === tempId ? newMessage : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.msg_id !== tempId));
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