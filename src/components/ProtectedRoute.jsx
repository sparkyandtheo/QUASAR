// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { currentUser, userRole } = useAuth();

  if (!currentUser) {
    // If not logged in, redirect to login page
    return <Navigate to="/login" />;
  }
  
  if (userRole !== 'admin') {
    // If logged in but not an admin, redirect to home page
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;