// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Login from './login';
import Register from './register';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/index.css'; // keep your styles

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Add more routes as needed */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
