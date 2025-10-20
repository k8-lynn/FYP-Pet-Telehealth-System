// ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ allowedType, children }) => {
  const userType = sessionStorage.getItem("userType"); // ✅ changed from localStorage

  // If not logged in, redirect to login
  if (!userType) {
    return <Navigate to="/login" replace />;
  }

  // If allowedType is an array (like in /myprofile route)
  if (Array.isArray(allowedType)) {
    if (!allowedType.includes(userType)) {
      return <Navigate to="/login" replace />;
    }
  } 
  // Otherwise, single type
  else if (userType !== allowedType) {
    return <Navigate to="/login" replace />;
  }

  // ✅ All good
  return children;
};

export default ProtectedRoute;
