// src/pages/AccountDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import '../components/AccountList.css'; // Reuse styles

const usStates = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
const defaultPhone = { type: 'Mobile', number: '', smsOk: false, numberStatus: 'pristine' };
const defaultContact = { name: '', email: '', emailStatus: 'pristine', isJobContact: false, isArchived: false, phones: [{ ...defaultPhone }] };


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

  const [showAddressHistory, setShowAddressHistory] = useState(false);

  const [standardZips, setStandardZips] = useState([]);
  const [travelFeeZips, setTravelFeeZips] = useState([]);
  const [zipStatus, setZipStatus] = useState('pristine');
  const [overrideOutOfArea, setOverrideOutOfArea] = useState(false);

  const capitalizeWords = (str) => str ? str.replace(/\b\w/g, (char) => char.toUpperCase()) : '';
  const validateEmail = (email) => {
    if (email.trim() === '') return 'pristine';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? 'valid' : 'invalid';
  };
  const validatePhone = (phone) => {
    if (phone.trim() === '') return 'pristine';
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    return phoneRegex.test(phone) ? 'valid' : 'invalid';
  };
  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return `(${phoneNumber}`;
    if (phoneNumberLength < 7) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  useEffect(() => {
    const docRef = doc(db, 'accounts', accountId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setAccount(data);
        if (!isEditing) {
            setFormData({
                billingAddress: data.billingAddress,
                contacts: data.contacts.map(c => ({...c, emailStatus: 'pristine', phones: c.phones.map(p => ({...p, numberStatus: 'pristine'}))})),
                companyName: data.companyName || ''
            });
        }
      } else { setAccount(null); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [accountId, isEditing]);

  useEffect(() => {
    const fetchSettings = async () => {
        const settingsRef = doc(db, 'settings', 'serviceArea');
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            setStandardZips(data.standardZips || []);
            setTravelFeeZips(data.travelFeeZips || []);
        }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const zip = formData.billingAddress.zip || '';
    if (zip.length < 5) {
      setZipStatus('pristine'); return;
    }
    if (standardZips.includes(zip)) setZipStatus('standard');
    else if (travelFeeZips.includes(zip)) setZipStatus('travel');
    else setZipStatus('out-of-area');
    setOverrideOutOfArea(false);
  }, [formData.billingAddress.zip, standardZips, travelFeeZips]);

  const handleContactChange = (index, field, value) => {
    const newContacts = [...formData.contacts];
    newContacts[index][field] = value;
    if (field === 'email') { newContacts[index].emailStatus = validateEmail(value); }
    setFormData(prev => ({...prev, contacts: newContacts}));
  };
  const handlePhoneChange = (contactIndex, phoneIndex, field, value) => {
    const newContacts = [...formData.contacts];
    const phone = newContacts[contactIndex].phones[phoneIndex];
    if (field === 'smsOk') {
        phone.smsOk = value;
    } else if (field === 'type') {
        phone.type = value;
    } else {
        const formattedNumber = formatPhoneNumber(value);
        phone.number = formattedNumber;
        phone.numberStatus = validatePhone(formattedNumber);
    }
    setFormData(prev => ({...prev, contacts: newContacts}));
  };
  const handleBillingChange = (field, value) => {
    setFormData(prev => ({...prev, billingAddress: {...prev.billingAddress, [field]: value}}));
  };
  const handleCompanyChange = (value) => {
      setFormData(prev => ({...prev, companyName: value}));
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
        } else {
             const anyOtherContact = newContacts.find(c => c.isArchived === false);
             if(!anyOtherContact) {
                 // No active contacts left
             }
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
      <h2>Account Details</h2>
      <div className="account-form-container">
        <fieldset>
          <legend>{account.accountNumber}</legend>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
                <h3 style={{ margin: 0, lineHeight: 1.2 }}>{account.companyName || 'Individual Account'}</h3>
                <p style={{ margin: '0.25rem 0 0 0' }}>Customer since {new Date(account.createdAt?.toDate()).toLocaleDateString()}</p>
            </div>
            {!isEditing && <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit</button>}
          </div>
          <hr style={{margin: '1.5rem 0'}}/>
          
          <div className="form-grid">
            {isEditing && (
                <div className="form-group grid-col-span-6">
                    <label>Company Name</label>
                    <input type="text" value={formData.companyName} onChange={(e) => handleCompanyChange(capitalizeWords(e.target.value))} />
                </div>
            )}
            
            <div className="form-group grid-col-span-3">
              <label>
                Billing Address
                {!isEditing && account.addressHistory && account.addressHistory.length > 0 && (
                    <button className="history-btn icon-btn" onClick={() => setShowAddressHistory(true)} title="View Address History">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    </button>
                )}
              </label>
              {isEditing ? (
                 <>
                    <input type="text" value={formData.billingAddress.street1} onChange={(e) => handleBillingChange('street1', capitalizeWords(e.target.value))} placeholder="Street 1" />
                    <input type="text" value={formData.billingAddress.street2} onChange={(e) => handleBillingChange('street2', capitalizeWords(e.target.value))} placeholder="Street 2 (Optional)" style={{marginTop: '0.5rem'}}/>
                    <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
                        <input type="text" value={formData.billingAddress.city} onChange={(e) => handleBillingChange('city', capitalizeWords(e.target.value))} placeholder="City"/>
                        <select value={formData.billingAddress.state} onChange={(e) => handleBillingChange('state', e.target.value)} style={{flex: '0 0 80px'}}>{usStates.map(s => <option key={s} value={s}>{s}</option>)}</select>
                        <input type="text" value={formData.billingAddress.zip} onChange={(e) => handleBillingChange('zip', e.target.value.replace(/[^\d]/g, ''))} maxLength="5" />
                    </div>
                    <div className={`zip-validation-message ${zipStatus}`}>
                        {zipStatus === 'standard' && '✓ Standard Service Area'}
                        {zipStatus === 'travel' && '✓ Travel Fee Applies'}
                        {zipStatus === 'out-of-area' && '✗ Out of Service Area'}
                    </div>
                    {zipStatus === 'out-of-area' && (
                        <div className="form-group grid-col-span-6" style={{marginTop: '1rem'}}>
                            <div className="checkbox-group warning">
                                <input id="overrideOutOfArea" type="checkbox" checked={overrideOutOfArea} onChange={(e) => setOverrideOutOfArea(e.target.checked)} />
                                <label htmlFor="overrideOutOfArea">This is a special case. I wish to override and save.</label>
                            </div>
                        </div>
                    )}
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
              <div className="read-only-field">{account.isJobsiteSameAsBilling ? 'Same as Billing' : 'Different Address (Display Logic TBD)'}</div>
            </div>
          </div>

          <h4 style={{marginTop: '2rem'}}>Contacts</h4>
          {isEditing ? (
            <>
              <div className="contact-tabs">
                {visibleContacts.map((contact, i) => (
                  <button key={contact.originalIndex} className={`tab-button ${i === activeContactIndex ? 'active' : ''} ${contact.isJobContact ? 'is-job-contact' : ''}`} onClick={() => setActiveContactIndex(i)}>
                    {contact.name || `Contact ${i + 1}`}
                    {contact.isJobContact && <span className="primary-tag">(Default)</span>}
                    {visibleContacts.length > 1 && (<span className="delete-tab-btn" title={`Archive Contact`} onClick={(e) => {e.stopPropagation(); archiveContact(contact.originalIndex);}}>×</span>)}
                  </button>
                ))}
                <button className="add-contact-btn" title="Add another contact" onClick={addContact}>+</button>
              </div>
              <div className="form-grid">
                  <div className="form-group grid-col-span-3"><label>Contact Name</label><input type="text" value={activeContact.name || ''} onChange={(e) => handleContactChange(activeContactIndex, 'name', capitalizeWords(e.target.value))} /></div>
                  <div className="form-group grid-col-span-3"><label>Email</label><input type="email" value={activeContact.email || ''} onChange={(e) => handleContactChange(activeContactIndex, 'email', e.target.value)} className={activeContact.emailStatus}/></div>
                  <div className="form-group grid-col-span-6"><label>Phone Numbers</label>
                      {activeContact.phones?.map((phone, pIndex) => (
                          <div key={pIndex} className="phone-entry"><input type="text" list="phone-types" value={phone.type} onChange={(e) => handlePhoneChange(activeContactIndex, pIndex, 'type', e.target.value)} style={{flexBasis: '120px'}} />
                              <div className="form-group" style={{flexGrow: 1, margin: 0}}><input type="tel" value={phone.number} onChange={(e) => handlePhoneChange(activeContactIndex, pIndex, 'number', e.target.value)} className={phone.numberStatus} /></div>
                              <div className="checkbox-group" style={{paddingTop: 0}}><input type="checkbox" checked={phone.smsOk} onChange={(e) => handlePhoneChange(activeContactIndex, pIndex, 'smsOk', e.target.checked)} /><label>SMS OK?</label></div>
                          </div>
                      ))}
                      <datalist id="phone-types"><option value="Mobile"/><option value="Work Mobile"/><option value="Work Office"/><option value="Home"/><option value="Spouse"/><option value="Fax"/></datalist>
                      <button className="add-phone-btn icon-btn" onClick={() => addPhoneNumber(activeContactIndex)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        <span>Add Phone</span>
                      </button>
                  </div>
                  <div className="form-group grid-col-span-6">
                      <div className="checkbox-group" style={{paddingTop: 0}}><input type="checkbox" checked={activeContact.isJobContact} onChange={() => handleJobContactToggle(activeContactIndex)}/><label>Default Job Contact</label></div>
                  </div>
              </div>
            </>
          ) : (
            account.contacts?.map((contact, index) => !contact.isArchived && (
                <div key={index} className="contact-card read-only">
                    <div className="contact-card-header"><strong>{contact.name}</strong>{contact.isJobContact && <span className="job-contact-tag">Default</span>}</div>
                    <div className="info-group"><label>Email</label><div className="value">{contact.email || 'N/A'}</div></div>
                    <div className="info-group"><label>Phone</label>
                        {contact.phones?.map((phone, pIndex) => (<div key={pIndex} className="value">{phone.type}: {phone.number} {phone.smsOk && '(SMS OK)'}</div>))}
                    </div>
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
      {showErrorModal && (
        <div className="modal-overlay">
            <div className="modal-content error-modal"><div className="modal-header"><h4>Save Failed</h4><button className="close-btn" onClick={() => setShowErrorModal(false)}>×</button></div><p>{errorMessage}</p><div className="form-actions" style={{justifyContent: 'flex-end'}}><button onClick={() => setShowErrorModal(false)}>OK</button></div></div>
        </div>
      )}
      {showAddressHistory && (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header"><h4>Address History</h4><button className="close-btn" onClick={() => setShowAddressHistory(false)}>×</button></div>
                <div className="archived-list">
                    {(account.addressHistory || []).map((addr, index) => (
                        <div key={index} className="archived-item">
                            <span>{addr.street1}, {addr.city}, {addr.state} {addr.zip}</span>
                            <button className="secondary-btn" onClick={() => handleRestoreAddress(addr)}>Restore</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </>
  );
}

export default AccountDetail;
