import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBell, FaCheckCircle, FaTimesCircle, FaCommentAlt, 
  FaInfoCircle, FaExclamationTriangle, FaTimes 
} from 'react-icons/fa';
import '../styles/notifications.css';

export default function NotificationToast() {
  const navigate = useNavigate();
  const [activeToast, setActiveToast] = useState(null);

  useEffect(() => {
    let dismissTimer;
    const handleLiveNotification = (event) => {
      const note = event.detail;
      if (!note) return;

      setActiveToast(note);
      
      // Auto dismiss after 5 seconds
      if (dismissTimer) clearTimeout(dismissTimer);
      dismissTimer = setTimeout(() => {
        setActiveToast(null);
      }, 5000);
    };

    window.addEventListener('live-notification', handleLiveNotification);
    return () => {
      window.removeEventListener('live-notification', handleLiveNotification);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, []);

  if (!activeToast) return null;

  const getIcon = () => {
    switch (activeToast.type) {
      case 'recipe_approval':
        return <FaCheckCircle className="toast-icon success" />;
      case 'recipe_rejection':
        return <FaTimesCircle className="toast-icon error" />;
      case 'nutrition_added':
        return <FaInfoCircle className="toast-icon info" />;
      case 'chat_message':
        return <FaCommentAlt className="toast-icon chat" />;
      case 'feedback_update':
        return <FaExclamationTriangle className="toast-icon warning" />;
      default:
        return <FaBell className="toast-icon default" />;
    }
  };

  const handleToastClick = () => {
    if (activeToast.actionUrl) {
      navigate(activeToast.actionUrl);
    }
    setActiveToast(null);
  };

  return (
    <div className="live-toast-container">
      <div className="live-toast-card" onClick={handleToastClick}>
        <div className="live-toast-left">
          {getIcon()}
        </div>
        <div className="live-toast-content">
          <div className="live-toast-title">{activeToast.title || 'New Notification'}</div>
          <div className="live-toast-message">{activeToast.message}</div>
        </div>
        <button 
          className="live-toast-close" 
          onClick={(e) => {
            e.stopPropagation();
            setActiveToast(null);
          }}
          type="button"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
}
