import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Calendar, Users, ChevronLeft } from 'lucide-react';
import '../styles/vet-navbar.css';

const VetNavbar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/vet-dashboard' },
    { icon: MessageCircle, label: 'Chat', path: '/vet-chat' },
    { icon: Calendar, label: 'Appointments', path: '/vet-appointments' },
    { icon: Users, label: 'All My Patients', path: '/vet-mypatients' },
  ];

  return (
    <div className={`vet-sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
      <div className="vet-sidebar-header">
        {sidebarOpen && <h2 className="vet-sidebar-title">PawCare</h2>}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="vet-sidebar-toggle"
        >
          <ChevronLeft
            size={24}
            color="#ffffff"
            style={{
              transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.3s ease',
            }}
          />
        </button>
      </div>

      <nav>
        {navItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <div
              key={idx}
              className={`vet-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <div className={`vet-nav-content ${isActive ? 'active' : ''}`}>
                <div className="vet-nav-icon">
                  <item.icon
                    size={24}
                    color={isActive ? '#ffffff' : '#cae0fdff'}
                  />
                </div>
                {sidebarOpen && <span className="vet-nav-label">{item.label}</span>}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default VetNavbar;