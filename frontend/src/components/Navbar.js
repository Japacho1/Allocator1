import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { AuthContext } from "./AuthContext";

const Navbar = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate(); // ✅ avoid window.location.href

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true }); // safer navigation
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">Allocator</div>
      <ul className="nav-links">
        <li><NavLink to="/" end>Home</NavLink></li>
        <li><NavLink to="/dashboard">Dashboard</NavLink></li>
        <li><NavLink to="/add-course">Add Course</NavLink></li>
        <li><NavLink to="/add-school">Add School</NavLink></li>
        <li><NavLink to="/school-courses">Schools</NavLink></li>
        <li><NavLink to="/add-allocation">Add Allocation</NavLink></li>
        <li><NavLink to="/transfers">Transfers</NavLink></li>
        <li><NavLink to="/daily-allocation">Daily Allocation</NavLink></li>
        <li><NavLink to="/settings">Settings</NavLink></li>
        {isAuthenticated && (
          <li>
            <button
              onClick={handleLogout}
              className="logout-button"
            >
              Logout
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
