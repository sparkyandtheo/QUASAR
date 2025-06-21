// src/components/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './AdminPanel.css';

function AdminPanel() {
  const [standardZips, setStandardZips] = useState([]);
  const [travelFeeZips, setTravelFeeZips] = useState([]);
  const [customerSources, setCustomerSources] = useState([]); // <-- NEW STATE
  
  const [newStandardZip, setNewStandardZip] = useState('');
  const [newTravelZip, setNewTravelZip] = useState('');
  const [newCustomerSource, setNewCustomerSource] = useState(''); // <-- NEW STATE

  useEffect(() => {
    const fetchSettings = async () => {
      const settingsRef = doc(db, 'settings', 'serviceArea');
      const docSnap = await getDoc(settingsRef);
      if (docSnap.exists()) {
        setStandardZips(docSnap.data().standardZips || []);
        setTravelFeeZips(docSnap.data().travelFeeZips || []);
        setCustomerSources(docSnap.data().customerSources || []); // <-- Fetch sources
      }
    };
    fetchSettings();
  }, []);

  const addZip = (zip, type) => {
    if (zip.trim() === '') return;
    if (type === 'standard') {
      if (!standardZips.includes(zip)) setStandardZips([...standardZips, zip].sort());
      setNewStandardZip('');
    } else {
      if (!travelFeeZips.includes(zip)) setTravelFeeZips([...travelFeeZips, zip].sort());
      setNewTravelZip('');
    }
  };

  const removeZip = (zipToRemove, type) => {
    if (type === 'standard') setStandardZips(standardZips.filter(zip => zip !== zipToRemove));
    else setTravelFeeZips(travelFeeZips.filter(zip => zip !== zipToRemove));
  };

  // --- NEW: Functions to manage customer sources ---
  const addCustomerSource = () => {
      if (newCustomerSource.trim() && !customerSources.includes(newCustomerSource)) {
          setCustomerSources([...customerSources, newCustomerSource].sort());
      }
      setNewCustomerSource('');
  };

  const removeCustomerSource = (sourceToRemove) => {
      setCustomerSources(customerSources.filter(source => source !== sourceToRemove));
  };

  const handleSaveChanges = async () => {
    try {
      const settingsRef = doc(db, 'settings', 'serviceArea');
      // --- MODIFIED: Save the new sources list as well ---
      await setDoc(settingsRef, { standardZips, travelFeeZips, customerSources });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error("Error saving settings: ", error);
      alert('Failed to save settings.');
    }
  };

  return (
    <div>
      <h2>Admin Panel - Settings</h2>
      <div className="settings-grid">
        <div className="zip-list-container">
          <h4>Standard Service Zips</h4>
          <div className="zip-input-group"><input type="text" value={newStandardZip} onChange={(e) => setNewStandardZip(e.target.value)} placeholder="Add zip code" /><button onClick={() => addZip(newStandardZip, 'standard')}>Add</button></div>
          <ul className="zip-list">{standardZips.map(zip => (<li key={zip} className="zip-item">{zip} <button onClick={() => removeZip(zip, 'standard')}>×</button></li>))}</ul>
        </div>
        <div className="zip-list-container">
          <h4>Travel Fee Zips</h4>
          <div className="zip-input-group"><input type="text" value={newTravelZip} onChange={(e) => setNewTravelZip(e.target.value)} placeholder="Add zip code" /><button onClick={() => addZip(newTravelZip, 'travel')}>Add</button></div>
          <ul className="zip-list">{travelFeeZips.map(zip => (<li key={zip} className="zip-item">{zip} <button onClick={() => removeZip(zip, 'travel')}>×</button></li>))}</ul>
        </div>
        {/* --- NEW: Customer Sources management UI --- */}
        <div className="zip-list-container">
          <h4>Customer Sources</h4>
          <div className="zip-input-group"><input type="text" value={newCustomerSource} onChange={(e) => setNewCustomerSource(e.target.value)} placeholder="Add source (e.g., Referral)" /><button onClick={addCustomerSource}>Add</button></div>
          <ul className="zip-list">{customerSources.map(source => (<li key={source} className="zip-item">{source} <button onClick={() => removeCustomerSource(source)}>×</button></li>))}</ul>
        </div>
      </div>
      <div className="form-actions" style={{justifyContent: 'center', marginTop: '2rem'}}>
        <button onClick={handleSaveChanges}>Save All Settings</button>
      </div>
    </div>
  );
}

export default AdminPanel;