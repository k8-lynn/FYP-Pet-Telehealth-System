// ToastContainer.jsx
import React, { useEffect } from 'react';
import Toast from './toast';

const ToastContainer = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast) {
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  console.log('🪄 Rendering Toast:', toast);


return (
  <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 9999 }}>
    <Toast type={toast.type} title={toast.title} message={toast.message} />
  </div>
);
};

export default ToastContainer;