import React from "react";
import "./styles/header.css";
import { useNavigate } from "react-router-dom"; // This is correct

function Header() {
  const navigate = useNavigate();

  return (
    <header className="header-container">
      {/* Logo */}
      <div className="logo">
        <span className="logo-primary">Telehealth</span>
        <span className="logo-secondary">Vet</span>
      </div>


      {/* Buttons */}
      <div className="button-group">
        <button className="btn login" onClick={() => navigate('/login')}>Login</button>
        <button className="btn register" onClick={() => navigate('/register')}>Register</button>
      </div>
    </header>
  );
}

export default Header;
