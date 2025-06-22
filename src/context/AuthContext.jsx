// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  function logout() {
    const auth = getAuth();
    return signOut(auth);
  }

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        } else {
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // --- MODIFIED: `useMemo` prevents unnecessary re-renders of consumers ---
  const value = useMemo(() => ({
    currentUser,
    userRole,
    loading,
    logout,
  }), [currentUser, userRole, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
