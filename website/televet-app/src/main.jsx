// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Login from './login';
import Register from './register';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/index.css';
import ProtectedRoute from './ProtectedRoute.jsx';
// Import NotificationProvider
import { NotificationProvider } from "./components/NotificationProvider";

import PetOwnerDashboard from './petowner-dashboard';
import PetOwnerMyPets from './petowner-mypets';
import PetOwnerReminders from './petowner-reminders';
import PetOwnerMyVet from './petowner-myvet';

import VetAdminDashboard from './vetadmin-dashboard.jsx';
import VetAdminVeterinarians from './vetadmin-myveterinarians.jsx';
import VetAdminSchedules from './vetadmin-schedules.jsx';
import VetAdminAppointments from './vetadmin-appointments.jsx';
import VetAdminPatients from './vetadmin-mypatients.jsx';

import VetDashboard from './vet-dashboard.jsx';
import VetPatients from './vet-mypatients.jsx';

import MyProfile from './myprofile.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* ✅ Wrap everything with NotificationProvider */}
      <NotificationProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/petowner-dashboard"
            element={
              <ProtectedRoute allowedType="petParent">
                <PetOwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/petowner-mypets"
            element={
              <ProtectedRoute allowedType="petParent">
                <PetOwnerMyPets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/petowner-reminders"
            element={
              <ProtectedRoute allowedType="petParent">
                <PetOwnerReminders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/petowner-myvet"
            element={
              <ProtectedRoute allowedType="petParent">
                <PetOwnerMyVet />
              </ProtectedRoute>
            }
          />

          <Route
            path="/vetadmin-dashboard"
            element={
              <ProtectedRoute allowedType="vetAdmin">
                <VetAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vetadmin-myveterinarians"
            element={
              <ProtectedRoute allowedType="vetAdmin">
                <VetAdminVeterinarians />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vetadmin-mypatients"
            element={
              <ProtectedRoute allowedType="vetAdmin">
                <VetAdminPatients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vetadmin-schedules"
            element={
              <ProtectedRoute allowedType="vetAdmin">
                <VetAdminSchedules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vetadmin-appointments"
            element={
              <ProtectedRoute allowedType="vetAdmin">
                <VetAdminAppointments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/myprofile"
            element={
              <ProtectedRoute allowedType={["petParent", "vetAdmin"]}>
                <MyProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/vet-dashboard"
            element={
              <ProtectedRoute allowedType="veterinarian">
                <VetDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vet-mypatients"
            element={
              <ProtectedRoute allowedType="veterinarian">
                <VetPatients />
              </ProtectedRoute>
            }
          />
        </Routes>
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>
);