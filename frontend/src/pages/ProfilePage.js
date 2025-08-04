import React, { useState, useEffect } from 'react';
import { getPersonalDetails, updatePersonalDetails } from '../api';
import useAuth from '../hooks/useAuth';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ address: '', dob: '', pan_no: '', aadhar_no: '' });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // ... (fetchDetails, handleChange, handleUpdateSubmit remain the same) ...
  // --- Fetch Existing Funds ---
  const fetchDetails = async () => {
    setLoading(true);
    setLoadError(null); // Clear previous load errors
    try {
      const res = await getPersonalDetails();
      const existingDetails = res.data;

      if (existingDetails && Object.keys(existingDetails).length > 0) {
        const formattedDob = existingDetails.dob
          ? new Date(existingDetails.dob).toISOString().split('T')[0]
          : '';

        setFormData({
          address: existingDetails.address || '',
          dob: formattedDob,
          pan_no: existingDetails.pan_no || '',
          aadhar_no: existingDetails.aadhar_no || '',
        });
      } else {
         console.log("No existing personal details found for user.");
      }
    } catch (err) {
       console.error("Fetch details error:", err);
      setLoadError(err.response?.data?.message || 'Failed to load personal details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  // Handle changes in form inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError(''); // Clear validation/submission errors on new input
    setFormSuccess(''); // Clear success message on new input
  };

  // Handle the update form submission
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setUpdating(true); // Indicate update process started

    try {
       const dataToSend = { ...formData };
       // Ensure dob isn't empty string if that causes issues, maybe send null?
       // if (dataToSend.dob === '') delete dataToSend.dob; or dataToSend.dob = null;

      await updatePersonalDetails(dataToSend); // Calls POST /personal-details
      setFormSuccess('Personal details updated successfully!');
      // fetchDetails(); // Optionally re-fetch

    } catch (err) {
      console.error("Update details error:", err);
      setFormError(err.response?.data?.message || 'Failed to update details.');
    } finally {
      setUpdating(false); // Indicate update process finished
    }
  };

  return (
    <div className="profile-page-container">
      <h2>Profile & Personal Details</h2>

      {/* Recommend adding className here */}
      <div className="basic-user-info">
        {user ? (
          <> {/* Use Fragment to avoid unnecessary div */}
            <p><strong>Name:</strong> {user.name || 'N/A'}</p>
            <p><strong>Email:</strong> {user.email || 'N/A'}</p>
            <p><strong>Account No:</strong> {user.account_no || 'N/A'}</p>
            <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
          </>
        ) : (
          <p className="loading-message">Loading user information...</p> // Add class
        )}
      </div>
      <hr/>

      <h3>Update Personal Details</h3>
      {/* Add classes to loading/error messages */}
      {loading && <p className="loading-message">Loading details form...</p>}
      {loadError && <p className="load-error-message" /* Removed inline style */ >Warning loading details: {loadError}</p>}

      {!loading && (
         <form onSubmit={handleUpdateSubmit}>
              <div>
                  <label htmlFor="address">Address:</label>
                  <textarea id="address" name="address" value={formData.address} onChange={handleChange} rows="3"></textarea>
              </div>
              <div>
                  <label htmlFor="dob">Date of Birth:</label>
                  <input type="date" id="dob" name="dob" value={formData.dob} onChange={handleChange} />
              </div>
              <div>
                  <label htmlFor="pan_no">PAN Number:</label>
                  <input type="text" id="pan_no" name="pan_no" value={formData.pan_no} onChange={handleChange} />
              </div>
               <div>
                  <label htmlFor="aadhar_no">Aadhar Number:</label>
                  <input type="text" id="aadhar_no" name="aadhar_no" value={formData.aadhar_no} onChange={handleChange} />
              </div>

              {/* Add classes and REMOVE inline styles */}
              {formError && <p className="form-error-message" /* Removed inline style */ >{formError}</p>}
              {formSuccess && <p className="form-success-message" /* Removed inline style */ >{formSuccess}</p>}

              <button type="submit" disabled={updating || loading}>
                {updating ? 'Saving...' : 'Save Details'}
              </button>
         </form>
       )}
    </div>
  );
};

export default ProfilePage;