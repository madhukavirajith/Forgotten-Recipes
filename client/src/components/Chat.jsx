// client/src/components/Chat.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';


// Icons
import {
  FaComment, FaUserMd, FaUtensils, FaPaperPlane, FaTimes,
  FaMinus, FaExpand, FaCompress, FaSmile, FaPaperclip,
  FaCheck, FaCheckDouble, FaSpinner, FaUserCircle,
  FaShieldAlt, FaUsers, FaInfoCircle,
  FaArrowLeft, FaEdit, FaTrash, FaReply, FaSearch
} from 'react-icons/fa';

// ---------- Helper functions ----------
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

// Role permissions
const CHAT_PERMISSIONS = {
  visitor: { allowedRoles: ['dietician', 'headchef'], label: 'Visitor', color: '#10b981', description: 'Get help with recipes and nutrition' },
  dietician: { allowedRoles: ['visitor', 'admin'], label: 'Dietician', color: '#10b981', description: 'Nutrition advice and dietary guidance' },
  headchef: { allowedRoles: ['visitor', 'admin'], label: 'Head Chef', color: '#f59e0b', description: 'Recipe approvals and culinary expertise' },
  admin: { allowedRoles: ['headchef', 'dietician'], label: 'Admin', color: '#8b5cf6', description: 'Platform management and support' }
};

// Suggestion matrix keyed by "senderRole_recipientRole"
const CHAT_SUGGESTIONS = {

  // ── Visitor chatting with Head Chef ──
  visitor_headchef: [
    { text: "I submitted a recipe — can you review it?", icon: <FaEdit /> },
    { text: "What makes a recipe authentically Sri Lankan?", icon: <FaInfoCircle /> },
    { text: "How do I improve the texture of my dish?", icon: <FaUtensils /> },
    { text: "Can you explain the approval process?", icon: <FaInfoCircle /> },
  ],

  // ── Visitor chatting with Dietician ──
  visitor_dietician: [
    { text: "Can you check the nutrition in my recipe?", icon: <FaInfoCircle /> },
    { text: "I need a healthy substitute for coconut milk", icon: <FaInfoCircle /> },
    { text: "What are low-calorie versions of Sri Lankan dishes?", icon: <FaInfoCircle /> },
    { text: "Is my recipe suitable for a vegan diet?", icon: <FaInfoCircle /> },
  ],

  // ── Head Chef chatting with Visitor ──
  headchef_visitor: [
    { text: "I reviewed your recipe submission", icon: <FaEdit /> },
    { text: "Here are some tips to improve your recipe", icon: <FaUtensils /> },
    { text: "Your recipe has been approved!", icon: <FaInfoCircle /> },
    { text: "Can you clarify the ingredients you used?", icon: <FaInfoCircle /> },
  ],

  // ── Head Chef chatting with Admin ──
  headchef_admin: [
    { text: "I have a concern about a user submission", icon: <FaInfoCircle /> },
    { text: "Can you help resolve a content policy issue?", icon: <FaShieldAlt /> },
    { text: "I need help managing the approval queue", icon: <FaEdit /> },
    { text: "There's a technical issue on the dashboard", icon: <FaInfoCircle /> },
  ],

  // ── Dietician chatting with Visitor ──
  dietician_visitor: [
    { text: "I've reviewed your recipe's nutrition", icon: <FaUserMd /> },
    { text: "Here is your personalised nutrition advice", icon: <FaInfoCircle /> },
    { text: "I recommend these healthier alternatives", icon: <FaInfoCircle /> },
    { text: "Would you like a full dietary analysis?", icon: <FaUserMd /> },
  ],

  // ── Dietician chatting with Admin ──
  dietician_admin: [
    { text: "I need access to nutrition report data", icon: <FaInfoCircle /> },
    { text: "Can you update my profile or permissions?", icon: <FaShieldAlt /> },
    { text: "There's a discrepancy in the recipe database", icon: <FaInfoCircle /> },
    { text: "I'd like to share a platform improvement idea", icon: <FaComment /> },
  ],

  // ── Admin chatting with Head Chef ──
  admin_headchef: [
    { text: "Please review the pending recipe backlog", icon: <FaEdit /> },
    { text: "There's a content policy question for you", icon: <FaShieldAlt /> },
    { text: "Can you verify the authenticity of a recipe?", icon: <FaUtensils /> },
    { text: "A user flagged an issue with an approved recipe", icon: <FaInfoCircle /> },
  ],

  // ── Admin chatting with Dietician ──
  admin_dietician: [
    { text: "Please review the nutrition reports this week", icon: <FaUserMd /> },
    { text: "A recipe needs an updated nutritional analysis", icon: <FaInfoCircle /> },
    { text: "Can you audit recent dietary recommendations?", icon: <FaUserMd /> },
    { text: "There's a data access request for you", icon: <FaShieldAlt /> },
  ],

  // ── Fallback (generic) ──
  default: [
    { text: "I need help with a recipe", icon: <FaUtensils /> },
    { text: "Can you suggest healthy alternatives?", icon: <FaInfoCircle /> },
    { text: "How do I reduce spice in a curry?", icon: <FaInfoCircle /> },
    { text: "What are authentic Sri Lankan ingredients?", icon: <FaInfoCircle /> },
  ],
};

const getSuggestions = (senderRole, recipientRole) => {
  const key = `${senderRole}_${recipientRole}`;
  return CHAT_SUGGESTIONS[key] || CHAT_SUGGESTIONS.default;
};


const getRoleIcon = (role) => {
  const iconMap = {
    visitor: <FaUserCircle />,
    dietician: <FaUserMd />,
    headchef: <FaUtensils />,
    admin: <FaShieldAlt />
  };
  return iconMap[role] || <FaUserCircle />;
};

// ---------- Main Component ----------
const Chat = () => {
  const token = sessionStorage.getItem('token');
  const payload = useMemo(() => (token ? decodeJWT(token) : {}), [token]);
  const userRole = payload?.role || sessionStorage.getItem('role') || 'visitor';
  const userId = payload?.id || payload?._id || sessionStorage.getItem('userId');
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
  const [socketConnected, setSocketConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const socketRef = useRef(null);
  const scrollerRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const userPermissions = CHAT_PERMISSIONS[userRole] || CHAT_PERMISSIONS.visitor;
  // Suggestions update dynamically based on who the user is talking to
  const suggestions = getSuggestions(userRole, selectedRecipient?.role);

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
      setAvailableRecipients(data);
      if (Array.isArray(data)) {
        setOnlineStatus(prev => {
          const next = { ...prev };
          data.forEach(r => {
            if (r.id) next[r.id] = r.isOnline;
          });
          return next;
        });
      }
    } catch (err) {
      console.error('Error fetching recipients:', err);
    }
  }, [token]);


  const loadHistory = async (convId) => {
    try {
      const res = await fetch(`${API_ROOT}/chat/history/${convId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
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
        body: JSON.stringify({ recipientId })
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

  const searchMessages = async (query) => {
    if (!conversationId || !query.trim()) return;
    try {
      const res = await fetch(`${API_ROOT}/chat/${conversationId}/search?query=${encodeURIComponent(query)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSearchResults(data.messages || []);
    } catch (err) {
      console.error('Error searching messages:', err);
    }
  };

  const goBack = () => {
    setSelectedRecipient(null);
    setConversationId(null);
    setMessages([]);
    setSearchQuery('');
    setSearchResults([]);
  };

  // ---------- Socket handlers ----------
  const handleIncomingMessage = useCallback((msg) => {
    if (msg.conversation === conversationId) {
      setMessages(prev => {
        // Prevent duplicating messages we sent optimistically by replacing the temp message
        const msgSenderId = msg.senderId?.toString();
        const currentUserId = userId?.toString();
        if (msgSenderId && currentUserId && msgSenderId === currentUserId) {
          const idx = prev.findIndex(m => m._id && m._id.length < 24 && m.text === msg.text);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = msg;
            return updated;
          }
        }
        return [...prev, msg];
      });
      scrollToBottom();
      if (!isOpen || isMinimized) setUnreadCount(prev => prev + 1);
    }
  }, [conversationId, isOpen, isMinimized, scrollToBottom, userId]);

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
    }
  }, [socketConnected, fetchAvailableRecipients]);

  // Join conversation room when conversationId changes
  useEffect(() => {
    if (!conversationId || !socketRef.current || !socketConnected) return;
    socketRef.current.emit('joinRoom', { conversationId });
    markAsRead(conversationId);
    return () => {
      socketRef.current?.emit('leaveRoom', { conversationId });
    };
  }, [conversationId, socketConnected]);

  // ---------- Send message ----------
  const sendMessage = useCallback(() => {
    if (!text.trim() || !conversationId || !socketRef.current) return;

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

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      searchMessages(query);
    } else {
      setSearchResults([]);
    }
  };

  const getRecipientInfo = () => {
    if (!selectedRecipient) return null;
    const perm = CHAT_PERMISSIONS[selectedRecipient.role] || CHAT_PERMISSIONS.visitor;
    return {
      icon: getRoleIcon(selectedRecipient.role),
      name: selectedRecipient.name || perm.label,
      color: perm.color,
      description: perm.description
    };
  };

  const recipientInfo = getRecipientInfo();
  const isOnline = onlineStatus[selectedRecipient?.id];

  if (!userId) {
    return (
      <div className="chat-toggle-wrap">
        <button className="chat-toggle-btn" onClick={() => alert('Please login to chat')}>
          <FaComment /> <span>Chat</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {!isOpen && (
        <div className="chat-toggle-wrap">
          <button className="chat-toggle-btn" onClick={toggleChat}>
            <FaComment />
            <span>Chat</span>
            {unreadCount > 0 && <span className="chat-unread-badge">{unreadCount}</span>}
          </button>
        </div>
      )}
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
              {selectedRecipient && (
                <button onClick={goBack} className="chat-action-btn" title="Back to contacts">
                  <FaArrowLeft />
                </button>
              )}
              {selectedRecipient && (
                <button onClick={() => setIsSearching(!isSearching)} className="chat-action-btn" title="Search messages">
                  <FaSearch />
                </button>
              )}
              <button onClick={toggleChat} className="chat-action-btn"><FaTimes /></button>
            </div>
          )}
        </div>

        {/* Search bar */}
        {isOpen && !isMinimized && selectedRecipient && isSearching && (
          <div className="chat-search">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(msg => (
                  <div key={msg._id} className="search-result" onClick={() => {
                    const element = document.getElementById(`message-${msg._id}`);
                    element?.scrollIntoView({ behavior: 'smooth' });
                    setIsSearching(false);
                  }}>
                    <div className="search-result-text">{msg.text}</div>
                    <div className="search-result-time">{formatTime(msg.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Body */}
        {isOpen && !isMinimized && (
          <>
            {!selectedRecipient ? (
              // Recipient selection UI
              <div className="recipient-selection">
                <div className="selection-header">
                  <h4>Choose who to chat with</h4>
                  <p className="selection-desc">{userPermissions.description}</p>
                </div>
                <div className="available-section">
                  <div className="section-title"><FaUsers /> Available to Chat</div>
                  <div className="recipients-list">
                    {availableRecipients.map(recipient => (
                      <button key={recipient.id} className={`recipient-btn ${recipient.role}`} onClick={() => startConversation(recipient.id, recipient.role, recipient.name)}>
                        <div className="recipient-avatar" style={{ background: CHAT_PERMISSIONS[recipient.role]?.color }}>{getRoleIcon(recipient.role)}</div>
                        <div className="recipient-info">
                          <div className="recipient-name">{recipient.name}</div>
                          <div className="recipient-role">{CHAT_PERMISSIONS[recipient.role]?.label}</div>
                          <div className="recipient-desc">{CHAT_PERMISSIONS[recipient.role]?.description}</div>
                        </div>
                        {onlineStatus[recipient.id] && <span className="online-indicator"></span>}
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
                      <div className="chat-empty-icon"><FaComment /></div>
                      <h4>Start a conversation!</h4>
                      <p>Ask {recipientInfo?.name} about {recipientInfo?.description?.toLowerCase()}</p>
                      <div className="suggested-questions">
                        {suggestions.map((s, idx) => (
                          <button key={idx} onClick={() => setText(s.text)}>
                            <span className="suggestion-icon">{s.icon}</span> {s.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {isLoading && <div className="chat-loading"><FaSpinner className="spinning" /></div>}
                  {messages.map((msg, idx) => {
                    const showDate = idx === 0 || formatDate(msg.createdAt) !== formatDate(messages[idx - 1]?.createdAt);
                    const isOwn = msg.senderId === userId;
                    return (
                      <React.Fragment key={msg._id || idx}>
                        {showDate && <div className="chat-date-divider"><span>{formatDate(msg.createdAt)}</span></div>}
                        <div className={`message ${isOwn ? 'outgoing' : 'incoming'}`}>
                          {!isOwn && <div className="message-avatar" style={{ background: CHAT_PERMISSIONS[msg.senderRole]?.color }}>{getRoleIcon(msg.senderRole)}</div>}
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
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={`Message ${recipientInfo?.name}...`}
                      value={text}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="chat-input"
                    />
                    <button className="chat-send-btn" onClick={sendMessage} disabled={!text.trim()}>
                      <FaPaperPlane />
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Chat;