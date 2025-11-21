// Pet Owner Navbar Component
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Bell, PawPrint, Stethoscope, ChevronLeft } from 'lucide-react';
import '../styles/petowner-navbar.css';


const PetOwnerNavbar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/petowner-dashboard' },
    { icon: MessageCircle, label: 'Chat', path: '/petowner-chat' },
    { icon: Bell, label: 'Reminders', path: '/petowner-reminders' },
    { icon: PawPrint, label: 'My Pets', path: '/petowner-mypets' },
    { icon: Stethoscope, label: 'My Vet', path: '/petowner-myvet' },
  ];

  return (
    <div className={`sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {sidebarOpen && <h2 className="sidebar-title">PetCare</h2>}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="sidebar-toggle"
        >
          <ChevronLeft
            size={24}
            color="#6c757d"
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
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            >
            <div
                className={`nav-content ${
                item.label === 'My Pets' && location.pathname === '/petowner-mypets'
                    ? 'mypets-active'
                    : isActive
                    ? 'active'
                    : ''
                }`}
            >
                <div className="nav-icon">
                <item.icon
                    size={24}
                    color={
                    item.label === 'My Pets' && location.pathname === '/petowner-mypets'
                        ? '#374e54'
                        : isActive
                        ? '#374e54'
                        : '#6c757d'
                    }
                />
                </div>
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </div>
            </div>

          );
        })}
      </nav>
    </div>
  );
};

export default PetOwnerNavbar;
