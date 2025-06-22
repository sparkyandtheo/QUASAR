// src/pages/AccountDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'; // Removed serverTimestamp
import { db } from '../firebaseConfig';
import '../components/AccountList.css'; // Reuse styles

const usStates = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

function AccountDetail() {
  const { accountId } = useParams();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [billingAddress, setBillingAddress] = useState({ street1: '', street2: '', city: '', state: 'NY', zip: '' });
  
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const docRef = doc(db, 'accounts', accountId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setAccount(data);
        setBillingAddress(data.billingAddress);
      } else {
        setAccount(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [accountId]);

  const handleAddressChange = (field, value) => {
    setBillingAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    if (JSON.stringify(account.billingAddress) === JSON.stringify(billingAddress)) {
      setIsEditing(false);
      return;
    }

    const docRef = doc(db, 'accounts', accountId);
    
    // --- MODIFIED: Replaced serverTimestamp() with new Date() ---
    // This creates the timestamp on the client side, avoiding the Firestore limitation.
    const addressToArchive = {
      ...account.billingAddress,
      archivedAt: new Date() 
    };

    const newHistory = [addressToArchive, ...(account.addressHistory || [])];

    try {
      await updateDoc(docRef, {
        billingAddress: billingAddress,
        addressHistory: newHistory
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating address:", error);
      setErrorMessage('Failed to save changes. Please check your connection and try again.');
      setShowErrorModal(true);
    }
  };

  const handleCancelEdit = () => {
    setBillingAddress(account.billingAddress);
    setIsEditing(false);
  };

  if (loading) {
    return <div className="account-form-container"><p>Loading account details...</p></div>;
  }

  if (!account) {
    return <div className="account-form-container"><p>Account not found.</p></div>;
  }

  return (
    <>
      <div className="account-form-container">
        <fieldset>
          <legend>Account Details</legend>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>{account.accountNumber}</h3>
              <p style={{ margin: 0 }}>Customer since {new Date(account.createdAt?.toDate()).toLocaleDateString()}</p>
            </div>
            {/* --- MODIFIED: Added className to the button --- */}
            {!isEditing && <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit Account</button>}
          </div>
          
          <hr style={{margin: '1.5rem 0'}}/>
          
          <div className="form-grid">
            <div className="form-group grid-col-span-3">
              <label>Billing Address</label>
              {isEditing ? (
                <>
                  <input type="text" value={billingAddress.street1} onChange={(e) => handleAddressChange('street1', e.target.value)} placeholder="Street 1" />
                  <input type="text" value={billingAddress.street2} onChange={(e) => handleAddressChange('street2', e.target.value)} placeholder="Street 2 (Optional)" style={{marginTop: '0.5rem'}}/>
                  <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
                      <input type="text" value={billingAddress.city} onChange={(e) => handleAddressChange('city', e.target.value)} placeholder="City"/>
                      <select value={billingAddress.state} onChange={(e) => handleAddressChange('state', e.target.value)} style={{flex: '0 0 80px'}}>{usStates.map(s => <option key={s} value={s}>{s}</option>)}</select>
                      <input type="text" value={billingAddress.zip} onChange={(e) => handleAddressChange('zip', e.target.value)} placeholder="Zip"/>
                  </div>
                </>
              ) : (
                <div className="read-only-field">
                  {account.billingAddress.street1}<br/>
                  {account.billingAddress.street2 && <>{account.billingAddress.street2}<br/></>}
                  {account.billingAddress.city}, {account.billingAddress.state} {account.billingAddress.zip}
                </div>
              )}
            </div>
            <div className="form-group grid-col-span-3">
              <label>Jobsite Address</label>
              <div className="read-only-field">
                  {account.isJobsiteSameAsBilling ? 'Same as Billing' : 'Different Address (Display Logic TBD)'}
              </div>
            </div>
            {isEditing && (
                <div className="form-actions grid-col-span-6" style={{marginTop: 0, justifyContent: 'flex-start', gap: '1rem'}}>
                    <button onClick={handleSaveChanges}>Save Changes</button>
                    <button onClick={handleCancelEdit} className="secondary-btn">Cancel</button>
                </div>
            )}
          </div>

          <h4 style={{marginTop: '2rem'}}>Contacts</h4>
          {account.contacts?.map((contact, index) => !contact.isArchived && (
              <div key={index} className="contact-card">
                 {/* Contact details */}
              </div>
          ))}

          {account.addressHistory && account.addressHistory.length > 0 && (
            <div className="history-section">
              <h4>Address History</h4>
              {account.addressHistory.map((addr, index) => (
                <div key={index} className="history-item">
                  <div className="history-item-address">
                    {addr.street1}, {addr.city}, {addr.state} {addr.zip}
                  </div>
                  <div className="history-item-date">
                    {/* --- MODIFIED: Handles both Firestore Timestamps and JS Dates --- */}
                    Archived on {new Date(addr.archivedAt?.toDate ? addr.archivedAt.toDate() : addr.archivedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </fieldset>
      </div>

      {showErrorModal && (
        <div className="modal-overlay">
            <div className="modal-content error-modal">
                <div className="modal-header">
                    <h4>Save Failed</h4>
                    <button className="close-btn" onClick={() => setShowErrorModal(false)}>×</button>
                </div>
                <p>{errorMessage}</p>
                <div className="form-actions" style={{justifyContent: 'flex-end'}}>
                    <button onClick={() => setShowErrorModal(false)}>OK</button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}

export default AccountDetail;
