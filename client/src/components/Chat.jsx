
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import './Chat.css';


const RAW_BASE = process.env.REACT_APP_API_URL || ''; 
const API_ROOT = RAW_BASE
  ? (RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`)
  : '/api';

const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  'process.env.REACT_APP_API_URL'; 


function decodeJWT(token) {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload)) || {};
  } catch {
    return {};
  }
}

export default function Chat() {
  const token = localStorage.getItem('token');
  const payload = useMemo(() => (token ? decodeJWT(token) : {}), [token]);
  const visitorId = payload?.id || payload?._id || localStorage.getItem('userId');

  const [activeRole, setActiveRole] = useState('dietician'); 
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  const socketRef = useRef(null);
  const scroller = useRef(null);

  const scrollToBottom = () => {
    try {
      scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
    } catch {
      
      scroller.current?.scrollTo(0, 999999);
    }
  };

  const startConversation = async (role) => {
    const res = await fetch(`${API_ROOT}/chat/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId, targetRole: role }),
    });
    if (!res.ok) throw new Error('Failed to start conversation');
    const convo = await res.json();
    setConversationId(convo._id);
    return convo._id;
  };

  const loadHistory = async (id) => {
    const res = await fetch(`${API_ROOT}/chat/history/${id}`);
    if (!res.ok) throw new Error('Failed to load history');
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
    setTimeout(scrollToBottom, 10);
  };

  
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!visitorId) return;

      try {
        const id = await startConversation(activeRole);
        if (!isMounted) return;

        await loadHistory(id);

      
        if (!socketRef.current) {
          socketRef.current = io(SOCKET_URL, {
            transports: ['websocket'],
            withCredentials: true,
          });
        }

        
        socketRef.current.emit('join', { conversationId: id });

        
        socketRef.current.off('message');
        socketRef.current.on('message', (msg) => {
          if (msg.conversation === id) {
            setMessages((m) => [...m, msg]);
            setTimeout(scrollToBottom, 10);
          }
        });
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      isMounted = false;
      
      socketRef.current?.off('message');
    };
  }, [activeRole, visitorId]);

  const send = () => {
    if (!text.trim() || !conversationId) return;
    socketRef.current?.emit('message', {
      conversationId,
      text,
      senderRole: 'visitor',
      senderId: visitorId,
    });
    setText('');
  };

  if (!visitorId) {
    return (
      <div className="chat-widget">
        <div className="chat-header">Chat</div>
        <div className="chat-body">
          <div className="chat-empty">Please log in to chat with our team.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-widget">
      <div className="chat-header">Chat with us</div>

      <div className="chat-tabs">
        <button
          className={activeRole === 'dietician' ? 'active' : ''}
          onClick={() => setActiveRole('dietician')}
          type="button"
        >
          Dietician
        </button>
        <button
          className={activeRole === 'headchef' ? 'active' : ''}
          onClick={() => setActiveRole('headchef')}
          type="button"
        >
          Head Chef
        </button>
      </div>

      <div className="chat-body" ref={scroller}>
        {messages.map((m) => (
          <div
            key={m._id || `${m.createdAt}-${Math.random()}`}
            className={`bubble ${m.senderRole === 'visitor' ? 'mine' : 'theirs'}`}
          >
            <div className="text">{m.text}</div>
            <div className="time">
              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {!messages.length && (
          <div className="chat-empty">
            Start a conversation with our {activeRole}. Ask anything!
          </div>
        )}
      </div>

      <div className="chat-input">
        <input
          placeholder={`Message the ${activeRole}…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button onClick={send} type="button" disabled={!text.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
