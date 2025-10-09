import React from "react";
import { Bell, User, ChevronLeft } from "lucide-react";

const ProfileNotification = ({ firstName = "Pet Owner" }) => {
  return (
    <div className="header">
      <button className="notification-button">
        <Bell size={20} color="#6c757d" />
      </button>

      <div className="user-profile">
        <div className="user-avatar">
          <User size={20} color="#64748b" />
        </div>
        <span className="user-name">{firstName}</span>
        <ChevronLeft size={16} color="#6c757d" style={{ transform: "rotate(-90deg)" }} />
      </div>
    </div>
  );
};

export default ProfileNotification;
