// src/components/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './AdminPanel.css';

function AdminPanel() {
  // --- ADDED: A loading state to prevent UI flicker ---
  const [loading, setLoading] = useState(true);

  // State for the UI, which will be a mirror of the database
  const [standardZips, setStandardZips] = useState([]);
  const [travelFeeZips, setTravelFeeZips] = useState([]);
  const [customerSources, setCustomerSources] = useState([]);
  
  // State for the input fields
  const [newStandardZip, setNewStandardZip] = useState('');
  const [newTravelZip, setNewTravelZip] = useState('');
  const [newCustomerSource, setNewCustomerSource] = useState('');

  // --- MODIFIED: This useEffect now correctly separates the initial setup from the real-time listener ---
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'serviceArea');

    // First, check if the document exists.
    const checkAndCreateDocument = async () => {
      const docSnap = await getDoc(settingsRef);
      if (!docSnap.exists()) {
        // If it doesn't exist, create it once.
        console.log("Creating settings document.");
        await setDoc(settingsRef, { standardZips: [], travelFeeZips: [], customerSources: [] });
      }
    };

    // After ensuring the document exists, set up the listener.
    checkAndCreateDocument().then(() => {
      const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
        const data = snapshot.data();
        setStandardZips(data.standardZips || []);
        setTravelFeeZips(data.travelFeeZips || []);
        setCustomerSources(data.customerSources || []);
        setLoading(false); // We have data, so we can stop loading.
      });

      // Cleanup listener on unmount
      return () => unsubscribe();
    });

  }, []); // Empty dependency array ensures this runs only once on mount.


  const addZip = async (zip, type) => {
    if (zip.trim() === '') return;
    const settingsRef = doc(db, 'settings', 'serviceArea');

    if (type === 'standard') {
      if (standardZips.includes(zip)) return;
      await updateDoc(settingsRef, { standardZips: [...standardZips, zip].sort() });
      setNewStandardZip('');
    } else {
      if (travelFeeZips.includes(zip)) return;
      await updateDoc(settingsRef, { travelFeeZips: [...travelFeeZips, zip].sort() });
      setNewTravelZip('');
    }
  };

  const removeZip = async (zipToRemove, type) => {
    const settingsRef = doc(db, 'settings', 'serviceArea');
    if (type === 'standard') {
      await updateDoc(settingsRef, { standardZips: standardZips.filter(zip => zip !== zipToRemove) });
    } else {
      await updateDoc(settingsRef, { travelFeeZips: travelFeeZips.filter(zip => zip !== zipToRemove) });
    }
  };

  const addCustomerSource = async () => {
    if (newCustomerSource.trim() === '' || customerSources.includes(newCustomerSource)) return;
    const settingsRef = doc(db, 'settings', 'serviceArea');
    await updateDoc(settingsRef, { customerSources: [...customerSources, newCustomerSource.trim()].sort() });
    setNewCustomerSource('');
  };

  const removeCustomerSource = async (sourceToRemove) => {
    const settingsRef = doc(db, 'settings', 'serviceArea');
    await updateDoc(settingsRef, { customerSources: customerSources.filter(source => source !== sourceToRemove) });
  };
  
  // --- ADDED: Show a loading message to prevent the "blink" ---
  if (loading) {
      return <div><h2>Admin Panel - Settings</h2><p>Loading settings...</p></div>
  }

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
        <div className="zip-list-container">
          <h4>Customer Sources</h4>
          <div className="zip-input-group"><input type="text" value={newCustomerSource} onChange={(e) => setNewCustomerSource(e.target.value)} placeholder="Add source (e.g., Referral)" /><button onClick={addCustomerSource}>Add</button></div>
          <ul className="zip-list">{customerSources.map(source => (<li key={source} className="zip-item">{source} <button onClick={() => removeCustomerSource(source)}>×</button></li>))}</ul>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
