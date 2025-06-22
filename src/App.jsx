// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import AccountList from './components/AccountList';
import AdminPanel from './components/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Settings from './components/Settings';
import Toolbox from './components/Toolbox';
import AccountDetail from './pages/AccountDetail';

// --- A dedicated layout component for authenticated users ---
function AppLayout() {
    const { logout } = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [fontSize, setFontSize] = useState(16); // Default font size in pixels

    useEffect(() => {
        // Load Dark Mode
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode) { setIsDarkMode(JSON.parse(savedMode)); }
        else { setIsDarkMode(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); }

        // Load Font Size
        const savedFontSize = localStorage.getItem('fontSize');
        if (savedFontSize) { setFontSize(parseFloat(savedFontSize)); }

    }, []);

    useEffect(() => {
        // Save Dark Mode
        const body = window.document.body;
        if (isDarkMode) { body.classList.add('dark-mode'); }
        else { body.classList.remove('dark-mode'); }
        localStorage.setItem('darkMode', isDarkMode);

        // Save Font Size
        document.documentElement.style.fontSize = `${fontSize}px`;
        localStorage.setItem('fontSize', fontSize);
    }, [isDarkMode, fontSize]);


    return (
        <>
            <main>
                {/* --- MODIFIED: Header structure is now simpler and styled with CSS --- */}
                <header className="app-header">
                    <h1>QUASAR</h1>
                    <button className="logout-btn" onClick={logout}>Logout</button>
                </header>

                <div className="app-layout">
                    <Navbar />
                    <div className="content-layout">
                        <div className="main-content">
                            <Outlet />
                        </div>
                        <div className="sidebar-content">
                            <Toolbox />
                        </div>
                    </div>
                </div>
            </main>
            <Settings 
                isDarkMode={isDarkMode} 
                setIsDarkMode={setIsDarkMode}
                fontSize={fontSize}
                setFontSize={setFontSize}
            />
        </>
    );
}

// --- The main App component handles all routing logic ---
function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div style={{padding: '2rem'}}>Loading Application...</div>;
  }

  return (
    <BrowserRouter>
        <Routes>
            {currentUser ? (
                <Route path="/" element={<AppLayout />}>
                    <Route index element={<AccountList />} />
                    <Route path="account/:accountId" element={<AccountDetail />} />
                    <Route 
                        path="admin" 
                        element={
                            <ProtectedRoute>
                                <AdminPanel />
                            </ProtectedRoute>
                        } 
                    />
                    <Route path="*" element={<Navigate to="/" />} />
                </Route>
            ) : (
                <>
                    <Route path="/login" element={<Login />} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </>
            )}
        </Routes>
    </BrowserRouter>
  );
}

// --- FINAL WRAPPER: The root component just provides the context ---
function Root() {
    return (
        <AuthProvider>
            <App />
        </AuthProvider>
    );
}

export default Root;
