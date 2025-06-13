import React, { useState } from 'react';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
  
      const data = await response.json();
      console.log(data);
      alert(data.message || "Registered!");
  
    } catch (err) {
      console.error('Error:', err);
      alert("Failed to register");
    }
  };
  

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>First Name:</label>
          <input 
            type="text" 
            name="firstName" 
            value={formData.firstName}
            onChange={handleChange}
            required 
          />
        </div>
        <div>
          <label>Last Name:</label>
          <input 
            type="text" 
            name="lastName" 
            value={formData.lastName}
            onChange={handleChange}
            required 
          />
        </div>
        <div>
          <label>Email:</label>
          <input 
            type="email" 
            name="email" 
            value={formData.email}
            onChange={handleChange}
            required 
          />
        </div>
        <div>
          <label>Password:</label>
          <input 
            type="password" 
            name="password" 
            value={formData.password}
            onChange={handleChange}
            required 
          />
        </div>
        <div>
          <label>Confirm Password:</label>
          <input 
            type="password" 
            name="confirmPassword" 
            value={formData.confirmPassword}
            onChange={handleChange}
            required 
          />
        </div>
        <div>
          <label>User Type:</label>
          <div>
            <label>
              <input
                type="radio"
                name="userType"
                value="petParent"
                checked={formData.userType === 'petParent'}
                onChange={handleChange}
              />
              Pet Parent
            </label>
            <label>
              <input
                type="radio"
                name="userType"
                value="vet"
                checked={formData.userType === 'vet'}
                onChange={handleChange}
              />
              Vet
            </label>
          </div>
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};



export default Register;
