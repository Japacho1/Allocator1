import React, { useState } from 'react';
import './Settings.css';

function Settings() {
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    location: '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitProfile = (e) => {
    e.preventDefault();
    // Send profile to backend
    console.log('Profile Updated:', profile);
  };

  const handleSubmitPassword = (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('New passwords do not match.');
      return;
    }
    // Send password change to backend
    console.log('Password Changed:', passwords);
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account?')) {
      console.log('Account deleted');
      // Call API to delete user
    }
  };

  return (
    <div className="settings-container">
      <h2 className="settings-title">Settings</h2>

      {/* Profile Info */}
      <form onSubmit={handleSubmitProfile} className="settings-section">
        <h3>Update Profile</h3>
        <input type="text" name="username" placeholder="Username" value={profile.username} onChange={handleProfileChange} />
        <input type="email" name="email" placeholder="Email" value={profile.email} onChange={handleProfileChange} />
        <input type="text" name="location" placeholder="Location" value={profile.location} onChange={handleProfileChange} />
        <button type="submit">Save Profile</button>
      </form>

      {/* Password Change */}
      <form onSubmit={handleSubmitPassword} className="settings-section">
        <h3>Change Password</h3>
        <input type="password" name="currentPassword" placeholder="Current Password" onChange={handlePasswordChange} />
        <input type="password" name="newPassword" placeholder="New Password" onChange={handlePasswordChange} />
        <input type="password" name="confirmPassword" placeholder="Confirm New Password" onChange={handlePasswordChange} />
        <button type="submit">Change Password</button>
      </form>

      {/* Toggles */}
      <div className="settings-section">
        <h3>Preferences</h3>
        <label>
          <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} />
          Enable Notifications
        </label>
        <label>
          <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
          Dark Mode
        </label>
      </div>

      {/* Danger Zone */}
      <div className="settings-section danger-zone">
        <h3>Danger Zone</h3>
        <button onClick={handleDeleteAccount} className="danger-button">
          Delete My Account
        </button>
      </div>
    </div>
  );
}

export default Settings;
