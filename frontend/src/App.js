import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';

import SchoolCoursesList from './components/SchoolCoursesList';
import AllocationDashboard from './components/AllocationDashboard';
import AddAllocationForm from './components/AddAllocationForm';
import AddSchoolForm from './components/AddSchoolForm';
import AddCourse from './components/AddCourse';
import TransfersPage from './components/TransfersPage';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DailyAllocation from './components/DailyAllocation';
import LoginPage from './components/LoginPage';
import SignupForm from './components/SignupForm';
import Settings from './components/Settings';
import { AssessorProvider } from './components/AssessorContext';

// Check if user is logged in by checking token in localStorage
const isAuthenticated = () => !!localStorage.getItem('access_token');

// ProtectedRoute component to guard private routes
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
       <AssessorProvider>
      {/* Show Navbar only if authenticated */}
      {isAuthenticated() && <Navbar />}

      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated() ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/signup"
          element={isAuthenticated() ? <Navigate to="/" replace /> : <SignupForm />}
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AllocationDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-allocation"
          element={
            <ProtectedRoute>
              <AddAllocationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-school"
          element={
            <ProtectedRoute>
              <AddSchoolForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-course"
          element={
            <ProtectedRoute>
              <AddCourse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school-courses"
          element={
            <ProtectedRoute>
              <SchoolCoursesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transfers"
          element={
            <ProtectedRoute>
              <TransfersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/daily-allocation"
          element={
            <ProtectedRoute>
              <DailyAllocation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </AssessorProvider>
    </AuthProvider>
  );
}

export default App;
