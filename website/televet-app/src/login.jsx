import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles/login.module.css';
import showStyledAlert from './utils/styledAlert';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ✅ Enable cookies
        body: JSON.stringify(formData),
      });
      const data = await response.json();
  
      if (response.ok) {
        // ✅ Store in sessionStorage for backward compatibility with existing code
        sessionStorage.setItem('firstName', data.firstName);
        sessionStorage.setItem('userid', data.userId);
        sessionStorage.setItem('userType', data.userType);
  
        if (data.vt_id) {
          sessionStorage.setItem('vt_id', data.vt_id);
        }
        if (data.va_id) {
          sessionStorage.setItem('va_id', data.va_id);
        }
  
        setShowSuccess(true);
  
        // ✅ Navigate based on user type
        setTimeout(() => {
          if (data.userType === 'petParent') {
            navigate('/petowner-dashboard');
          } else if (data.userType === 'vetAdmin') {
            navigate('/vetadmin-dashboard');
          } else if (data.userType === 'veterinarian') {
            navigate('/vet-dashboard');
          } else {
            showStyledAlert('Login successful, but unknown user type.');
          }
        }, 2000);
      } else {
        showStyledAlert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      showStyledAlert('Something went wrong!');
    }
  };


  return (
    <div className={styles.loginWrapper}>
      {showSuccess && (
        <div className={styles.successOverlay}>
          <div className={styles.successModal}>
            {/* Paw Print Loading Animation */}
            <svg className={styles.svgSprite}>
              <symbol id="paw" viewBox="0 0 249 209.32">
                <ellipse cx="27.917" cy="106.333" strokeWidth="0" rx="27.917" ry="35.833"/>
                <ellipse cx="84.75" cy="47.749" strokeWidth="0" rx="34.75" ry="47.751"/>
                <ellipse cx="162" cy="47.749" strokeWidth="0" rx="34.75" ry="47.751"/>
                <ellipse cx="221.083" cy="106.333" strokeWidth="0" rx="27.917" ry="35.833"/>
                <path strokeWidth="0" d="M43.98 165.39s9.76-63.072 76.838-64.574c0 0 71.082-6.758 83.096 70.33 0 0 2.586 19.855-12.54 31.855 0 0-15.75 17.75-43.75-6.25 0 0-7.124-8.374-24.624-7.874 0 0-12.75-.125-21.5 6.625 0 0-16.375 18.376-37.75 12.75 0 0-28.29-7.72-19.77-42.86z"/>
              </symbol>
            </svg>

            <div className={styles.ajaxLoader}>
              <div className={styles.paw}><svg className={styles.icon}><use xlinkHref="#paw" /></svg></div>
              <div className={styles.paw}><svg className={styles.icon}><use xlinkHref="#paw" /></svg></div>
              <div className={styles.paw}><svg className={styles.icon}><use xlinkHref="#paw" /></svg></div>
              <div className={styles.paw}><svg className={styles.icon}><use xlinkHref="#paw" /></svg></div>
              <div className={styles.paw}><svg className={styles.icon}><use xlinkHref="#paw" /></svg></div>
              <div className={styles.paw}><svg className={styles.icon}><use xlinkHref="#paw" /></svg></div>
            </div>

            <h2 className={styles.successTitle}>Welcome Back!</h2>
            <p className={styles.successMessage}>Taking you to your dashboard...</p>
          </div>
        </div>
      )}
      
      <div className={styles.formSection}>
        <div className={styles.loginContainer}>
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <label>Email</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email}
                onChange={handleChange} 
                required 
              />
            </div>
            <div>
              <label>Password</label>
              <input 
                type="password" 
                name="password" 
                value={formData.password}
                onChange={handleChange} 
                required 
              />
            </div>
            <button type="submit">Login</button>
          </form>
          <div className={styles.registerLink}>
            <p>Do not have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>Register here</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;