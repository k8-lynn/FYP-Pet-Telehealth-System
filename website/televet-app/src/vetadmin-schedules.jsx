//vetadmin-schedules
import React, { useState, useEffect } from "react";
import { Calendar, Clock, Edit3, ChevronLeft, ChevronRight, Users, TrendingUp, X, Save, MapPin, Plus, CheckCircle } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState('today');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [patientsThisWeek, setPatientsThisWeek] = useState(0);
  const [patientsThisMonth, setPatientsThisMonth] = useState(0);
  const [patientsToday, setPatientsToday] = useState(0); // 👈 Add this line
  const [va_id, setVaId] = useState(null);
  const [clinic_id, setClinicId] = useState(null);
  const [clinicInfo, setClinicInfo] = useState({});
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [newSlotTime, setNewSlotTime] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsGenerated, setSlotsGenerated] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedPendingSlot, setSelectedPendingSlot] = useState(null);
  const [veterinarians, setVeterinarians] = useState([]);
  const [selectedVeterinarian, setSelectedVeterinarian] = useState(null);

  // Time slots state - default slots for today
const [timeSlots, setTimeSlots] = useState([]);


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

  useEffect(() => {
    if (va_id) {
      fetchVeterinarians(va_id);
    }
  }, [va_id]);
  
  const fetchVeterinarians = async (vaId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/veterinarians/${vaId}`);
      const data = await res.json();
      
      if (res.ok) {
        setVeterinarians(data);
      }
    } catch (error) {
      console.error("Error fetching veterinarians:", error);
    }
  };

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
        fetchClinicSlots(data.clinic_id); // 👈 Add this line
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

  const fetchClinicSlots = async (clinicId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/clinic-slots/${clinicId}`);
      const data = await res.json();
      
      if (data && data.slots) {
        setTimeSlots(data.slots);
        setSlotsGenerated(true);
      } else {
        setTimeSlots([]);
        setSlotsGenerated(false);
      }
    } catch (error) {
      console.error("Error fetching clinic slots:", error);
      setTimeSlots([]);
    }
  };

  const handleGenerateDefaultSlots = async () => {
    if (!clinic_id) {
      alert("Clinic not found");
      return;
    }
  
    setSlotsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/clinic-slots/generate/${clinic_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
  
      const data = await res.json();
      
      if (res.ok) {
        setTimeSlots(data.slots);
        setSlotsGenerated(true);
        alert("Default time slots generated successfully!");
      } else {
        alert(data.error || "Failed to generate slots");
      }
    } catch (error) {
      console.error("Error generating slots:", error);
      alert("An error occurred while generating slots");
    } finally {
      setSlotsLoading(false);
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

  const getWeekDays = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getMonthDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'weekly') {
      newDate.setDate(currentDate.getDate() + (direction * 7));
    } else if (viewMode === 'monthly') {
      newDate.setMonth(currentDate.getMonth() + direction);
    } else {
      newDate.setDate(currentDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const formatDate = (date) => {
    if (viewMode === 'today') {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleAddSlot = async () => {
    if (!newSlotTime) {
      alert('Please select a time');
      return;
    }
  
    if (!clinic_id) {
      alert('Clinic not found');
      return;
    }
  
    const newSlot = {
      id: timeSlots.length > 0 ? Math.max(...timeSlots.map(s => s.id)) + 1 : 1,
      time: newSlotTime,
      status: 'available',
      patient: null
    };
  
    const updatedSlots = [...timeSlots, newSlot].sort((a, b) => {
      const timeA = new Date('1970/01/01 ' + a.time);
      const timeB = new Date('1970/01/01 ' + b.time);
      return timeA - timeB;
    });
  
    try {
      const res = await fetch(`http://localhost:5000/api/clinic-slots/${clinic_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: updatedSlots })
      });
  
      if (res.ok) {
        setTimeSlots(updatedSlots);
        setNewSlotTime('');
        setShowSlotModal(false);
        alert('Time slot added successfully!');
      } else {
        alert('Failed to add time slot');
      }
    } catch (error) {
      console.error('Error adding slot:', error);
      alert('An error occurred');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!clinic_id) {
      alert('Clinic not found');
      return;
    }
  
    const updatedSlots = timeSlots.filter(slot => slot.id !== slotId);
  
    try {
      const res = await fetch(`http://localhost:5000/api/clinic-slots/${clinic_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: updatedSlots })
      });
  
      if (res.ok) {
        setTimeSlots(updatedSlots);
        setSlotToDelete(null);
        alert('Time slot deleted successfully!');
      } else {
        alert('Failed to delete time slot');
      }
    } catch (error) {
      console.error('Error deleting slot:', error);
      alert('An error occurred');
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSlotToDelete(null);
  };

  // Add this function:
  const handleApproveSlot = async (slot) => {
    if (!selectedVeterinarian) {
      alert('Please select a veterinarian');
      return;
    }
  
    const updatedSlots = timeSlots.map(s => 
      s.id === slot.id 
        ? { 
            ...s, 
            status: 'taken',
            veterinarian: `Dr. ${selectedVeterinarian.usr_firstName} ${selectedVeterinarian.usr_lastName}`,
            vt_id: selectedVeterinarian.vt_id
          }
        : s
    );
  
    try {
      const res = await fetch(`http://localhost:5000/api/clinic-slots/${clinic_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: updatedSlots })
      });
  
      if (res.ok) {
        setTimeSlots(updatedSlots);
        setSelectedPendingSlot(null);
        setSelectedVeterinarian(null);
        alert('Appointment approved and assigned successfully!');
      } else {
        alert('Failed to approve appointment');
      }
    } catch (error) {
      console.error('Error approving slot:', error);
      alert('An error occurred');
    }
  };
  
  const availableCount = timeSlots.filter(s => s.status === 'available').length;
  const takenCount = timeSlots.filter(s => s.status === 'taken').length;
  const pendingCount = timeSlots.filter(s => s.status === 'pending').length;


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
            <h1>Clinic Schedule</h1>
            <p>Manage your clinic hours and appointments</p>
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

        <div className="schedule-stats-grid">

        <div className="schedule-stat-card">
            <div className="schedule-stat-icon today">
            <CheckCircle size={24} />
            </div>
            <div className="schedule-stat-content">
            <span className="schedule-stat-label">Patients Today</span>
            <span className="schedule-stat-value">{patientsToday}</span>
            </div>
        </div>
          <div className="schedule-stat-card">
            <div className="schedule-stat-icon patients">
              <Users size={24} />
            </div>
            <div className="schedule-stat-content">
              <span className="schedule-stat-label">Patients This Week</span>
              <span className="schedule-stat-value">{patientsThisWeek}</span>
            </div>
          </div>

          <div className="schedule-stat-card">
            <div className="schedule-stat-icon trend">
              <TrendingUp size={24} />
            </div>
            <div className="schedule-stat-content">
              <span className="schedule-stat-label">Patients This Month</span>
              <span className="schedule-stat-value">{patientsThisMonth}</span>
            </div>
          </div>



        </div>

        <div className="schedule-hours-section">
          <div className="schedule-section-header">
            <div className="schedule-section-title">
              <Clock size={24} />
              <h2>Clinic Hours</h2>
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

        <div className="schedule-calendar-section">
          <div className="schedule-calendar-header">
            <div className="schedule-calendar-title">
              <Calendar size={24} />
              <h2>Appointments Calendar</h2>
            </div>
            <div className="schedule-calendar-controls">
            <div className="schedule-view-toggle">
                <button 
                    className={viewMode === 'today' ? 'active' : ''}
                    onClick={() => setViewMode('today')}
                >
                    Today
                </button>
                <button 
                    className={viewMode === 'weekly' ? 'active' : ''}
                    onClick={() => setViewMode('weekly')}
                >
                    Weekly
                </button>
                <button 
                    className={viewMode === 'monthly' ? 'active' : ''}
                    onClick={() => setViewMode('monthly')}
                >
                    Monthly
                </button>
            </div>
              <div className="schedule-nav-controls">
                <button onClick={() => navigateDate(-1)}>
                  <ChevronLeft size={20} />
                </button>
                <span className="schedule-current-period">{formatDate(currentDate)}</span>
                <button onClick={() => navigateDate(1)}>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'today' && (
          <div>
            {timeSlots.length === 0 ? (
              <div className="schedule-hours-empty">
                <Clock size={48} />
                <p>No time slots available</p>
                <span>Generate default slots based on your clinic hours or add them manually</span>
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  {hasClinicHours && (
                    <button 
                      className="schedule-hours-btn"
                      onClick={handleGenerateDefaultSlots}
                      disabled={slotsLoading}
                    >
                      <Clock size={18} />
                      {slotsLoading ? 'Generating...' : 'Generate Default Slots'}
                    </button>
                  )}
                  <button 
                    className="schedule-add-slot-btn"
                    onClick={() => setShowSlotModal(true)}
                  >
                    <Plus size={18} />
                    Add Time Slot Manually
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="schedule-today-stats">
                <div className="schedule-today-stats-left">
                    <div className="schedule-today-stat-item available">
                      <span>Available</span>
                      <div>{availableCount}</div>
                    </div>
                    <div className="schedule-today-stat-item booked">
                      <span>Booked</span>
                      <div>{takenCount}</div>
                    </div>
                    <div className="schedule-today-stat-item pending">
                      <span>Pending</span>
                      <div>{pendingCount}</div>
                    </div>
                  </div>
                  <div className="schedule-slot-actions">
                    {isEditMode ? (
                      <button 
                        className="schedule-cancel-edit-btn"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    ) : (
                      <button 
                        className="schedule-edit-slots-btn"
                        onClick={() => setIsEditMode(true)}
                      >
                        <Edit3 size={18} />
                        Edit Time Slots
                      </button>
                    )}
                    <button 
                      className="schedule-add-slot-btn"
                      onClick={() => setShowSlotModal(true)}
                    >
                      <Plus size={18} />
                      Add Time Slot
                    </button>
                  </div>
                </div>

                <div className="schedule-slots-grid">
                  {timeSlots.map(slot => (
                    <div 
                      key={slot.id}
                      className={`schedule-time-slot ${slot.status} ${isEditMode ? 'edit-mode' : ''}`}
                      onClick={() => slot.status === 'pending' && setSelectedPendingSlot(slot)}
                    >
                      {isEditMode && (
                        <button 
                          className="schedule-slot-delete-btn"
                          onClick={() => setSlotToDelete(slot)}
                        >
                          <X size={16} />
                        </button>
                      )}
                      <div className="schedule-slot-header">
                        <span className="schedule-slot-time">{slot.time}</span>
                        <div className="schedule-slot-indicator"></div>
                      </div>
                      {slot.patient ? (
                        <div className="schedule-slot-patient">{slot.patient}</div>
                      ) : (
                        <div className="schedule-slot-available">Available</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {viewMode === 'weekly' && (
        <div className="schedule-calendar-weekly">
            <div className="schedule-calendar-grid">
            {getWeekDays(currentDate).map((day, index) => (
                <div key={index} className="schedule-calendar-day">
                <div className="schedule-calendar-day-header">
                    <span className="schedule-day-name">{dayLabels[index]}</span>
                    <span className="schedule-day-date">{day.getDate()}</span>
                </div>
                <div className="schedule-calendar-day-content"></div>
                </div>
            ))}
            </div>
        </div>
        )}

        {viewMode === 'monthly' && (
        <div className="schedule-calendar-monthly">
            <div className="schedule-calendar-month-grid">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="schedule-month-day-header">{day}</div>
            ))}
            {getMonthDays(currentDate).map((day, index) => (
                <div 
                key={index} 
                className={`schedule-month-day ${!day ? 'empty' : ''} ${day && day.toDateString() === new Date().toDateString() ? 'today' : ''}`}
                >
                {day && (
                    <>
                    <span className="schedule-month-day-number">{day.getDate()}</span>
                    <div className="schedule-month-day-content"></div>
                    </>
                )}
                </div>
            ))}
            </div>
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

        {showSlotModal && (
        <div className="schedule-modal-overlay" onClick={() => setShowSlotModal(false)}>
            <div className="schedule-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="schedule-modal-close" onClick={() => setShowSlotModal(false)}>
                <X size={24} />
            </button>

            <div className="schedule-modal-header">
                <Clock size={48} />
                <h2>Add Time Slot</h2>
                <p>Create a new appointment time slot</p>
            </div>

            <div className="schedule-modal-body">
                <label className="schedule-day-label">Select Time</label>
                <div className="time-select-wrapper">
                <input
                    type="text"
                    className="time-input"
                    placeholder="e.g., 05:00 PM"
                    value={newSlotTime}
                    onChange={(e) => setNewSlotTime(e.target.value)}
                    list="slot-times"
                    style={{ width: '100%', marginBottom: '1.5rem' }}
                />
                <datalist id="slot-times">
                    {timeOptions.map(time => (
                    <option key={time} value={time} />
                    ))}
                </datalist>
                </div>

                <button className="schedule-save-btn" onClick={handleAddSlot}>
                <Save size={20} />
                Add Slot
                </button>
            </div>
            </div>
        </div>
        )}

        {/* Approval Modal */}
        {selectedPendingSlot && (
          <div className="schedule-modal-overlay" onClick={() => setSelectedPendingSlot(null)}>
            <div className="schedule-approval-modal" onClick={(e) => e.stopPropagation()}>
              <button className="schedule-modal-close" onClick={() => setSelectedPendingSlot(null)}>
                <X size={24} />
              </button>

              <div className="schedule-approval-header">
                <CheckCircle size={48} />
                <h2>Approve Appointment</h2>
                <p>Assign a veterinarian to this appointment</p>
              </div>

              <div className="schedule-approval-body">
                <div className="schedule-approval-info">
                  <div className="schedule-approval-info-item">
                    <Clock size={20} />
                    <div>
                      <span className="info-label">Time Slot</span>
                      <span className="info-value">{selectedPendingSlot.time}</span>
                    </div>
                  </div>
                  <div className="schedule-approval-info-item">
                    <Users size={20} />
                    <div>
                      <span className="info-label">Patient</span>
                      <span className="info-value">{selectedPendingSlot.patient}</span>
                    </div>
                  </div>
                </div>

                <div className="schedule-vet-selection">
                  <label className="schedule-vet-label">
                    <Users size={20} />
                    Assign Veterinarian
                  </label>
                  
                  {veterinarians.length === 0 ? (
                    <div className="schedule-no-vets">
                      <p>No veterinarians available</p>
                      <span>Please add veterinarians to your clinic first</span>
                    </div>
                  ) : (
                    <div className="schedule-vets-list">
                      {veterinarians.map((vet) => (
                        <div
                          key={vet.vt_id}
                          className={`schedule-vet-card ${selectedVeterinarian?.vt_id === vet.vt_id ? 'selected' : ''}`}
                          onClick={() => setSelectedVeterinarian(vet)}
                        >
                          <div className="schedule-vet-info">
                            <div className="schedule-vet-name">
                              Dr. {vet.usr_firstName} {vet.usr_lastName}
                            </div>
                            <div className="schedule-vet-specialization">
                              {vet.vt_specialization}
                            </div>
                          </div>
                          <div className="schedule-vet-badge">
                            {vet.vt_patientsAssigned} patients
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="schedule-approval-actions">
                  <button 
                    className="schedule-approval-cancel"
                    onClick={() => {
                      setSelectedPendingSlot(null);
                      setSelectedVeterinarian(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="schedule-approval-confirm"
                    onClick={() => handleApproveSlot(selectedPendingSlot)}
                    disabled={!selectedVeterinarian}
                  >
                    <CheckCircle size={20} />
                    Confirm Assignment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {slotToDelete && (
          <div className="schedule-modal-overlay" onClick={() => setSlotToDelete(null)}>
            <div className="schedule-delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="schedule-delete-confirm-header">
                <h3>Delete Time Slot</h3>
                <p>Are you sure you want to delete time slot <strong>{slotToDelete.time}</strong>?</p>
              </div>
              <div className="schedule-delete-confirm-actions">
                <button 
                  className="schedule-delete-cancel-btn"
                  onClick={() => setSlotToDelete(null)}
                >
                  Cancel
                </button>
                <button 
                  className="schedule-delete-confirm-btn"
                  onClick={() => handleDeleteSlot(slotToDelete.id)}
                >
                  Yes, Delete
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