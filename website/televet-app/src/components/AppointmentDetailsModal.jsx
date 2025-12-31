//AppointmentDetailsModal.jsx
import React, { useState } from 'react';
import { X, MessageCircle, Calendar, XCircle } from 'lucide-react';
import showStyledAlert from '../utils/styledAlert';

const AppointmentDetailsModal = ({ 
  showModal, 
  appointmentDetails, 
  onClose, 
  formatDate,
  userRole, // 'pp' or 'vt'
  onContactVet, // Callback function for pet owners to contact vet
  onCancelAppointment, // New callback for cancellation
  onRescheduleRequest // New callback for reschedule request
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState('');

  if (!showModal || !appointmentDetails) return null;

  const canCancel = (appointmentDetails.appt_status === 'pending' || 
    appointmentDetails.appt_status === 'scheduled') &&
    !(appointmentDetails.resched_flag === 'yes' && !appointmentDetails.vet_name);

  const handleCancelSubmit = async () => {
    // Vets MUST provide a reason, pet owners it's optional
    if (userRole === 'vt' && !cancelReason.trim()) {
      showStyledAlert('Please provide a reason for cancellation');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCancelAppointment(appointmentDetails.appt_id, cancelReason);
      setShowCancelModal(false);
      setCancelReason('');
      onClose();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      showStyledAlert('Failed to cancel appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayStatus =
  appointmentDetails.resched_flag === 'yes' && !appointmentDetails.vet_name
    ? 'rescheduled'
    : appointmentDetails.appt_status;


  

  return (
    <>
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
                  <span className={`vet-badge status-${displayStatus}`}>
                    {displayStatus}
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
                
                {/* Show cancellation details if cancelled */}
                {appointmentDetails.appt_status === 'cancelled' && (
                  <>
                    {appointmentDetails.cancel_reason && (
                      <div className="view-item full-width">
                        <strong>Cancellation Reason</strong>
                        <div className="cancel-reason-box">
                          {appointmentDetails.cancel_reason}
                        </div>
                      </div>
                    )}
                    {appointmentDetails.cancelled_by && (
                      <div className="view-item">
                        <strong>Cancelled By</strong>
                        {appointmentDetails.cancelled_by === 'petParent' ? 'Pet Owner' : 'Veterinarian'}
                      </div>
                    )}
                    {appointmentDetails.cancelled_at && (
                      <div className="view-item">
                        <strong>Cancelled At</strong>
                        {formatDate(appointmentDetails.cancelled_at)}
                      </div>
                    )}
                  </>
                )}

                {/* Show reschedule request if exists */}
                {appointmentDetails.resched_flag === 'yes' && (
                  <div className="view-item full-width">
                    <strong>Reschedule Request</strong>
                    <div className="reschedule-request-box">
                      {appointmentDetails.resched_reason || 'No reason provided'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Patient/Veterinarian Section */}
            <div className="view-section">
              <h3>{userRole === 'vt' ? 'Assigned Patient' : 'Assigned Veterinarian'}</h3>
              <div className="view-grid">
                <div className="view-item vet-info-row">
                  <div className="vet-info-content">
                    <strong>{userRole === 'vt' ? 'Patient' : 'Veterinarian'}</strong>
                    <div className={`vet-name-display ${!appointmentDetails.vet_name && !appointmentDetails.pet_name ? 'not-assigned' : ''}`}>
                      {userRole === 'vt' 
                        ? (appointmentDetails.pet_name || 'Not assigned yet')
                        : (appointmentDetails.vet_name || 'Not assigned yet')
                      }
                    </div>
                  </div>
                  {/* Contact button - show for both vets and pet owners when other party is assigned */}
                  {((userRole === 'pp' && appointmentDetails.vet_name) || 
                    (userRole === 'vt' && appointmentDetails.pet_name)) && onContactVet && (
                    <button 
                      className="contact-vet-btn"
                      onClick={() => {
                        onContactVet();
                      }}
                    >
                      <MessageCircle size={16} />
                      Contact {userRole === 'vt' ? 'Patient' : 'Vet'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {canCancel && userRole === 'pp' && (
              <div className="appointment-actions">
                <button 
                  className="btn-reschedule-request"
                  onClick={() => setShowRescheduleModal(true)}
                >
                  <Calendar size={16} />
                  Reschedule Appointment
                </button>
                <button 
                  className="btn-cancel-appointment"
                  onClick={() => setShowCancelModal(true)}
                >
                  <XCircle size={16} />
                  Cancel Appointment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="mypatients-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="mypatients-modal-content cancel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mypatients-modal-header">
              <h2 className="mypatients-modal-title">Cancel Appointment</h2>
              <button className="mypatients-modal-close" onClick={() => setShowCancelModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="view-modal-body">
              <p className="cancel-warning">
                Are you sure you want to cancel this appointment?
                {userRole === 'pp' && ' This action cannot be undone.'}
              </p>

              {userRole === 'vt' && (
                <div className="form-group">
                  <label>Reason for Cancellation *</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Please provide a reason for cancelling this appointment..."
                    rows="4"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e8f0f7',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              )}

              {userRole === 'pp' && (
                <div className="form-group">
                  <label>Reason (Optional)</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="You may provide a reason (optional)..."
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e8f0f7',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              )}

              <div className="modal-actions">
                <button 
                  className="mypatients-cancel-button"
                  onClick={() => setShowCancelModal(false)}
                  disabled={isSubmitting}
                >
                  Keep Appointment
                </button>
                <button 
                  className="btn-confirm-cancel"
                  onClick={handleCancelSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Reschedule Reason Modal */}
      {showRescheduleModal && (
        <div className="mypatients-modal-overlay" onClick={() => setShowRescheduleModal(false)}>
          <div className="mypatients-modal-content reschedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mypatients-modal-header">
              <h2 className="mypatients-modal-title">Reschedule Appointment</h2>
              <button className="mypatients-modal-close" onClick={() => setShowRescheduleModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="view-modal-body">
              <p className="reschedule-info">
                Please provide a reason for rescheduling this appointment.
              </p>

              <div className="form-group">
                <label>Reason for Rescheduling *</label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Please explain why you need to reschedule..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e8f0f7',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div className="modal-actions">
                <button 
                  className="mypatients-cancel-button"
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setRescheduleReason('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  className="btn-confirm-reschedule"
                  onClick={() => {
                    if (!rescheduleReason.trim()) {
                      showStyledAlert('Please provide a reason for rescheduling');
                      return;
                    }
                    setShowRescheduleModal(false);
                    onClose(); // Close details modal
                    if (onRescheduleRequest) {
                      onRescheduleRequest({
                        ...appointmentDetails,
                        rescheduleReason
                      });
                    }
                  }}
                  disabled={isSubmitting || !rescheduleReason.trim()}
                >
                  Continue to Select New Slot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </>
  );
};

export default AppointmentDetailsModal;