// main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Login from "./login";
import Register from "./register";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles/index.css";
import ProtectedRoute from "./ProtectedRoute.jsx";
import { NotificationProvider } from "./components/NotificationProvider";
import GlobalIncomingCall from "./components/GlobalIncomingCall";
import VideoCall from "./components/VideoCall";
import { useOnlineStatus } from "./hooks/useOnlineStatus";

import PetOwnerDashboard from "./petowner-dashboard";
import PetOwnerMyPets from "./petowner-mypets";
import PetOwnerReminders from "./petowner-reminders";
import PetOwnerMyVet from "./petowner-myvet";
import PetOwnerChat from "./petowner-chat";

import VetAdminDashboard from "./vetadmin-dashboard.jsx";
import VetAdminVeterinarians from "./vetadmin-myveterinarians.jsx";
import VetAdminSchedules from "./vetadmin-schedules.jsx";
import VetAdminAppointments from "./vetadmin-appointments.jsx";
import VetAdminPatients from "./vetadmin-mypatients.jsx";

import VetDashboard from "./vet-dashboard.jsx";
import VetPatients from "./vet-mypatients.jsx";
import VetAppointments from "./vet-appointments.jsx";
import VetChat from "./vet-chat.jsx";

import MyProfile from "./myprofile.jsx";

// eslint-disable-next-line react-refresh/only-export-components
function AppWrapper() {
  const [userId, setUserId] = React.useState(null);
  const [_userType, setUserType] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showVideoCall, setShowVideoCall] = React.useState(false);
  const [videoCallData, setVideoCallData] = React.useState(null);

  // ✅ Check session on mount
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(
          "https://fyp-pet-telehealth-system.onrender.com/api/check-session",
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setUserId(data.userId);
            setUserType(data.userType);

            // Store in sessionStorage for backward compatibility
            sessionStorage.setItem("userid", data.userId);
            sessionStorage.setItem("userType", data.userType);
            sessionStorage.setItem("firstName", data.firstName);
            sessionStorage.setItem("lastName", data.lastName);

            if (data.vt_id) sessionStorage.setItem("vt_id", data.vt_id);
            if (data.va_id) sessionStorage.setItem("va_id", data.va_id);

            console.log("✅ Session restored:", data);
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // ✅ This will manage online status globally
  useOnlineStatus(userId);

  const handleAcceptCall = (callData) => {
    setVideoCallData(callData);
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.2rem",
          color: "#64748b",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <>
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
          path="/petowner-chat"
          element={
            <ProtectedRoute allowedType="petParent">
              <PetOwnerChat />
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
            <ProtectedRoute
              allowedType={["petParent", "vetAdmin", "veterinarian"]}
            >
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
        <Route
          path="/vet-appointments"
          element={
            <ProtectedRoute allowedType="veterinarian">
              <VetAppointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vet-chat"
          element={
            <ProtectedRoute allowedType="veterinarian">
              <VetChat />
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* ✅ Global incoming call notification */}
      <GlobalIncomingCall
        onAccept={handleAcceptCall}
        onSetShowVideoCall={setShowVideoCall}
      />

      {/* ✅ Global video call handler */}
      {showVideoCall && videoCallData && (
        <VideoCall
          socket={window.socket}
          currentUserId={userId}
          currentUserName={`${sessionStorage.getItem("firstName") || ""} ${
            sessionStorage.getItem("lastName") || ""
          }`}
          otherUserId={videoCallData.from}
          otherUserName={videoCallData.name}
          incomingCall={videoCallData}
          onClose={() => {
            setShowVideoCall(false);
            setVideoCallData(null);
          }}
        />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        {/* ✅ Use AppWrapper instead of Routes directly */}
        <AppWrapper />
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>
);
