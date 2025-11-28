import React from 'react';
import { X } from 'lucide-react';

const AppointmentDetailsModal = ({ 
  showModal, 
  appointmentDetails, 
  onClose, 
  formatDate 
}) => {
  if (!showModal || !appointmentDetails) return null;

  return (
    <div className="mypatients-modal-overlay" onClick={onClose}>
      <div className="mypatients-modal-content view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mypatients-modal-header">
          <h2 className="mypatients-modal-title">Appointment Details</h2>
          <button className="mypatients-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="view-modal-body">
          <div className="view-section">
            <h3>Appointment Information</h3>
            <div className="view-grid">
              <div className="view-item">
                <strong>Appointment ID</strong>
                #{appointmentDetails.appt_id}
              </div>
              <div className="view-item">
                <strong>Date & Time</strong>
                {formatDate(appointmentDetails.appt_date)}
              </div>
              <div className="view-item">
                <strong>Appointment Type</strong>
                {appointmentDetails.appt_type}
              </div>
              <div className="view-item">
                <strong>Consultation Type</strong>
                {appointmentDetails.consultation_type === 'online' ? 'Online' : 'Physical'}
              </div>
              <div className="view-item">
                <strong>Status</strong>
                <span className={`vet-badge status-${appointmentDetails.appt_status}`}>
                  {appointmentDetails.appt_status}
                </span>
              </div>
              <div className="view-item">
                <strong>Created At</strong>
                {formatDate(appointmentDetails.created_at)}
              </div>
              <div className="view-item full-width">
                <strong>Description</strong>
                {appointmentDetails.appt_description || 'No description provided'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;