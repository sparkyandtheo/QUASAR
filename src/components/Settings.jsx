// src/components/Settings.jsx
import React from 'react';
import './Settings.css';

// This component is now much simpler. It just displays the elements.
// The show/hide logic is all handled by the CSS.
function Settings({ isDarkMode, setIsDarkMode }) {
  return (
    <div className="settings-container">
      {/* The gear button that is the hover target */}
      <button className="settings-btn" title="Settings">
        ⚙️
      </button>

      {/* The dropdown menu that will appear on hover */}
      <div className="settings-dropdown">
        <label htmlFor="darkModeToggle">
          Dark Mode
          <input
            type="checkbox"
            id="darkModeToggle"
            checked={isDarkMode}
            onChange={() => setIsDarkMode(!isDarkMode)}
          />
        </label>
        {/* You can add more settings here in the future */}
      </div>
    </div>
  );
}

export default Settings;