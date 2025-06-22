// src/pages/AccountDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import '../components/AccountList.css'; // Reuse styles

const usStates = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
const defaultPhone = { type: 'Mobile', number: '', smsOk: false };
const defaultContact = { name: '', email: '', isJobContact: false, isArchived: false, phones: [{ ...defaultPhone }] };


function AccountDetail() {
  const { accountId } = useParams();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    billingAddress: { street1: '', street2: '', city: '', state: 'NY', zip: '' },
    contacts: [],
    companyName: ''
  });
  
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeContactIndex, setActiveContactIndex] = useState(0);
  const [customerSource, setCustomerSource] = useState('');
  const [customerSourcesList, setCustomerSourcesList] = useState([]);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [street1, setStreet1] = useState('');
  const [street2, setStreet2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('NY');
  const [zip, setZip] = useState('');
  const [showStreet2, setShowStreet2] = useState(false);
  const [isJobsiteSameAsBilling, setIsJobsiteSameAsBilling] = useState(false);

  useEffect(() => {
    const helpDismissed = localStorage.getItem('quasarHelpDismissed');
    if (!helpDismissed) {
      setShowHelp(true);
    }
  }, []);

  useEffect(() => {
      const fetchSources = async () => {
          try {
            const settingsRef = doc(db, 'settings', 'serviceArea');
            const docSnap = await getDoc(settingsRef);
            if (docSnap.exists()) {
                setCustomerSourcesList(docSnap.data().customerSources || []);
            }
          } catch (error) {
              console.error("Error fetching customer sources:", error);
          }
      };
      fetchSources();
  }, []);

  const dismissHelp = () => {
    setShowHelp(false);
    localStorage.setItem('quasarHelpDismissed', 'true');
  };

  const capitalizeWords = (str) => str ? str.replace(/\b\w/g, (char) => char.toUpperCase()) : '';
  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };
  const handleContactChange = (index, field, value) => {
    const newContacts = [...formData.contacts];
    newContacts[index][field] = value;
    setContacts(newContacts);
  };

  const handleJobContactToggle = (toggledIndex) => {
    const newContacts = contacts.map((contact, index) => ({
      ...contact,
      isJobContact: index === toggledIndex
    }));
    setContacts(newContacts);
  };
  const handlePhoneChange = (contactIndex, phoneIndex, field, value) => {
    const newContacts = [...formData.contacts];
    const phone = newContacts[contactIndex].phones[phoneIndex];
    if (field === 'smsOk') phone.smsOk = event.target.checked;
    else if (field === 'number') phone.number = formatPhoneNumber(event.target.value);
    else phone[field] = event.target.value;
    setContacts(newContacts);
  };
  const addContact = () => {
    const newContact = {...defaultContact, isJobContact: formData.contacts.every(c => !c.isJobContact)};
    setFormData(prev => ({...prev, contacts: [...prev.contacts, newContact]}));
    setActiveContactIndex(formData.contacts.length);
  };
  const addPhoneNumber = (contactIndex) => {
    const newContacts = [...formData.contacts];
    newContacts[contactIndex].phones.push({ ...defaultPhone });
    setFormData(prev => ({...prev, contacts: newContacts}));
  };
  const archiveContact = (indexToArchive) => {
    const newContacts = [...formData.contacts];
    newContacts[indexToArchive].isArchived = true;
    if (newContacts[indexToArchive].isJobContact) {
        const firstActiveIndex = newContacts.findIndex(c => !c.isArchived);
        if (firstActiveIndex !== -1) {
            newContacts[firstActiveIndex].isJobContact = true;
        }
    }
    setFormData(prev => ({...prev, contacts: newContacts}));
    const firstActiveIndex = newContacts.findIndex(c => !c.isArchived);
    setActiveContactIndex(firstActiveIndex === -1 ? 0 : firstActiveIndex);
  };
  const handleJobContactToggle = (toggledIndex) => {
    const newContacts = formData.contacts.map((contact, index) => ({
      ...contact,
      isJobContact: index === toggledIndex
    }));
    setFormData(prev => ({...prev, contacts: newContacts}));
  };
  
  const handleSaveChanges = async () => {
    if (zipStatus === 'out-of-area' && !overrideOutOfArea) {
      alert('The billing address is outside the service area. Please check the "Override" box to proceed.');
      return;
    }
    const docRef = doc(db, 'accounts', accountId);
    let updatedData = {
        contacts: formData.contacts,
        companyName: formData.companyName,
        billingAddress: formData.billingAddress,
        serviceAreaInfo: { status: zipStatus, override: overrideOutOfArea }
    };
    if (JSON.stringify(account.billingAddress) !== JSON.stringify(formData.billingAddress)) {
        const addressToArchive = { ...account.billingAddress, archivedAt: new Date() };
        const newHistory = [addressToArchive, ...(account.addressHistory || [])];
        updatedData.addressHistory = newHistory;
    }
    try {
      await updateDoc(docRef, updatedData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating account:", error);
      setErrorMessage('Failed to save changes. Please check your connection and try again.');
      setShowErrorModal(true);
    }
  };
  const handleCancelEdit = () => {
    setFormData({
        billingAddress: account.billingAddress,
        contacts: account.contacts.map(c => ({...c, emailStatus: 'pristine', phones: c.phones.map(p => ({...p, numberStatus: 'pristine'}))})),
        companyName: account.companyName || ''
    });
    setIsEditing(false);
  };
  const handleRestoreAddress = async (addressToRestore) => {
    const docRef = doc(db, 'accounts', accountId);
    const currentAddressToArchive = { ...account.billingAddress, archivedAt: new Date() };
    const newHistory = (account.addressHistory || [])
        .filter(addr => JSON.stringify(addr) !== JSON.stringify(addressToRestore))
        .concat(currentAddressToArchive);
    try {
        await updateDoc(docRef, {
            billingAddress: addressToRestore,
            addressHistory: newHistory
        });
        setShowAddressHistory(false);
    } catch (error) {
        console.error("Error restoring address:", error);
        setErrorMessage('Failed to restore address. Please try again.');
        setShowErrorModal(true);
    }
  };

  if (loading) { return <div>Loading...</div> }
  if (!account) { return <div>Account Not Found</div> }

  const visibleContacts = isEditing ? formData.contacts.map((c, i) => ({...c, originalIndex: i})).filter(c => !c.isArchived) : account.contacts.map((c, i) => ({...c, originalIndex: i})).filter(c => !c.isArchived);
  const activeContact = formData.contacts[activeContactIndex] || {};

  return (
    <>
      <div className="account-form-container">
        {showHelp && (
          <div className="help-box">
            <button className="help-box-dismiss" onClick={dismissHelp}>×</button>
            <h4>Quick Tips</h4>
            <ol>
              <li>Enter details for the first contact.</li>
              <li>Use the <strong>+</strong> button to add more contacts if needed.</li>
              <li>Set the account's <strong>Billing Address</strong>.</li>
              <li>Use the checkbox on each tab to set the <strong>Default Job Contact</strong>.</li>
            </ol>
          </div>
        )}
        <fieldset>
          <legend>Create New Account</legend>
          <div className="form-group" style={{marginBottom: '1.5rem'}}>
              <label htmlFor="customerSource">Customer Source</label>
              <select id="customerSource" value={customerSource} onChange={e => setCustomerSource(e.target.value)}>
                  <option value="">Select a source...</option>
                  {customerSourcesList.map(source => <option key={source} value={source}>{source}</option>)}
              </select>
          </div>
          <div className="contact-tabs">
            {visibleContacts.map((contact) => (
              <button 
                key={contact.originalIndex} 
                className={`tab-button ${contact.originalIndex === activeContactIndex ? 'active' : ''} ${contact.isJobContact ? 'is-job-contact' : ''}`} 
                onClick={() => setActiveContactIndex(contact.originalIndex)}
                title={contact.isJobContact ? "Default Job Contact" : "View Contact"}
              >
                {contact.name || `Contact ${contact.originalIndex + 1}`}
                {contact.isJobContact && <span className="primary-tag">(Default)</span>}
                {visibleContacts.length > 1 && (<span className="delete-tab-btn" title={`Archive Contact`} onClick={(e) => {e.stopPropagation(); archiveContact(contact.originalIndex);}}>×</span>)}
              </button>
            ))}
            <button className="add-contact-btn" title="Add another contact" onClick={addContact}>+</button>
            {archivedContacts.length > 0 && (
                <button className="job-tag-btn" onClick={() => setShowArchiveModal(true)}>
                    Archived ({archivedContacts.length})
                </button>
            )}
          </div>
          <div className="form-grid">
              <div className="form-group grid-col-span-3"><label htmlFor="contactName">Contact Name</label><input id="contactName" type="text" value={activeContact.name || ''} onChange={(e) => handleContactChange(activeContactIndex, 'name', capitalizeWords(e.target.value))} /></div>
              <div className="form-group grid-col-span-3"><label htmlFor="contactEmail">Email</label><input id="contactEmail" type="email" value={activeContact.email || ''} onChange={(e) => handleContactChange(activeContactIndex, 'email', e.target.value)} /></div>
              <div className="form-group grid-col-span-6">
                   <label>Phone Numbers <button className="add-street-btn" title="Add phone number" onClick={() => addPhoneNumber(activeContactIndex)}>+</button></label>
                   {activeContact.phones?.map((phone, index) => (<div key={index} className="phone-entry"><input list="phone-types" placeholder="Type" value={phone.type} onChange={(e) => handlePhoneChange(activeContactIndex, index, 'type', e)} style={{flexBasis: '120px', flexGrow: 0}}/><div className="form-group" style={{flexBasis: '180px', flexGrow: 0}}><input type="tel" placeholder="(XXX) XXX-XXXX" value={phone.number} onChange={(e) => handlePhoneChange(activeContactIndex, index, 'number', e)} /></div><div className="checkbox-group" style={{paddingTop: 0}}><input id={`smsOk-${index}`} type="checkbox" checked={phone.smsOk} onChange={(e) => handlePhoneChange(activeContactIndex, index, 'smsOk', e)} /><label htmlFor={`smsOk-${index}`}>SMS OK?</label></div></div>))}
              </div>
              <datalist id="phone-types">
                  <option value="Mobile" />
                  <option value="Work Mobile" />
                  <option value="Work Office" />
                  <option value="Home" />
                  <option value="Spouse" />
                  <option value="Fax" />
              </datalist>
              {/* --- MOVED: Default Job Contact checkbox is now here --- */}
              <div className="form-group grid-col-span-6">
                <div className="checkbox-group" style={{paddingTop: '0.5rem', justifyContent: 'flex-start'}}>
                    <input id="isJobContact" type="checkbox" checked={activeContact.isJobContact} onChange={() => handleJobContactToggle(activeContactIndex)} />
                    <label htmlFor="isJobContact">Default Job Contact</label>
                </div>
            ))
          )}
        
          {isEditing && (
              <div className="form-actions grid-col-span-6" style={{marginTop: '2rem', justifyContent: 'flex-start', gap: '1rem'}}>
                  <button onClick={handleSaveChanges}>Save All Changes</button>
                  <button onClick={handleCancelEdit} className="secondary-btn">Cancel</button>
              </div>
          )}
        </fieldset>
      </div>
      {showArchiveModal && (<div className="modal-overlay"><div className="modal-content"><div className="modal-header"><h4>Archived Contacts</h4><button className="close-btn" onClick={() => setShowArchiveModal(false)}>×</button></div><div className="archived-list">{archivedContacts.length > 0 ? (archivedContacts.map((contact) => (<div key={contact.originalIndex} className="archived-item"><span>{contact.name || `Contact ${contact.originalIndex + 1}`}</span><button onClick={() => restoreContact(contact.originalIndex)}>Restore</button></div>))) : (<p>No contacts have been archived.</p>)}</div></div></div>)}
    </>
  );
}

export default AccountDetail;
