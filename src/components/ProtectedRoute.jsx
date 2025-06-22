// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  // --- MODIFIED: Get the `loading` state from the context ---
  const { currentUser, userRole, loading } = useAuth();

  // --- ADDED: If the auth state is still loading, wait. ---
  // This prevents the redirect from happening before we know the user's role.
  if (loading) {
    return <div>Loading...</div>; // You can replace this with a proper spinner component
  }

  // Once loading is false, we can safely check the user and role.
  if (!currentUser) {
    // If not logged in, redirect to login page
    return <Navigate to="/login" />;
  }
  
  if (userRole !== 'admin') {
    // If logged in but not an admin, redirect to home page
    return <Navigate to="/" />;
  }

  // If loading is false and the user is an admin, show the component.
  return children;
}

export default ProtectedRoute;
