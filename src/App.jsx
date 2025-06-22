// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import AccountList from './components/AccountList';
import AdminPanel from './components/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Settings from './components/Settings';
import Toolbox from './components/Toolbox';
import AccountDetail from './pages/AccountDetail'; // <-- ADDED: Import the new page component

// This component is the main layout for authenticated users
function MainAppLayout() {
    const { logout } = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Theme-switching logic
    useEffect(() => {
        const body = window.document.body;
        if (isDarkMode) { body.classList.add('dark-mode'); }
        else { body.classList.remove('dark-mode'); }
        localStorage.setItem('darkMode', isDarkMode);
    }, [isDarkMode]);

    useEffect(() => {
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode) { setIsDarkMode(JSON.parse(savedMode)); }
        else { setIsDarkMode(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); }
    }, []);

    return (
        <>
            <main>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1>QUASAR</h1>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button className="logout-btn" onClick={logout}>Logout</button>
                    </div>
                </header>

                <div className="app-layout">
                    <Navbar />
                    <div className="content-layout">
                        <div className="main-content">
                            <Routes>
                                <Route path="/" element={<AccountList />} />
                                {/* --- ADDED: The new route for viewing a single account --- */}
                                <Route path="/account/:accountId" element={<AccountDetail />} />
                                <Route path="/admin" element={
                                    <ProtectedRoute>
                                        <AdminPanel />
                                    </ProtectedRoute>
                                } />
                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                        </div>
                        <div className="sidebar-content">
                            <Toolbox />
                        </div>
                    </div>
                </div>
            </main>
            <Settings isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        </>
    );
}


// This component handles the top-level routing based on authentication state
function AppRoutes() {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return <div style={{padding: '2rem'}}>Loading...</div>; // Or a proper spinner component
    }

    return (
        <Routes>
            <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
            <Route path="/*" element={currentUser ? <MainAppLayout /> : <Navigate to="/login" />} />
        </Routes>
    );
}

// The root component sets up all necessary providers and the router
function App() {
  return (
    <AuthProvider>
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
