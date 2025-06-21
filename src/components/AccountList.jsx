// src/components/AccountList.jsx
import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './AccountList.css';

const usStates = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
const defaultPhone = { type: 'Cell', number: '', smsOk: false };
const defaultContact = { name: '', email: '', isJobContact: false, isArchived: false, phones: [{ ...defaultPhone }] };

function AccountList() {
  const [contacts, setContacts] = useState([{...defaultContact, isJobContact: true}]);
  const [activeContactIndex, setActiveContactIndex] = useState(0);
  const [customerSource, setCustomerSource] = useState('');
  const [customerSourcesList, setCustomerSourcesList] = useState([]);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  const [street1, setStreet1] = useState('');
  const [street2, setStreet2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('NY');
  const [zip, setZip] = useState('');
  const [showStreet2, setShowStreet2] = useState(false);
  const [isJobsiteSameAsBilling, setIsJobsiteSameAsBilling] = useState(false);

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
    const newContacts = [...contacts];
    newContacts[index][field] = value;
    setContacts(newContacts);
  };
  const handleJobContactToggle = (toggledIndex) => {
    const newContacts = contacts.map((contact, index) => ({ ...contact, isJobContact: index === toggledIndex }));
    setContacts(newContacts);
  };
  const handlePhoneChange = (contactIndex, phoneIndex, field, event) => {
    const newContacts = [...contacts];
    const phone = newContacts[contactIndex].phones[phoneIndex];
    if (field === 'smsOk') phone.smsOk = event.target.checked;
    else if (field === 'number') phone.number = formatPhoneNumber(event.target.value);
    else phone[field] = event.target.value;
    setContacts(newContacts);
  };
  const addContact = () => {
    const newContact = {...defaultContact, isJobContact: contacts.every(c => !c.isJobContact)};
    setContacts([...contacts, newContact]);
    setActiveContactIndex(contacts.length);
  };
  const addPhoneNumber = (contactIndex) => {
    const newContacts = [...contacts];
    newContacts[contactIndex].phones.push({ ...defaultPhone });
    setContacts(newContacts);
  };
  const archiveContact = (indexToArchive) => {
    const newContacts = [...contacts];
    newContacts[indexToArchive].isArchived = true;
    setContacts(newContacts);
    const firstActiveIndex = newContacts.findIndex(c => !c.isArchived);
    setActiveContactIndex(Math.max(0, firstActiveIndex));
  };
  const restoreContact = (indexToRestore) => {
    const newContacts = [...contacts];
    newContacts[indexToRestore].isArchived = false;
    setContacts(newContacts);
    setActiveContactIndex(indexToRestore);
    setShowArchiveModal(false);
  };
  const generateAccountNumber = () => `ACC-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
  const clearForm = () => {
    setContacts([{...defaultContact, isJobContact: true}]);
    setActiveContactIndex(0);
    setCustomerSource('');
    setStreet1(''); setStreet2(''); setCity(''); setState('NY'); setZip('');
    setShowStreet2(false);
    setIsJobsiteSameAsBilling(false);
  };
  const handleCreateAccount = async () => {
    if (contacts.find(c => !c.isArchived)?.name.trim() === '' || street1.trim() === '') {
      alert('Please fill out at least the first Contact Name and Street Address.');
      return;
    }
    try {
      await addDoc(collection(db, 'accounts'), {
        accountNumber: generateAccountNumber(),
        contacts,
        billingAddress: { street1, street2, city, state, zip },
        isJobsiteSameAsBilling,
        customerSource,
        createdAt: serverTimestamp(),
      });
      clearForm();
    } catch (e) { console.error('Error adding document: ', e); }
  };
  const visibleContacts = contacts.map((c, i) => ({...c, originalIndex: i})).filter(c => !c.isArchived);
  const archivedContacts = contacts.map((c, i) => ({...c, originalIndex: i})).filter(c => c.isArchived);
  const activeContact = contacts[activeContactIndex] || {};

  return (
    <>
      <div className="account-form-container">
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
              >
                {contact.name || `Contact ${contact.originalIndex + 1}`}
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
              <div className="form-group grid-col-span-6"><div className="checkbox-group" style={{paddingTop: 0, justifyContent: 'flex-end'}}><input id="isJobContact" type="checkbox" checked={activeContact.isJobContact} onChange={() => handleJobContactToggle(activeContactIndex)} /><label htmlFor="isJobContact">This is the primary contact for jobs</label></div></div>
              <div className="form-group grid-col-span-6">
                   <label>Phone Numbers <button className="add-street-btn" title="Add phone number" onClick={() => addPhoneNumber(activeContactIndex)}>+</button></label>
                   {activeContact.phones?.map((phone, index) => (<div key={index} className="phone-entry"><input list="phone-types" placeholder="Type" value={phone.type} onChange={(e) => handlePhoneChange(activeContactIndex, index, 'type', e)} style={{flexBasis: '120px', flexGrow: 0}}/><div className="form-group" style={{flexBasis: '180px', flexGrow: 0}}><input type="tel" placeholder="(XXX) XXX-XXXX" value={phone.number} onChange={(e) => handlePhoneChange(activeContactIndex, index, 'number', e)} /></div><div className="checkbox-group" style={{paddingTop: 0}}><input id={`smsOk-${index}`} type="checkbox" checked={phone.smsOk} onChange={(e) => handlePhoneChange(activeContactIndex, index, 'smsOk', e)} /><label htmlFor={`smsOk-${index}`}>SMS OK?</label></div></div>))}
              </div>
              <datalist id="phone-types"><option value="Cell" /><option value="Work" /><option value="Home" /><option value="Spouse" /><option value="Fax" /></datalist>
          </div>
          <hr style={{margin: '1.5rem 0'}}/>
          <div className="form-grid">
              <div className="form-group grid-col-span-6"><label htmlFor="street1">Billing Street Address <button className="add-street-btn" title="Add another address line" onClick={() => setShowStreet2(!showStreet2)}>{showStreet2 ? '−' : '+'}</button></label><input id="street1" type="text" value={street1} onChange={(e) => setStreet1(capitalizeWords(e.target.value))} /></div>
              {showStreet2 && (<div className="form-group grid-col-span-6"><label htmlFor="street2">Unit, Apt, Garage, etc.</label><input id="street2" type="text" value={street2} onChange={(e) => setStreet2(capitalizeWords(e.target.value))} /></div>)}
              <div className="form-group grid-col-span-3"><label htmlFor="city">City</label><input id="city" type="text" value={city} onChange={(e) => setCity(capitalizeWords(e.target.value))} /></div>
              <div className="form-group grid-col-span-1"><label htmlFor="state">State</label><select id="state" value={state} onChange={(e) => setState(e.target.value)}>{usStates.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="form-group grid-col-span-2"><label htmlFor="zip">Zip Code</label><input id="zip" type="text" value={zip} onChange={(e) => setZip(e.target.value)} /></div>
              <div className="form-group grid-col-span-6"><div className="checkbox-group" style={{paddingTop: '0.5rem'}}><input id="jobsiteSame" type="checkbox" checked={isJobsiteSameAsBilling} onChange={(e) => setIsJobsiteSameAsBilling(e.target.checked)} /><label htmlFor="jobsiteSame">Jobsite address is the same as billing</label></div></div>
              <div className="form-actions grid-col-span-6"><button type="button" onClick={handleCreateAccount}>Create Account</button></div>
          </div>
        </fieldset>
      </div>
      {showArchiveModal && (<div className="modal-overlay"><div className="modal-content"><div className="modal-header"><h4>Archived Contacts</h4><button className="close-btn" onClick={() => setShowArchiveModal(false)}>×</button></div><div className="archived-list">{archivedContacts.length > 0 ? (archivedContacts.map((contact) => (<div key={contact.originalIndex} className="archived-item"><span>{contact.name || `Contact ${contact.originalIndex + 1}`}</span><button onClick={() => restoreContact(contact.originalIndex)}>Restore</button></div>))) : (<p>No contacts have been archived.</p>)}</div></div></div>)}
    </>
  );
}

export default AccountList;
