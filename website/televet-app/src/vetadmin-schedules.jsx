import React, { useState, useEffect, useRef } from "react";
import { Clock, Edit3, X, Save, MapPin } from 'lucide-react';
import { io } from "socket.io-client";

import './styles/vetadmin-schedules.css';
import VetAdminNavbar from './components/vetadmin-navbar';
import PawPattern from "./components/PawPattern";
import ProfileNotification from "./components/ProfileNotification";

const VetAdminSchedules = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [clinicHours, setClinicHours] = useState(null);
  const [clinicStatus, setClinicStatus] = useState('open');
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [va_id, setVaId] = useState(null);
  const [clinic_id, setClinicId] = useState(null);
  const [clinicInfo, setClinicInfo] = useState({});
  const socketRef = useRef(null);

  const [hoursForm, setHoursForm] = useState({
    monday: { opening: '09:00 AM', closing: '05:00 PM', status: 'Available' },
    tuesday: { opening: '09:00 AM', closing: '05:00 PM', status: 'Available' },
    wednesday: { opening: '09:00 AM', closing: '05:00 PM', status: 'Available' },
    thursday: { opening: '09:00 AM', closing: '05:00 PM', status: 'Available' },
    friday: { opening: '09:00 AM', closing: '05:00 PM', status: 'Available' },
    saturday: { opening: '10:00 AM', closing: '02:00 PM', status: 'Limited' },
    sunday: { opening: null, closing: null, status: 'Closed' }
  });

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const timeOptions = [
    '12:00 AM', '12:30 AM', '01:00 AM', '01:30 AM', '02:00 AM', '02:30 AM',
    '03:00 AM', '03:30 AM', '04:00 AM', '04:30 AM', '05:00 AM', '05:30 AM',
    '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM',
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
    '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM',
    '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'
  ];

  const statusOptions = ['Available', 'Limited', 'Closed'];

  useEffect(() => {
    const storedName = sessionStorage.getItem('firstName');
    const userId = sessionStorage.getItem('userid');
    if (storedName) setFirstName(storedName);
    
    if (userId) {
      fetchVetAdminData(userId);
    }
  }, []);

  // Socket.IO connection for real-time updates
  useEffect(() => {
    if (!clinic_id) return;

    socketRef.current = io("http://localhost:5000", {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("✅ Vet Admin connected to Socket.IO:", socket.id);
    });

    socket.on("clinicHoursUpdated", (data) => {
      console.log("📡 Vet Admin received clinic hours update:", data);

      if (data.clinic_id == clinic_id) {
        console.log("🔄 Refreshing clinic hours for clinic:", clinic_id);
        fetchClinicHours(clinic_id);
      }
    });

    socket.on("clinicStatusUpdated", (data) => {
      console.log("📡 Vet Admin received status update:", data);

      if (data.clinic_id == clinic_id) {
        console.log("🔄 Updating clinic status:", data.status);
        setClinicStatus(data.status);
      }
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Vet Admin socket error:", error);
    });

    return () => {
      console.log("🧹 Cleaning up vet admin socket");
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [clinic_id]);

  const fetchVetAdminData = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/profile/${userId}`);
      const data = await res.json();
  
      if (data.va_id) {
        setVaId(data.va_id);
        setClinicInfo({
          clinicName: data.va_clinicName,
          vetLocation: data.va_vetLocation
        });
        fetchClinicData(data.va_id);
      }
    } catch (error) {
      console.error("Error fetching vet admin data:", error);
    }
  };

  const fetchClinicData = async (vaId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/clinic/${vaId}`);
      const data = await res.json();
      
      if (data.clinic_id) {
        setClinicId(data.clinic_id);
        setClinicStatus(data.clinic_status);
        fetchClinicHours(data.clinic_id);
      }
    } catch (error) {
      console.error("Error fetching clinic data:", error);
    }
  };

  const parseClinicHours = (hoursData) => {
    if (!hoursData) return { opening: null, closing: null, status: 'Closed' };
    
    if (typeof hoursData === 'object') {
      return {
        opening: hoursData.opening || null,
        closing: hoursData.closing || null,
        status: hoursData.status || 'Closed'
      };
    }
    
    try {
      const parsed = JSON.parse(hoursData);
      return {
        opening: parsed.opening || null,
        closing: parsed.closing || null,
        status: parsed.status || 'Closed'
      };
    } catch {
      return { opening: null, closing: null, status: 'Closed' };
    }
  };

  const fetchClinicHours = async (clinicId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/clinic-hours/${clinicId}`);
      const data = await res.json();
      
      console.log("📥 Raw data from backend:", data);
      
      if (data) {
        setClinicHours(data);
        
        const newForm = {};
        daysOfWeek.forEach(day => {
          const dbField = `${day}_hours`;
          const rawData = data[dbField];
          console.log(`🔍 ${day}_hours raw:`, rawData);
          newForm[day] = parseClinicHours(rawData);
        });
        
        console.log("✅ Parsed form data:", newForm);
        setHoursForm(newForm);
      }
    } catch (error) {
      console.error("Error fetching clinic hours:", error);
    }
  };

  const handleSaveHours = async () => {
    if (!clinic_id) {
      alert("Clinic not found");
      return;
    }

    const payload = {};
    daysOfWeek.forEach(day => {
      const dayData = hoursForm[day];
      payload[`${day}_hours`] = JSON.stringify({
        opening: dayData.opening,
        closing: dayData.closing,
        status: dayData.status
      });
    });

    console.log("💾 Saving payload:", payload);

    try {
      const res = await fetch(`http://localhost:5000/api/clinic-hours/${clinic_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Clinic hours updated successfully!");
        fetchClinicHours(clinic_id);
        setShowHoursModal(false);
      } else {
        alert("Failed to update clinic hours");
      }
    } catch (error) {
      console.error("Error saving clinic hours:", error);
      alert("An error occurred");
    }
  };

  const handleToggleStatus = async () => {
    if (!clinic_id) return;

    const newStatus = clinicStatus === 'open' ? 'closed' : 'open';

    try {
      const res = await fetch(`http://localhost:5000/api/clinic-status/${clinic_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setClinicStatus(newStatus);
      }
    } catch (error) {
      console.error("Error updating clinic status:", error);
    }
  };

  const handleDayChange = (day, field, value) => {
    setHoursForm(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const formatDisplayTime = (dayData) => {
    if (!dayData || dayData.status === 'Closed' || !dayData.opening || !dayData.closing) {
      return 'Closed';
    }
    return `${dayData.opening} - ${dayData.closing}`;
  };

  const hasClinicHours = clinicHours && daysOfWeek.some(day => {
    const field = clinicHours[`${day}_hours`];
    if (!field) return false;
    
    const parsed = parseClinicHours(field);
    return parsed && parsed.status && parsed.status.toLowerCase() !== 'closed';
  });

  return (
    <div className="schedule-dashboard-container">
      <PawPattern count={35} />
      <VetAdminNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="schedule-main-content">
        {/* Header with Location and Profile */}
        <div className="schedule-header-top">
          <div className="location-info">
            <MapPin size={20} className="location-icon" />
            <span className="location-text">{clinicInfo.clinicName || 'PawCare Veterinary Clinic'}</span>
          </div>
          <ProfileNotification firstName={firstName} />
        </div>

        <div className="schedule-header">
          <div className="schedule-header-text">
            <h1>Clinic Hours</h1>
            <p>Manage your clinic's operating hours</p>
          </div>
          <div className="schedule-status-toggle">
            <span className="schedule-status-label">Clinic Status</span>
            <button 
              className={`schedule-status-btn ${clinicStatus}`}
              onClick={handleToggleStatus}
            >
              <div className="schedule-status-indicator"></div>
              {clinicStatus === 'open' ? 'Open' : 'Closed'}
            </button>
          </div>
        </div>

        <div className="schedule-hours-section">
          <div className="schedule-section-header">
            <div className="schedule-section-title">
              <Clock size={24} />
              <h2>Weekly Schedule</h2>
            </div>
            <button 
              className="schedule-hours-btn"
              onClick={() => setShowHoursModal(true)}
            >
              {hasClinicHours ? (
                <>
                  <Edit3 size={18} />
                  Edit Clinic Hours
                </>
              ) : (
                <>
                  <Clock size={18} />
                  Set Clinic Hours
                </>
              )}
            </button>
          </div>

          {!hasClinicHours ? (
            <div className="schedule-hours-empty">
              <Clock size={48} />
              <p>No clinic hours set yet</p>
              <span>Click "Set Clinic Hours" to define your schedule</span>
            </div>
          ) : (
            <div className="schedule-hours-list">
              {daysOfWeek.map((day, index) => {
                const dayData = hoursForm[day];
                return (
                  <div key={day} className="schedule-hours-item">
                    <span className="schedule-hours-day">{dayLabels[index]}</span>
                    <span className="schedule-hours-time">
                      {formatDisplayTime(dayData)}
                    </span>
                    <span className={`schedule-hours-status ${dayData.status.toLowerCase()}`}>
                      {dayData.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showHoursModal && (
          <div className="schedule-modal-overlay" onClick={() => setShowHoursModal(false)}>
            <div className="schedule-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="schedule-modal-close" onClick={() => setShowHoursModal(false)}>
                <X size={24} />
              </button>

              <div className="schedule-modal-header">
                <Clock size={48} />
                <h2>{hasClinicHours ? 'Edit Clinic Hours' : 'Set Clinic Hours'}</h2>
                <p>Define your clinic's operating hours for each day</p>
              </div>

              <div className="schedule-modal-body">
                {daysOfWeek.map((day, index) => {
                  const dayData = hoursForm[day] || { opening: '', closing: '', status: 'Closed' };
                  
                  return (
                    <div key={day} className="schedule-hours-input-row">
                      <label className="schedule-day-label">{dayLabels[index]}</label>
                      
                      <div className="schedule-time-selectors">
                        <div className="time-select-wrapper">
                          <input
                            type="text"
                            className="time-input"
                            placeholder="Opening"
                            value={dayData.opening || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const numericMatch = /^\d+$/.test(val)
                                ? timeOptions.find(t => t.startsWith(val.padStart(2, '0')))
                                : null;
                              handleDayChange(day, 'opening', numericMatch || val);
                            }}
                            onFocus={(e) => e.target.select()}
                            disabled={dayData.status === 'Closed'}
                            list={`open-times-${day}`}
                          />
                          <datalist id={`open-times-${day}`}>
                            {timeOptions.map(time => (
                              <option key={time} value={time} />
                            ))}
                          </datalist>
                        </div>

                        <span className="schedule-time-separator">to</span>

                        <div className="time-select-wrapper">
                          <input
                            type="text"
                            className="time-input"
                            placeholder="Closing"
                            value={dayData.closing || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const numericMatch = /^\d+$/.test(val)
                                ? timeOptions.find(t => t.startsWith(val.padStart(2, '0')))
                                : null;
                              handleDayChange(day, 'closing', numericMatch || val);
                            }}
                            onFocus={(e) => e.target.select()}
                            disabled={dayData.status === 'Closed'}
                            list={`close-times-${day}`}
                          />
                          <datalist id={`close-times-${day}`}>
                            {timeOptions.map(time => (
                              <option key={time} value={time} />
                            ))}
                          </datalist>
                        </div>

                        <select
                          value={dayData.status}
                          onChange={(e) => handleDayChange(day, 'status', e.target.value)}
                          className="schedule-status-select"
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}

                <button className="schedule-save-btn" onClick={handleSaveHours}>
                  <Save size={20} />
                  Save Clinic Hours
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VetAdminSchedules;