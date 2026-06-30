// profileNotification.jsx
import React, { useState, useRef, useEffect } from "react";
import { Bell, User, ChevronLeft, LogOut, X, Check, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "./NotificationProvider";
import "../styles/profile-notification.css";

const ProfileNotification = ({ firstName = "Pet Owner" }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  // ✅ Get notifications from context
  const { notifications: contextNotifications } = useNotification();

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      const userId = sessionStorage.getItem('userid');
      if (!userId) return;

      try {
        const res = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/notifications/${userId}`);
        const data = await res.json();
        
        if (res.ok) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.is_read).length);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []); // Only fetch once on mount

  // ✅ Update notifications when context changes (new real-time notifications)
  useEffect(() => {
    if (contextNotifications.length > 0) {
      console.log('📩 Context notifications updated:', contextNotifications);
      
      // Merge context notifications with existing ones
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.notification_id));
        const newNotifications = contextNotifications.filter(n => !existingIds.has(n.notification_id));
        return [...newNotifications, ...prev];
      });
      
      // Update unread count
      setUnreadCount(prev => prev + contextNotifications.filter(n => !n.is_read).length);
    }
  }, [contextNotifications]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
    setIsNotificationOpen(false);
  };

  const handleNotificationClick = async () => {
    const wasClosing = isNotificationOpen;
    setIsNotificationOpen(!isNotificationOpen);
    setIsDropdownOpen(false);
    
    // ✅ Mark all unread notifications as read when OPENING the panel
    if (!wasClosing && unreadCount > 0) {
      try {
        const userId = sessionStorage.getItem('userid');
        const res = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/notifications/${userId}/mark-all-read`, {
          method: 'PUT'
        });
  
        if (res.ok) {
          setNotifications(prev =>
            prev.map(n => ({ ...n, is_read: true }))
          );
          setUnreadCount(0);
        }
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    }
  };

  const handleMyProfileClick = () => {
    setIsDropdownOpen(false);
    navigate("/myprofile");
  };

  const handleLogout = async () => {
    try {
      // ✅ Call backend logout endpoint to clear cookies
      await fetch('https://fyp-pet-telehealth-system.onrender.com/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // ✅ Clear sessionStorage
      sessionStorage.clear();
      
      // ✅ Navigate to login
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // ✅ Even if backend fails, still clear local data and redirect
      sessionStorage.clear();
      navigate('/login');
    }
  };


  const deleteNotification = async (notificationId) => {
    try {
      const res = await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
        setUnreadCount(prev => {
          const notification = notifications.find(n => n.notification_id === notificationId);
          return notification && !notification.is_read ? Math.max(0, prev - 1) : prev;
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatAppointmentDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'approved':
      case 'assigned':
        return <Check size={18} className="notification-icon approved" />;
      case 'pending':
        return <Clock size={18} className="notification-icon pending" />;
      default:
        return <Bell size={18} className="notification-icon" />;
    }
  };

  return (
    <div className="header">
      <div className="notification-container" ref={notificationRef}>
        <button 
          className="notification-button" 
          onClick={handleNotificationClick}
        >
          <Bell size={20} color="#6c757d" />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </button>

        {isNotificationOpen && (
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <span className="unread-count">{unreadCount} new</span>
              )}
            </div>
            
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="notification-empty">
                  <Bell size={32} color="#cbd5e1" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div 
                    key={notification.notification_id} 
                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  >
                    <div className="notification-content">
                      {getNotificationIcon(notification.notification_type)}
                      <div className="notification-text">
                        <p className="notification-message">
                          {notification.notification_message}
                        </p>
                        {notification.appt_date && (
                          <p className="notification-appointment-date">
                            {formatAppointmentDate(notification.appt_date)}
                          </p>
                        )}
                        <span className="notification-time">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                    </div>
                    <button 
                      className="notification-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.notification_id);
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="user-profile-container" ref={dropdownRef}>
        <div className="user-profile" onClick={handleProfileClick}>
          <div className="user-avatar">
            <User size={20} color="#64748b" />
          </div>
          <span className="user-name">{firstName}</span>
          <ChevronLeft 
            size={16} 
            color="#6c757d" 
            style={{ 
              transform: isDropdownOpen ? "rotate(90deg)" : "rotate(-90deg)",
              transition: "transform 0.2s ease"
            }} 
          />
        </div>

        {isDropdownOpen && (
          <div className="profile-dropdown">
            <button className="dropdown-item" onClick={handleMyProfileClick}>
              <User size={18} />
              <span>My Profile</span>
            </button>
            <div className="dropdown-divider"></div>
            <button className="dropdown-item logout" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileNotification;