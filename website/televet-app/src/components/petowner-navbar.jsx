// Pet Owner Navbar Component
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  MessageCircle,
  Bell,
  PawPrint,
  Stethoscope,
  ChevronLeft
} from 'lucide-react';
import '../styles/petowner-navbar.css';

const PetOwnerNavbar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/petowner-dashboard' },
    { icon: MessageCircle, label: 'Chat', path: '/petowner-chat' },
    { icon: Bell, label: 'Reminders', path: '/petowner-reminders' },
    { icon: PawPrint, label: 'My Pets', path: '/petowner-mypets' },
    { icon: Stethoscope, label: 'My Vet', path: '/petowner-myvet' }
  ];

  return (
    <div className={`sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {sidebarOpen && <h2 className="sidebar-title">PetCare</h2>}

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="sidebar-toggle"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft
            size={24}
            color="#6c757d"
            style={{
              transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.3s ease'
            }}
          />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, idx) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={idx}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <div
                className={`nav-content ${
                  item.label === 'My Pets' && isActive
                    ? 'mypets-active'
                    : isActive
                    ? 'active'
                    : ''
                }`}
              >
                <div className="nav-icon">
                  <item.icon
                    size={24}
                    color={isActive ? '#374e54' : '#6c757d'}
                  />
                </div>

                {sidebarOpen && (
                  <span className="nav-label">{item.label}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default PetOwnerNavbar;
