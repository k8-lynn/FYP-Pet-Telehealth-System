//toast.jsx
import React from 'react';
import { CheckCircle, Clock, AlertCircle, Info } from 'lucide-react';
import '../styles/toast.css';

const Toast = ({ type = 'success', title, message }) => {
  const icons = {
    success: CheckCircle,
    pending: Clock,
    error: AlertCircle,
    info: Info
  };

  const Icon = icons[type] || CheckCircle;

  return (
    <div className={`toast toast-${type}`}>
      <Icon size={24} />
      <div className="toast-content">
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default Toast;