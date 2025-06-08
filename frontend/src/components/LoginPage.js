import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import './LoginPage.css';  // <-- Import the CSS file

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        setError('Invalid username or password');
        return;
      }

      const data = await response.json();

      localStorage.setItem('access_token', data.access || data.token);
      login();
      setIsLoggedIn(true);

    } catch (err) {
      setError('Network error');
    }
  };

  if (isLoggedIn) {
    window.location.href = '/';
  }

  return (
    <div className="containerL">
      <div className="cardL">
        <h2 className="title">Welcome Back to Allocator</h2>
        <p className="subtitle">Please log in to your account</p>

        <form onSubmit={handleLogin} className="form">
          <label className="label">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="input"
            placeholder="Enter your username"
          />

          <label className="label" style={{ marginTop: 20 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
            placeholder="Enter your password"
          />

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button type="submit" className="button">
            Log In
          </button>
        </form>
        <div className="login-link">
          Already have an account? <Link to="/signup">Signup</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
