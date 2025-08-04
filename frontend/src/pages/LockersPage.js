import React, { useState, useEffect } from 'react';
import { getLockers, createLocker, deleteLocker } from '../api'; // Import deleteLocker
import './LockersPage.css'; // <-- Import the CSS file

const LockersPage = () => {
  const [lockers, setLockers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Error for fetching list

  // --- Form State ---
  const [lockerName, setLockerName] = useState(''); // Simpler state for single input
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // --- Deletion State ---
  const [deletingId, setDeletingId] = useState(null); // Track which locker is being deleted
  const [deleteError, setDeleteError] = useState('');

  // --- Fetch Existing Lockers ---
  const fetchLockers = async () => {
    setLoading(true);
    setError(null);
    setDeleteError('');
    try {
      const res = await getLockers();
      setLockers(res.data.lockers || []); // Ensure it defaults to empty array
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch lockers');
      setLockers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on initial mount
  useEffect(() => {
    fetchLockers();
  }, []);

  // --- Handle Adding a New Locker ---
  const handleAddLockerSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setDeleteError('');

    // Basic Frontend Validation
    if (!lockerName.trim()) {
      setFormError('Locker Name/Description is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Backend expects { locker_name: '...' }
      await createLocker({ locker_name: lockerName.trim() });
      setFormSuccess('Locker requested successfully!');
      setLockerName(''); // Clear the input field
      fetchLockers(); // Refresh the list
    } catch (err) {
      console.error("Add locker error:", err);
      setFormError(err.response?.data?.message || 'Failed to request locker.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Handle Deleting a Locker ---
  const handleDeleteLocker = async (lockerId) => {
    // Optional: Confirmation dialog
    if (!window.confirm('Are you sure you want to remove this locker?')) {
      return;
    }

    setDeletingId(lockerId);
    setDeleteError('');
    setFormError('');
    setFormSuccess('');

    try {
      // Assumes deleteLocker(id) exists in api.js and backend
      await deleteLocker(lockerId);
      fetchLockers(); // Refresh the list on success
      // Optionally show a success message
    } catch (err) {
      console.error(`Delete locker error (ID: ${lockerId}):`, err);
      setDeleteError(err.response?.data?.message || `Failed to delete locker (ID: ${lockerId}).`);
    } finally {
      setDeletingId(null);
    }
  };

  // Note: The loading <p> tag will be styled by the CSS rule:
  // .lockers-page-container > p:first-of-type
  if (loading) return <p>Loading lockers...</p>;

  return (
    // Added className here for container styling from LockersPage.css
    <div className="lockers-page-container">
      <h2>Lockers</h2>

      {/* Add New Locker Form */}
      <h3>Request New Locker</h3>
      {/* Form elements will be styled by the CSS */}
      <form onSubmit={handleAddLockerSubmit}>
        <div>
          <label htmlFor="locker_name">Locker Name/Description:</label>
          <input
            type="text"
            id="locker_name"
            value={lockerName}
            onChange={(e) => setLockerName(e.target.value)} // Update simple state
            required
          />
        </div>

        {/* These paragraphs will be styled by CSS targeting inline styles */}
        {formError && <p style={{ color: 'red' }}>{formError}</p>}
        {formSuccess && <p style={{ color: 'green' }}>{formSuccess}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Requesting...' : 'Request Locker'}
        </button>
      </form>
      <hr/>

      {/* Locker List */}
      <h3>Your Lockers</h3>
      {/* These paragraphs will be styled by CSS */}
      {error && <p style={{ color: 'red' }}>Error loading list: {error}</p>}
      {deleteError && <p style={{ color: 'red' }}>Error deleting: {deleteError}</p>}

      {lockers.length > 0 ? (
        // The ul and li elements will be styled by CSS (overriding inline styles)
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {lockers.map((locker) => (
            <li key={locker.id} style={{ border: '1px solid #ccc', marginBottom: '10px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {/* Locker details */}
                <strong>Name:</strong> {locker.locker_name || 'N/A'} <br />
                {locker.created_at && <span>Requested on: {new Date(locker.created_at).toLocaleDateString()}</span>}
              </div>
              {/* Remove button will be styled by CSS (overriding inline styles) */}
              <button
                  onClick={() => handleDeleteLocker(locker.id)}
                  disabled={deletingId === locker.id}
                  style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}
              >
                  {deletingId === locker.id ? 'Removing...' : 'Remove'}
              </button>
            </li>
          ))}
        </ul>
      ) : (
         // This paragraph will be styled by CSS
         !error && <p>No lockers requested or assigned yet.</p>
      )}
    </div>
  );
};

export default LockersPage;