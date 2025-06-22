// src/pages/AccountDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import '../components/AccountList.css'; // Reuse styles for consistency

function AccountDetail() {
  const { accountId } = useParams();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Function to fetch a single account from Firestore
    const fetchAccount = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'accounts', accountId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setAccount({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such document!");
          setAccount(null); // Or handle as a "not found" state
        }
      } catch (error) {
        console.error("Error fetching account:", error);
      }
      setLoading(false);
    };

    if (accountId) {
      fetchAccount();
    }
  }, [accountId]); // This effect runs whenever the accountId in the URL changes

  // --- Display Loading or Not Found State ---
  if (loading) {
    return <div className="account-form-container"><p>Loading account details...</p></div>;
  }

  if (!account) {
    return <div className="account-form-container"><p>Account not found.</p></div>;
  }

  // Find the primary contact for easy display
  const primaryContact = account.contacts?.find(c => c.isJobContact) || account.contacts?.[0];

  return (
    <div className="account-form-container">
      <fieldset>
        <legend>Account Details</legend>
        
        {/* --- Display Header Info --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>{account.accountNumber}</h3>
            <p style={{ margin: 0 }}>Customer since {new Date(account.createdAt?.toDate()).toLocaleDateString()}</p>
          </div>
          <button>Edit Account</button> {/* This is our next step! */}
        </div>
        
        <hr style={{margin: '1.5rem 0'}}/>
        
        {/* --- Display Billing Address --- */}
        <div className="form-grid">
            <div className="form-group grid-col-span-3">
                <label>Billing Address</label>
                <div className="read-only-field">
                    {account.billingAddress.street1}<br/>
                    {account.billingAddress.street2 && <>{account.billingAddress.street2}<br/></>}
                    {account.billingAddress.city}, {account.billingAddress.state} {account.billingAddress.zip}
                </div>
            </div>
             <div className="form-group grid-col-span-3">
                <label>Jobsite Address</label>
                <div className="read-only-field">
                    {account.isJobsiteSameAsBilling ? 'Same as Billing' : 'Different Address (Display Logic TBD)'}
                </div>
            </div>
        </div>

        {/* --- Display Contacts --- */}
        <h4 style={{marginTop: '2rem'}}>Contacts</h4>
        {account.contacts?.map((contact, index) => !contact.isArchived && (
            <div key={index} className="contact-card">
                <div className="contact-card-header">
                    <strong>{contact.name}</strong>
                    {contact.isJobContact && <span className="job-contact-tag">Primary</span>}
                </div>
                <p><strong>Email:</strong> {contact.email || 'N/A'}</p>
                <p><strong>Phone:</strong></p>
                <ul>
                    {contact.phones?.map((phone, pIndex) => (
                        <li key={pIndex}>{phone.type}: {phone.number} {phone.smsOk && '(SMS OK)'}</li>
                    ))}
                </ul>
            </div>
        ))}
      </fieldset>
    </div>
  );
}

// Add a new helper CSS file for this component if needed, or add styles to an existing one.
// For now, let's create a placeholder style for the read-only fields and cards.
// You can add these styles to `src/components/AccountList.css` to keep it simple.
const placeholder = `
/* Add these styles to the end of src/components/AccountList.css */

.read-only-field {
  background-color: var(--clr-page-bg);
  padding: .65rem;
  border-radius: 6px;
  min-height: 41.5px;
  box-sizing: border-box;
}

.contact-card {
  border: 1px solid var(--clr-border);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.contact-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.job-contact-tag {
  background-color: var(--clr-primary);
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
}
`;


export default AccountDetail;

