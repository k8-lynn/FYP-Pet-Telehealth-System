import React from "react";
import "./styles/header.css";
import { useNavigate } from "react-router-dom"; // This is correct

function Header() {
  const navigate = useNavigate();

  return (
    <header className="header-container">
      {/* Logo */}
      <div className="logo">
        <span className="logo-dark">YOUR</span>
        <span className="logo-accent">KITTEN</span>
      </div>

      {/* Navigation Links */}
      <nav className="nav-links">
        <a href="#about" className="nav-link">About Us</a>
        <a href="#services" className="nav-link">Services</a>
        <a href="#contact" className="nav-link">Contact Us</a>
      </nav>

      {/* Buttons */}
      <div className="button-group">
        <button className="btn login" onClick={() => navigate('/login')}>Login</button>
        <button className="btn register" onClick={() => navigate('/register')}>Register</button>
      </div>
    </header>
  );
}

export default Header;
