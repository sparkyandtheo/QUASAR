// src/components/Settings.jsx
import React from 'react';
import './Settings.css';

function Settings({ isDarkMode, setIsDarkMode, fontSize, setFontSize }) {

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 24)); // Cap at 24px
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 12)); // Floor at 12px

  return (
    <div className="settings-panel">
        <div className="settings-flyout-menu">
            {/* Font Size controls */}
            <div className="font-size-control">
                <button onClick={decreaseFontSize} title="Decrease font size">-</button>
                <span>{fontSize}px</span>
                <button onClick={increaseFontSize} title="Increase font size">+</button>
            </div>
            {/* Dark Mode toggle */}
            <label htmlFor="darkModeToggle">
                Dark Mode
                <input
                    type="checkbox"
                    id="darkModeToggle"
                    checked={isDarkMode}
                    onChange={() => setIsDarkMode(!isDarkMode)}
                />
            </label>
        </div>

        {/* The main gear button that is always visible */}
        <button className="settings-btn" title="Settings">
            ⚙️
        </button>
    </div>
  );
}

export default Settings;
