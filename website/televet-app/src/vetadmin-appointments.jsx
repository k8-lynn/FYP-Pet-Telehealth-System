//vetadmin-appointments.jsx
import React, { useState, useEffect, useRef } from "react";
import { Calendar, Clock, Edit3, ChevronLeft, ChevronRight, Users, TrendingUp, X, Save, MapPin, Plus, CheckCircle } from 'lucide-react';
import { io } from "socket.io-client";

import './styles/vetadmin-schedules.css';
import VetAdminNavbar from './components/vetadmin-navbar';
import PawPattern from "./components/PawPattern";
import ProfileNotification from "./components/ProfileNotification";

const VetAdminAppointments = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [clinicHours, setClinicHours] = useState(null);
  const [viewMode, setViewMode] = useState('today');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointmentsThisWeek, setAppointmentsThisWeek] = useState(0);
  const [appointmentsThisMonth, setAppointmentsThisMonth] = useState(0);
  const [appointmentsToday, setAppointmentsToday] = useState(0);  
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
  const socketRef = useRef(null);

  const [timeSlots, setTimeSlots] = useState({
    physical: {},
    online: {}
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateSlotModal, setShowDateSlotModal] = useState(false);
  const [weekSlotCounts, setWeekSlotCounts] = useState({});
  const [monthSlotCounts, setMonthSlotCounts] = useState({});
  const [consultationType, setConsultationType] = useState('physical'); // Add this state

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

  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

  useEffect(() => {
    if (!clinic_id) return;
    
    // Fetch both physical and online slots
    if (viewMode === 'today') {
      fetchClinicSlotsByDate(clinic_id, currentDate, 'physical');
      fetchClinicSlotsByDate(clinic_id, currentDate, 'online');
    } else if (viewMode === 'weekly') {
      const weekDays = getWeekDays(currentDate);
      fetchClinicSlotsRange(clinic_id, weekDays[0], weekDays[6], 'physical');
      fetchClinicSlotsRange(clinic_id, weekDays[0], weekDays[6], 'online');
    } else if (viewMode === 'monthly') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      fetchClinicSlotsRange(clinic_id, new Date(year, month, 1), new Date(year, month + 1, 0), 'physical');
      fetchClinicSlotsRange(clinic_id, new Date(year, month, 1), new Date(year, month + 1, 0), 'online');
    }
  }, [clinic_id, currentDate, viewMode]);

  useEffect(() => {
    if (showDateSlotModal && selectedDate && clinic_id) {
      fetchClinicSlotsByDate(clinic_id, selectedDate, consultationType);
    }
  }, [showDateSlotModal, selectedDate, clinic_id, consultationType]);

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

  socket.on("slotUpdated", (data) => {
    if (data.clinic_id == clinic_id) {
      fetchAppointmentCounts(clinic_id);
      
      if (viewMode === "today") {
        fetchClinicSlotsByDate(clinic_id, currentDate, 'physical');
        fetchClinicSlotsByDate(clinic_id, currentDate, 'online');
      } else if (viewMode === "weekly") {
        const weekDays = getWeekDays(currentDate);
        fetchClinicSlotsRange(clinic_id, weekDays[0], weekDays[6], 'physical');
        fetchClinicSlotsRange(clinic_id, weekDays[0], weekDays[6], 'online');
      } else if (viewMode === "monthly") {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        fetchClinicSlotsRange(clinic_id, new Date(year, month, 1), new Date(year, month + 1, 0), 'physical');
        fetchClinicSlotsRange(clinic_id, new Date(year, month, 1), new Date(year, month + 1, 0), 'online');
      }
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

  useEffect(() => {
    if (!socketRef.current || !clinic_id) return;

    const socket = socketRef.current;

    const handleSlotUpdate = (data) => {
      if (data.clinic_id == clinic_id) {
        fetchAppointmentCounts(clinic_id);

        if (viewMode === "today") {
          fetchClinicSlotsByDate(clinic_id, currentDate, 'physical');
          fetchClinicSlotsByDate(clinic_id, currentDate, 'online');
        } else if (viewMode === "weekly") {
          const weekDays = getWeekDays(currentDate);
          fetchClinicSlotsRange(clinic_id, weekDays[0], weekDays[6], 'physical');
          fetchClinicSlotsRange(clinic_id, weekDays[0], weekDays[6], 'online');
        } else if (viewMode === "monthly") {
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth();
          fetchClinicSlotsRange(clinic_id, new Date(year, month, 1), new Date(year, month + 1, 0), 'physical');
          fetchClinicSlotsRange(clinic_id, new Date(year, month, 1), new Date(year, month + 1, 0), 'online');
        }
      }
    };

    socket.off("slotUpdated");
    socket.on("slotUpdated", handleSlotUpdate);

    return () => {
      socket.off("slotUpdated", handleSlotUpdate);
    };
  }, [clinic_id, viewMode, currentDate]);
  

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
        fetchClinicHours(data.clinic_id);
        fetchAppointmentCounts(data.clinic_id);
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
      
      if (data) {
        setClinicHours(data);
        
        const newForm = {};
        daysOfWeek.forEach(day => {
          const dbField = `${day}_hours`;
          const rawData = data[dbField];
          newForm[day] = parseClinicHours(rawData);
        });
        
        setHoursForm(newForm);
      }
    } catch (error) {
      console.error("Error fetching clinic hours:", error);
    }
  };

  const fetchClinicSlotsByDate = async (clinicId, date, type = consultationType) => {
    const dateKey = formatDateKey(date);
    try {
      const res = await fetch(`http://localhost:5000/api/clinic-slots/${clinicId}/date/${dateKey}/${type || consultationType}`);
      const data = await res.json();
      
      if (data && data.slots) {
        setTimeSlots(prev => ({
          ...prev,
          [type]: {  // ✅ CORRECT - use the type parameter
            ...prev[type],
            [dateKey]: data.slots
          }
        }));
      } else {
        setTimeSlots(prev => ({
          ...prev,
          [type]: {
            ...prev[type],
            [dateKey]: []
          }
        }));
      }
    } catch (error) {
      console.error("Error fetching clinic slots for date:", error);
    }
  };

  const fetchClinicSlotsRange = async (clinicId, startDate, endDate, type = consultationType) => {
    const startKey = formatDateKey(startDate);
    const endKey = formatDateKey(endDate);
    
    try {
      const res = await fetch(`http://localhost:5000/api/clinic-slots/${clinicId}/range/${type}?startDate=${startKey}&endDate=${endKey}`);
      const data = await res.json();
      
      if (data && data.slots) {
        if (viewMode === 'weekly') {
          setWeekSlotCounts(prev => ({
            ...prev,
            [type]: data.slots
          }));
        } else if (viewMode === 'monthly') {
          setMonthSlotCounts(prev => ({
            ...prev,
            [type]: data.slots
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching clinic slots range:", error);
    }
  };

  const fetchAppointmentCounts = async (clinicId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/clinic-appointments-count/${clinicId}`);
      const data = await res.json();
      
      if (res.ok) {
        setAppointmentsToday(data.today);
        setAppointmentsThisWeek(data.thisWeek);
        setAppointmentsThisMonth(data.thisMonth);
      }
    } catch (error) {
      console.error("Error fetching appointment counts:", error);
    }
  };

  const handleGenerateDefaultSlots = async () => {
    if (!clinic_id) {
      alert("Clinic not found");
      return;
    }

    setSlotsLoading(true);
    try {
      const todayKey = formatDateKey(currentDate);
      const res = await fetch(`http://localhost:5000/api/clinic-slots/generate/${clinic_id}/date/${todayKey}/${consultationType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      
      if (res.ok) {
        setTimeSlots(prev => ({
          ...prev,
          [consultationType]: {
            ...prev[consultationType],
            [todayKey]: data.slots
          }
        }));
        alert(`Default ${consultationType} time slots generated successfully!`);
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

  const handleGenerateWeekSlots = async () => {
    if (!clinic_id) {
      alert("Clinic not found");
      return;
    }
  
    const weekDays = getWeekDays(currentDate);
    setSlotsLoading(true);
    
    try {
      const promises = weekDays.map(day => {
        const dateKey = formatDateKey(day);
        return fetch(`http://localhost:5000/api/clinic-slots/generate/${clinic_id}/date/${dateKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      });
  
      const responses = await Promise.all(promises);
      const slotsData = await Promise.all(responses.map(res => res.json()));
      
      const newTimeSlots = {};
      weekDays.forEach((day, index) => {
        const dateKey = formatDateKey(day);
        if (slotsData[index] && slotsData[index].slots) {
          newTimeSlots[dateKey] = slotsData[index].slots;
        }
      });
      
      setTimeSlots(prev => ({
        ...prev,
        ...newTimeSlots
      }));
      
      alert("Time slots generated for the entire week!");
      fetchClinicSlotsRange(clinic_id, weekDays[0], weekDays[6]);
    } catch (error) {
      console.error("Error generating week slots:", error);
      alert("An error occurred while generating week slots");
    } finally {
      setSlotsLoading(false);
    }
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
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1);
  
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      day.setHours(0, 0, 0, 0);
      week.push(day);
    }
    return week;
  };

  const getMonthDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    firstDay.setHours(0, 0, 0, 0);
    
    const lastDay = new Date(year, month + 1, 0);
    lastDay.setHours(0, 0, 0, 0);
    
    const days = [];
  
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
  
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(year, month, i);
      day.setHours(0, 0, 0, 0);
      days.push(day);
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
  
    const targetDate = selectedDate || currentDate;
    const dateKey = formatDateKey(targetDate);
    const existingSlots = timeSlots[consultationType]?.[dateKey] || [];
  
    const newSlot = {
      id: existingSlots.length > 0 ? Math.max(...existingSlots.map(s => s.id)) + 1 : 1,
      time: newSlotTime,
      status: 'available',
      patient: null
    };
  
    const updatedSlots = [...existingSlots, newSlot].sort((a, b) => {
      const timeA = new Date('1970/01/01 ' + a.time);
      const timeB = new Date('1970/01/01 ' + b.time);
      return timeA - timeB;
    });
  
    try {
      const res = await fetch(`http://localhost:5000/api/clinic-slots/${clinic_id}/date/${dateKey}/${consultationType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: updatedSlots })
      });
  
      if (res.ok) {
        setTimeSlots(prev => ({
          ...prev,
          [consultationType]: {
            ...prev[consultationType],
            [dateKey]: updatedSlots
          }
        }));
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

  const handleGenerateDefaultSlotsForDate = async (date) => {
    if (!clinic_id) {
      alert("Clinic not found");
      return;
    }
  
    const dateKey = formatDateKey(date);
    setSlotsLoading(true);
    
    try {
      const res = await fetch(`http://localhost:5000/api/clinic-slots/generate/${clinic_id}/date/${dateKey}/${consultationType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
  
      const data = await res.json();
      
      if (res.ok) {
        setTimeSlots(prev => ({
          ...prev,
          [dateKey]: data.slots
        }));
        alert("Default time slots generated successfully!");
        
        if (viewMode === 'weekly') {
          const weekDays = getWeekDays(currentDate);
          fetchClinicSlotsRange(clinic_id, weekDays[0], weekDays[6]);
        } else if (viewMode === 'monthly') {
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth();
          fetchClinicSlotsRange(clinic_id, new Date(year, month, 1), new Date(year, month + 1, 0));
        }
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

  const handleDeleteSlot = async (slotId) => {
    if (!clinic_id) {
      alert('Clinic not found');
      return;
    }
  
    const targetDate = selectedDate || currentDate;
    const dateKey = formatDateKey(targetDate);
    const existingSlots = timeSlots[consultationType]?.[dateKey] || [];
    
    const updatedSlots = existingSlots.filter(slot => slot.id !== slotId);
  
    try {
      const res = await fetch(`http://localhost:5000/api/clinic-slots/${clinic_id}/date/${dateKey}/${consultationType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: updatedSlots })
      });
  
      if (res.ok) {
        setTimeSlots(prev => ({
          ...prev,
          [consultationType]: {
            ...prev[consultationType],
            [dateKey]: updatedSlots
          }
        }));
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

  // Replace the handleApproveSlot function in vetadmin-appointments.jsx

const handleApproveSlot = async (slot) => {
  if (!selectedVeterinarian) {
    alert('Please select a veterinarian');
    return;
  }

  const targetDate = selectedDate || currentDate;
  const dateKey = formatDateKey(targetDate);
  const existingSlots = timeSlots[dateKey] || [];

  // First, update the appointment status in the database if there's a petId
  if (slot.petId) {
    try {
      // Update pet's assigned vet
      const assignVetRes = await fetch(`http://localhost:5000/api/patients/${slot.petId}/assign-vet`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vt_id: selectedVeterinarian.vt_id })
      });

      if (!assignVetRes.ok) {
        alert('Failed to assign veterinarian to patient');
        return;
      }
    } catch (error) {
      console.error('Error assigning vet:', error);
      alert('An error occurred while assigning veterinarian');
      return;
    }
  }

  // Update the slot
  const updatedSlots = existingSlots.map(s => 
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
    const res = await fetch(`http://localhost:5000/api/clinic-slots/${clinic_id}/date/${dateKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slots: updatedSlots })
    });

    if (res.ok) {
      setTimeSlots(prev => ({
        ...prev,
        [dateKey]: updatedSlots
      }));
      setShowApprovalModal(false);
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

  const todayKey = formatDateKey(currentDate);
  const todaySlots = timeSlots[consultationType]?.[todayKey] || [];
  const availableCount = todaySlots.filter(s => s.status === 'available').length;
  const takenCount = todaySlots.filter(s => s.status === 'taken').length;
  const pendingCount = todaySlots.filter(s => s.status === 'pending').length;

  return (
    <div className="schedule-dashboard-container">
      <PawPattern count={35} />
      <VetAdminNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="schedule-main-content">
        <div className="schedule-header-top">
          <div className="location-info">
            <MapPin size={20} className="location-icon" />
            <span className="location-text">{clinicInfo.clinicName || 'PawCare Veterinary Clinic'}</span>
          </div>
          <ProfileNotification firstName={firstName} />
        </div>

        <div className="schedule-header">
          <div className="schedule-header-text">
            <h1>Appointments Calendar</h1>
            <p>Manage your clinic appointments and time slots</p>
          </div>
        </div>

        <div className="schedule-stats-grid">
          <div className="schedule-stat-card">
            <div className="schedule-stat-icon today">
              <CheckCircle size={24} />
            </div>
            <div className="schedule-stat-content">
              <span className="schedule-stat-label">Appointments Today</span>
              <span className="schedule-stat-value">{appointmentsToday}</span>
            </div>
          </div>

          <div className="schedule-stat-card">
            <div className="schedule-stat-icon patients">
              <Users size={24} />
            </div>
            <div className="schedule-stat-content">
              <span className="schedule-stat-label">Appointments This Week</span>
              <span className="schedule-stat-value">{appointmentsThisWeek}</span>
            </div>
          </div>

          <div className="schedule-stat-card">
            <div className="schedule-stat-icon trend">
              <TrendingUp size={24} />
            </div>
            <div className="schedule-stat-content">
              <span className="schedule-stat-label">Appointments This Month</span>
              <span className="schedule-stat-value">{appointmentsThisMonth}</span>
            </div>
          </div>
        </div>


        <div className="schedule-calendar-section">
          <div className="schedule-calendar-header">
            <div className="schedule-calendar-title">
              <Calendar size={24} />
              <h2>Appointments</h2>
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

              <div className="schedule-consultation-toggle" style={{ marginLeft: '1rem' }}>
                <button 
                  className={consultationType === 'physical' ? 'active' : ''}
                  onClick={() => setConsultationType('physical')}
                >
                  Physical
                </button>
                <button 
                  className={consultationType === 'online' ? 'active' : ''}
                  onClick={() => setConsultationType('online')}
                >
                  Online
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
              {todaySlots.length === 0 ? (
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
                    {todaySlots.map(slot => (
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
              <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <button 
                  className="schedule-hours-btn"
                  onClick={handleGenerateWeekSlots}
                  disabled={slotsLoading}
                >
                  <Calendar size={18} />
                  {slotsLoading ? 'Generating...' : 'Generate Slots for This Week'}
                </button>
              </div>
              <div className="schedule-calendar-grid">
                {getWeekDays(currentDate).map((day, index) => {
                  const dateKey = formatDateKey(day);
                  const dayCounts = weekSlotCounts[consultationType]?.[dateKey] || { available: 0, booked: 0, pending: 0, total: 0 };
                  
                  return (
                    <div 
                      key={index} 
                      className="schedule-calendar-day clickable"
                      onClick={() => {
                        setSelectedDate(day);
                        setShowDateSlotModal(true);
                      }}
                    >
                      <div className="schedule-calendar-day-header">
                        <span className="schedule-day-name">{dayLabels[index]}</span>
                        <span className="schedule-day-date">{day.getDate()}</span>
                      </div>
                      <div className="schedule-calendar-day-content">
                        {dayCounts.total === 0 ? (
                          <div className="schedule-no-slots-badge">No slots set</div>
                        ) : (
                          <div className="schedule-day-stats">
                            <div className="schedule-day-stat available">
                              <span className="stat-count">{dayCounts.available}</span>
                              <span className="stat-label">Available</span>
                            </div>
                            <div className="schedule-day-stat booked">
                              <span className="stat-count">{dayCounts.booked}</span>
                              <span className="stat-label">Booked</span>
                            </div>
                            {dayCounts.pending > 0 && (
                              <div className="schedule-day-stat pending">
                                <span className="stat-count">{dayCounts.pending}</span>
                                <span className="stat-label">Pending</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'monthly' && (
            <div className="schedule-calendar-monthly">
              <div className="schedule-calendar-month-grid">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="schedule-month-day-header">{day}</div>
                ))}
                {getMonthDays(currentDate).map((day, index) => {
                  if (!day) {
                    return <div key={index} className="schedule-month-day empty"></div>;
                  }
                  
                  const dateKey = formatDateKey(day);
                  const dayCounts = monthSlotCounts[consultationType]?.[dateKey] || { available: 0, booked: 0, pending: 0, total: 0 };
                  const isToday = day.toDateString() === new Date().toDateString();
                  
                  return (
                    <div 
                      key={index} 
                      className={`schedule-month-day ${isToday ? 'today' : ''} clickable`}
                      onClick={() => {
                        setSelectedDate(day);
                        setShowDateSlotModal(true);
                      }}
                    >
                      <span className="schedule-month-day-number">{day.getDate()}</span>
                      <div className="schedule-month-day-content">
                        {dayCounts.total > 0 && (
                          <div className="schedule-month-day-dots">
                            <div className="schedule-month-stat-mini">
                              <span className="available-dot"></span>
                              <span>{dayCounts.available}</span>
                            </div>
                            <div className="schedule-month-stat-mini">
                              <span className="booked-dot"></span>
                              <span>{dayCounts.booked}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

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

        {showDateSlotModal && selectedDate && (
          <div className="schedule-modal-overlay" onClick={() => setShowDateSlotModal(false)}>
            <div className="schedule-modal-content schedule-date-modal" onClick={(e) => e.stopPropagation()}>
              <button className="schedule-modal-close" onClick={() => setShowDateSlotModal(false)}>
                <X size={24} />
              </button>

              <div className="schedule-modal-header">
                <Calendar size={48} />
                <h2>Manage Time Slots</h2>
                <p>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>

              <div className="schedule-modal-body">
                {(() => {
                  const dateKey = formatDateKey(selectedDate);
                  const dateSlots = timeSlots[consultationType]?.[dateKey] || [];
                  
                  if (dateSlots.length === 0) {
                    return (
                      <div className="schedule-hours-empty">
                        <Clock size={48} />
                        <p>No time slots set for this date</p>
                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                          <button 
                            className="schedule-hours-btn"
                            onClick={() => handleGenerateDefaultSlotsForDate(selectedDate)}
                          >
                            <Clock size={18} />
                            Generate Slots for This Day
                          </button>
                          <button 
                            className="schedule-add-slot-btn"
                            onClick={() => {
                              setShowDateSlotModal(false);
                              setShowSlotModal(true);
                            }}
                          >
                            <Plus size={18} />
                            Add Slot Manually
                          </button>
                        </div>
                      </div>
                    );
                  }
                  
                  const available = dateSlots.filter(s => s.status === 'available').length;
                  const booked = dateSlots.filter(s => s.status === 'taken').length;
                  const pending = dateSlots.filter(s => s.status === 'pending').length;
                  
                  return (
                    <>
                      <div className="schedule-today-stats">
                        <div className="schedule-today-stats-left">
                          <div className="schedule-today-stat-item available">
                            <span>Available</span>
                            <div>{available}</div>
                          </div>
                          <div className="schedule-today-stat-item booked">
                            <span>Booked</span>
                            <div>{booked}</div>
                          </div>
                          <div className="schedule-today-stat-item pending">
                            <span>Pending</span>
                            <div>{pending}</div>
                          </div>
                        </div>
                        <button 
                          className="schedule-add-slot-btn"
                          onClick={() => {
                            setShowDateSlotModal(false);
                            setShowSlotModal(true);
                          }}
                        >
                          <Plus size={18} />
                          Add Time Slot
                        </button>
                      </div>

                      <div className="schedule-slots-grid" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {dateSlots.map(slot => (
                          <div 
                            key={slot.id}
                            className={`schedule-time-slot ${slot.status}`}
                            onClick={() => slot.status === 'pending' && setSelectedPendingSlot(slot)}
                          >
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
                  );
                })()}
              </div>
            </div>
          </div>
        )}

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

export default VetAdminAppointments;