import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './SignupForm.css';  // Import the CSS file

function SignupForm() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrors(null);

    try {
      const res = await axios.post('http://localhost:8000/api/signup/', formData);
      setMessage('✅ Signup successful!');
      setFormData({ username: '', password: '' });
    } catch (err) {
      if (err.response?.data) {
        setErrors(err.response.data);
        setMessage('❌ Signup failed. Check the details.');
      } else {
        setMessage('❌ Signup failed. Network/server error.');
      }
    }
  };

  return (
    <div className="containerS">
      <div className="cardS">
        <h2 className="title">Sign Up to Allocator</h2>

        <form onSubmit={handleSubmit} className="form">
          <label className="label">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="input"
            placeholder="Enter your username"
          />

          <label className="label" style={{ marginTop: 20 }}>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="input"
            placeholder="Enter your password"
          />

          <button type="submit" className="button">
            Register
          </button>
        </form>

        {message && <p className="message">{message}</p>}

        {errors && (
          <div className="error">
            {Object.entries(errors).map(([key, val], idx) => (
              <p key={idx}><strong>{key}</strong>: {val.join(', ')}</p>
            ))}
          </div>
        )}

        <div className="login-link">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default SignupForm;
