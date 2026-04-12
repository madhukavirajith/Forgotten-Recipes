// client/src/components/Chat.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import './Chat.css';

// Icons (keep your existing imports)
import { 
  FaComment, FaUserMd, FaUtensils, FaPaperPlane, FaTimes,
  FaMinus, FaExpand, FaCompress, FaSmile, FaPaperclip,
  FaCheck, FaCheckDouble, FaSpinner, FaUserCircle,
  FaShieldAlt, FaUsers, FaHistory, FaInfoCircle,
  FaArrowLeft
} from 'react-icons/fa';

// Helper functions (decodeJWT, formatTime, formatDate) – same as before
const decodeJWT = (token) => {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload)) || {};
  } catch {
    return {};
  }
};

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (date) => {
  const today = new Date();
  const msgDate = new Date(date);
  if (msgDate.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (msgDate.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const API_BASE = process.env.REACT_APP_API_URL || '';
const API_ROOT = API_BASE ? (API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`) : '/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || API_BASE || 'http://localhost:5000';

// Role permissions (unchanged)
const CHAT_PERMISSIONS = {
  visitor: { allowedRoles: ['dietician', 'headchef'], label: 'Visitor', icon: <FaUserCircle />, color: '#10b981', description: 'Get help with recipes and nutrition' },
  dietician: { allowedRoles: ['visitor', 'admin'], label: 'Dietician', icon: <FaUserMd />, color: '#10b981', description: 'Nutrition advice and dietary guidance' },
  headchef: { allowedRoles: ['visitor', 'admin'], label: 'Head Chef', icon: <FaUtensils />, color: '#f59e0b', description: 'Recipe approvals and culinary expertise' },
  admin: { allowedRoles: ['headchef', 'dietician'], label: 'Admin', icon: <FaShieldAlt />, color: '#8b5cf6', description: 'Platform management and support' }
};

const CHAT_SUGGESTIONS = {
  visitor: [
    { text: "I need help with a recipe", icon: "🍳" },
    { text: "Can you suggest healthy alternatives?", icon: "🥗" },
    { text: "How do I reduce spice in a curry?", icon: "🌶️" },
    { text: "What are authentic Sri Lankan ingredients?", icon: "🇱🇰" }
  ],
  dietician: [
    { text: "Review a recipe for nutritional value", icon: "📊" },
    { text: "Suggest healthy modifications", icon: "🥬" }
  ],
  headchef: [
    { text: "Review pending recipe submission", icon: "📝" },
    { text: "Discuss recipe authenticity", icon: "✨" }
  ],
  admin: [
    { text: "User reported issue", icon: "⚠️" },
    { text: "Platform feedback", icon: "💬" }
  ]
};

// ----------------------- Main Component -----------------------
const Chat = () => {
  const token = localStorage.getItem('token');
  const payload = useMemo(() => (token ? decodeJWT(token) : {}), [token]);
  const userRole = payload?.role || localStorage.getItem('role') || 'visitor';
  const userId = payload?.id || payload?._id || localStorage.getItem('userId');
  const userName = payload?.name || 'Guest';

  const [availableRecipients, setAvailableRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [typing, setTyping] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [recentConversations, setRecentConversations] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef(null);
  const scrollerRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const userPermissions = CHAT_PERMISSIONS[userRole] || CHAT_PERMISSIONS.visitor;
  const suggestions = CHAT_SUGGESTIONS[userRole] || CHAT_SUGGESTIONS.visitor;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollerRef.current) {
        scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
      }
    }, 100);
  }, []);

  // ---------- API calls ----------
  const fetchAvailableRecipients = useCallback(async () => {
    try {
      const res = await fetch(`${API_ROOT}/chat/available-recipients`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const enriched = data.map(r => ({ ...r, isOnline: onlineStatus[r.id] || false }));
      setAvailableRecipients(enriched);
    } catch (err) {
      console.error('Error fetching recipients:', err);
    }
  }, [token, onlineStatus]);

  const fetchRecentConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API_ROOT}/chat/recent-conversations`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRecentConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  }, [token]);

  const loadHistory = async (convId) => {
    try {
      const res = await fetch(`${API_ROOT}/chat/history/${convId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data);
      scrollToBottom();
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  const markAsRead = async (convId) => {
    if (!convId) return;
    try {
      await fetch(`${API_ROOT}/chat/${convId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ userId })
      });
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const startConversation = async (recipientId, recipientRole, recipientName) => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_ROOT}/chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ userId, userRole, userName, recipientId, recipientRole, recipientName })
      });
      if (!res.ok) throw new Error();
      const convo = await res.json();
      setConversationId(convo._id);
      setSelectedRecipient({ id: recipientId, role: recipientRole, name: recipientName });
      await loadHistory(convo._id);
      if (socketRef.current && socketConnected) {
        socketRef.current.emit('joinRoom', { conversationId: convo._id });
      }
      await markAsRead(convo._id);
    } catch (err) {
      console.error('Error starting conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- Back to recipient list ----------
  const goBack = () => {
    setSelectedRecipient(null);
    setConversationId(null);
    setMessages([]);
  };

  // ---------- Socket handlers ----------
  const handleIncomingMessage = useCallback((msg) => {
    if (msg.conversation === conversationId) {
      setMessages(prev => [...prev, msg]);
      scrollToBottom();
      if (!isOpen || isMinimized) setUnreadCount(prev => prev + 1);
    }
  }, [conversationId, isOpen, isMinimized, scrollToBottom]);

  const handleTyping = useCallback((data) => {
    if (data.conversation === conversationId && data.senderId !== userId) {
      setTyping(data.isTyping);
    }
  }, [conversationId, userId]);

  const handleOnlineStatus = useCallback((data) => {
    setOnlineStatus(prev => ({ ...prev, [data.userId]: data.isOnline }));
    fetchAvailableRecipients();
  }, [fetchAvailableRecipients]);

  // ---------- Socket initialization ----------
  useEffect(() => {
    if (!userId) return;

    if (!socketRef.current) {
      const socket = io(SOCKET_URL, { transports: ['websocket'], withCredentials: true });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Socket connected');
        setSocketConnected(true);
        socket.emit('join', { userId, userRole });
      });

      socket.on('message', handleIncomingMessage);
      socket.on('typing', handleTyping);
      socket.on('status', handleOnlineStatus);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId, userRole, handleIncomingMessage, handleTyping, handleOnlineStatus]);

  // Fetch data when socket connects
  useEffect(() => {
    if (socketConnected) {
      fetchAvailableRecipients();
      fetchRecentConversations();
    }
  }, [socketConnected, fetchAvailableRecipients, fetchRecentConversations]);

  // Join conversation room when conversationId changes
  useEffect(() => {
    if (!conversationId || !socketRef.current || !socketConnected) return;
    socketRef.current.emit('joinRoom', { conversationId });
    markAsRead(conversationId);
    return () => {
      socketRef.current?.emit('leaveRoom', { conversationId });
    };
  }, [conversationId, socketConnected]);

  // ---------- Send message (optimistic update) ----------
  const sendMessage = useCallback(() => {
    if (!text.trim() || !conversationId || !socketRef.current) return;

    // Optimistically add message to UI
    const tempId = Date.now().toString();
    const optimisticMsg = {
      _id: tempId,
      conversation: conversationId,
      text: text.trim(),
      senderId: userId,
      senderRole: userRole,
      senderName: userName,
      read: false,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom();

    // Send via socket
    socketRef.current.emit('message', {
      conversationId,
      text: text.trim(),
      senderId: userId,
      senderRole: userRole,
      senderName: userName,
    });

    setText('');
    sendTypingIndicator(false);
  }, [text, conversationId, userId, userRole, userName, scrollToBottom]);

  const sendTypingIndicator = useCallback((isTyping) => {
    if (!conversationId || !socketRef.current) return;
    socketRef.current.emit('typing', { conversationId, userId, userRole, isTyping });
  }, [conversationId, userId, userRole]);

  const handleInputChange = (e) => {
    setText(e.target.value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (e.target.value.trim()) {
      sendTypingIndicator(true);
      typingTimeoutRef.current = setTimeout(() => sendTypingIndicator(false), 1000);
    } else {
      sendTypingIndicator(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // UI toggles
  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
      markAsRead(conversationId);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) {
      setUnreadCount(0);
      markAsRead(conversationId);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) setIsMinimized(false);
  };

  const getRecipientInfo = () => {
    if (!selectedRecipient) return null;
    const perm = CHAT_PERMISSIONS[selectedRecipient.role] || CHAT_PERMISSIONS.visitor;
    return {
      icon: perm.icon,
      name: selectedRecipient.name || perm.label,
      color: perm.color,
      description: perm.description
    };
  };

  const recipientInfo = getRecipientInfo();
  const isOnline = onlineStatus[selectedRecipient?.id];

  if (!userId) {
    return (
      <div className="chat-widget">
        <button className="chat-toggle-btn" onClick={() => alert('Please login to chat')}>
          <FaComment /> <span>Chat</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`chat-widget ${isOpen ? 'open' : ''} ${isExpanded ? 'expanded' : ''} ${isMinimized ? 'minimized' : ''}`}>
      {/* Header */}
      <div className="chat-header" onClick={!isOpen ? toggleChat : undefined}>
        <div className="chat-header-info">
          <div className="chat-avatar">
            {selectedRecipient ? recipientInfo?.icon : <FaComment />}
            {selectedRecipient && isOnline && <span className="online-dot"></span>}
          </div>
          <div className="chat-header-text">
            <h3>{selectedRecipient ? `Chat with ${recipientInfo?.name}` : `${userPermissions.label} Support`}</h3>
            <p className="chat-status">
              {selectedRecipient ? (
                isOnline ? <><span className="status-dot online"></span> Online</> : <><span className="status-dot offline"></span> Offline</>
              ) : 'Select a recipient to start chatting'}
            </p>
          </div>
        </div>
        {isOpen && (
          <div className="chat-header-actions">
            {/* Back button when a conversation is active */}
            {selectedRecipient && (
              <button onClick={goBack} className="chat-action-btn" title="Back to contacts">
                <FaArrowLeft />
              </button>
            )}
            <button onClick={toggleMinimize} className="chat-action-btn">{isMinimized ? <FaExpand /> : <FaMinus />}</button>
            <button onClick={toggleExpand} className="chat-action-btn">{isExpanded ? <FaCompress /> : <FaExpand />}</button>
            <button onClick={toggleChat} className="chat-action-btn"><FaTimes /></button>
          </div>
        )}
      </div>

      {/* Body */}
      {isOpen && !isMinimized && (
        <>
          {!selectedRecipient ? (
            // Recipient selection UI (unchanged)
            <div className="recipient-selection">
              <div className="selection-header">
                <h4>Choose who to chat with</h4>
                <p className="selection-desc">{userPermissions.description}</p>
              </div>
              {recentConversations.length > 0 && (
                <div className="recent-section">
                  <div className="section-title"><FaHistory /> Recent Chats</div>
                  <div className="recipients-list">
                    {recentConversations.map(conv => (
                      <button key={conv.id} className="recipient-btn recent" onClick={() => startConversation(conv.recipientId, conv.recipientRole, conv.recipientName)}>
                        <div className="recipient-avatar" style={{ background: CHAT_PERMISSIONS[conv.recipientRole]?.color }}>{CHAT_PERMISSIONS[conv.recipientRole]?.icon}</div>
                        <div className="recipient-info">
                          <div className="recipient-name">{conv.recipientName}</div>
                          <div className="recipient-role">{CHAT_PERMISSIONS[conv.recipientRole]?.label}</div>
                          {conv.lastMessage && <div className="recipient-last-msg">{conv.lastMessage.substring(0, 40)}</div>}
                        </div>
                        {onlineStatus[conv.recipientId] && <span className="online-indicator"></span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="available-section">
                <div className="section-title"><FaUsers /> Available to Chat</div>
                <div className="recipients-list">
                  {availableRecipients.map(recipient => (
                    <button key={recipient.id} className="recipient-btn" onClick={() => startConversation(recipient.id, recipient.role, recipient.name)}>
                      <div className="recipient-avatar" style={{ background: CHAT_PERMISSIONS[recipient.role]?.color }}>{CHAT_PERMISSIONS[recipient.role]?.icon}</div>
                      <div className="recipient-info">
                        <div className="recipient-name">{recipient.name}</div>
                        <div className="recipient-role">{CHAT_PERMISSIONS[recipient.role]?.label}</div>
                        <div className="recipient-desc">{CHAT_PERMISSIONS[recipient.role]?.description}</div>
                      </div>
                      {recipient.isOnline && <span className="online-indicator"></span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Conversation view
            <>
              <div className="chat-body" ref={scrollerRef}>
                {messages.length === 0 && !isLoading && (
                  <div className="chat-empty">
                    <div className="chat-empty-icon">💬</div>
                    <h4>Start a conversation!</h4>
                    <p>Ask {recipientInfo?.name} about {recipientInfo?.description?.toLowerCase()}</p>
                    <div className="suggested-questions">
                      {suggestions.map((s, idx) => (
                        <button key={idx} onClick={() => setText(s.text)}>{s.icon} {s.text}</button>
                      ))}
                    </div>
                  </div>
                )}
                {isLoading && <div className="chat-loading"><FaSpinner className="spinning" /></div>}
                {messages.map((msg, idx) => {
                  const showDate = idx === 0 || formatDate(msg.createdAt) !== formatDate(messages[idx-1]?.createdAt);
                  const isOwn = msg.senderId === userId;
                  return (
                    <React.Fragment key={msg._id || idx}>
                      {showDate && <div className="chat-date-divider"><span>{formatDate(msg.createdAt)}</span></div>}
                      <div className={`message ${isOwn ? 'outgoing' : 'incoming'}`}>
                        {!isOwn && <div className="message-avatar" style={{ background: CHAT_PERMISSIONS[msg.senderRole]?.color }}>{CHAT_PERMISSIONS[msg.senderRole]?.icon}</div>}
                        <div className="message-bubble">
                          {!isOwn && <div className="message-sender">{msg.senderName}</div>}
                          <div className="message-text">{msg.text}</div>
                          <div className="message-time">
                            {formatTime(msg.createdAt)}
                            {isOwn && <span className="message-status">{msg.read ? <FaCheckDouble /> : <FaCheck />}</span>}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                {typing && (
                  <div className="typing-indicator-wrapper">
                    <div className="typing-indicator"><span></span><span></span><span></span><span className="typing-text">{recipientInfo?.name} is typing...</span></div>
                  </div>
                )}
              </div>
              <div className="chat-input-container">
                <div className="chat-input-wrapper">
                  <input ref={inputRef} type="text" placeholder={`Message ${recipientInfo?.name}...`} value={text} onChange={handleInputChange} onKeyDown={handleKeyDown} className="chat-input" />
                  <button className="chat-send-btn" onClick={sendMessage} disabled={!text.trim()}><FaPaperPlane /></button>
                </div>
              </div>
            </>
          )}
        </>
      )}
      {!isOpen && unreadCount > 0 && <div className="chat-unread-badge">{unreadCount}</div>}
    </div>
  );
};

export default Chat;