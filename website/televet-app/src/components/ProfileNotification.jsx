import React, { useState, useRef, useEffect } from "react";
import { Bell, User, ChevronLeft, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/profile-notification.css";

const ProfileNotification = ({ firstName = "Pet Owner" }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleMyProfileClick = () => {
    setIsDropdownOpen(false);
    navigate("/myprofile"); // ✅ unified route for both petParent & vetAdmin
  };


  const handleLogout = () => {
    // Clear session storage
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userType");
    sessionStorage.removeItem("firstName");
    
    // Redirect to login page
    navigate("/login");
  };

  return (
    <div className="header">
      <button className="notification-button">
        <Bell size={20} color="#6c757d" />
      </button>

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