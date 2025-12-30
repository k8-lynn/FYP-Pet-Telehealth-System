// Vet Admin Navbar Component
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  Users,
  Stethoscope,
  Clock,
  ChevronLeft
} from 'lucide-react';
import '../styles/vetadmin-navbar.css';

const VetAdminNavbar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/vetadmin-dashboard' },
    { icon: Calendar, label: 'Appointments', path: '/vetadmin-appointments' },
    { icon: Stethoscope, label: 'All My Veterinarians', path: '/vetadmin-myveterinarians' },
    { icon: Users, label: 'All My Patients', path: '/vetadmin-mypatients' },
    { icon: Clock, label: 'Schedules', path: '/vetadmin-schedules' }
  ];

  return (
    <div className={`vetadmin-sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
      <div className="vetadmin-sidebar-header">
        {sidebarOpen && (
          <h2 className="vetadmin-sidebar-title">PawCare</h2>
        )}

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="vetadmin-sidebar-toggle"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft
            size={24}
            color="#ffffff"
            style={{
              transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.3s ease'
            }}
          />
        </button>
      </div>

      <nav className="vetadmin-sidebar-nav">
        {navItems.map((item, idx) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={idx}
              to={item.path}
              className={`vetadmin-nav-item ${isActive ? 'active' : ''}`}
            >
              <div
                className={`vetadmin-nav-content ${isActive ? 'active' : ''}`}
              >
                <div className="vetadmin-nav-icon">
                  <item.icon
                    size={24}
                    color={isActive ? '#ffffff' : '#cae0fdff'}
                  />
                </div>

                {sidebarOpen && (
                  <span className="vetadmin-nav-label">
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default VetAdminNavbar;