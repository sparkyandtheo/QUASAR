// src/components/Navbar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="vertical-nav">
      <NavLink to="/">Accounts</NavLink>
      <NavLink to="/admin">Admin Panel</NavLink>
    </nav>
  );
}

export default Navbar;
