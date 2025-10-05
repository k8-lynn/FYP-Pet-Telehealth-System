// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Login from './login';
import Register from './register';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/index.css'; // keep your styles
import PetOwnerDashboard from './petowner-dashboard';
import PetOwnerMyPets from './petowner-mypets';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/petowner-dashboard" element={<PetOwnerDashboard />} />
        <Route path="/petowner-mypets" element={<PetOwnerMyPets />} />
        {/* Add more routes as needed */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
