// src/components/Toolbox.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './Toolbox.css';

function Toolbox() {
  const [activeTab, setActiveTab] = useState('recent');
  const [allAccounts, setAllAccounts] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'accounts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllAccounts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'accounts'), where('followUpDate', '!=', null), orderBy('followUpDate', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFollowUps(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return unsubscribe;
  }, []);
  
  const filteredAccounts = allAccounts.filter(account => {
    const term = searchTerm.toLowerCase();
    
    // --- THIS IS THE CORRECTED LOGIC ---
    const searchableContent = [
      account.accountNumber,
      account.billingAddress?.street1,
      account.billingAddress?.city,
      account.billingAddress?.zip,
      // Use `?? []` to provide a fallback empty array if contacts or phones are missing on an old record
      ...(account.contacts ?? []).flatMap(c => [
        c.name,
        c.email,
        ...(c.phones ?? []).map(p => p.number)
      ])
    ].join(' ').toLowerCase();
    // --- END CORRECTION ---

    return searchableContent.includes(term);
  });
  
  const renderCard = (account) => (
    <div key={account.id} className="card">
        <strong>{account.accountNumber}</strong><br />
        <small>{account.contacts?.[0]?.name}</small>
        <p className="card-request">{account.billingAddress?.street1}</p>
        <small>Created: {new Date(account.createdAt?.toDate()).toLocaleDateString()}</small>
    </div>
  );

  return (
    <div className="toolbox-container">
      <input 
        type="text"
        className="search-box"
        placeholder="🔍 Search accounts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      {searchTerm ? (
        <div className="card-list">
            <h3>Search Results</h3>
            {filteredAccounts.length > 0 ? filteredAccounts.map(renderCard) : <p>No matching accounts found.</p>}
        </div>
      ) : (
        <>
          <nav className="secondary-tab-nav">
            <button className={`secondary-tab-button ${activeTab === 'recent' ? 'active' : ''}`} onClick={() => setActiveTab('recent')}>Recent Accounts</button>
            <button className={`secondary-tab-button ${activeTab === 'followup' ? 'active' : ''}`} onClick={() => setActiveTab('followup')}>Follow Ups</button>
          </nav>
          {activeTab === 'recent' && (<div className="card-list">{allAccounts.length > 0 ? allAccounts.map(renderCard) : <p>No accounts yet.</p>}</div>)}
          {activeTab === 'followup' && (<div className="card-list">{followUps.length > 0 ? followUps.map(renderCard) : <p>No follow-ups scheduled.</p>}</div>)}
        </>
      )}
    </div>
  );
}

export default Toolbox;