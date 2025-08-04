import React, { useState, useEffect } from 'react';
import { getMutualFunds, createMutualFund, deleteMutualFund } from '../api'; // Make sure deleteMutualFund is imported
import './MutualFundsPage.css'; // <-- Import the CSS file

const MutualFundsPage = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Error for fetching list

  // --- Form State ---
  const [formData, setFormData] = useState({
    fund_name: '',
    amount_invested: '',
    fund_type: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // --- Deletion State ---
  const [deletingId, setDeletingId] = useState(null); // Track which fund is being deleted
  const [deleteError, setDeleteError] = useState('');

  // --- Fetch Existing Funds ---
  const fetchFunds = async () => {
    setLoading(true);
    setError(null);
    setDeleteError(''); // Clear previous errors
    try {
      const res = await getMutualFunds();
      // Ensure amount_invested is treated as a number for calculations/display
      const formattedInvestments = (res.data.investments || []).map(fund => ({
          ...fund,
          amount_invested: parseFloat(fund.amount_invested) || 0
      }));
      setInvestments(formattedInvestments);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch mutual funds');
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on initial mount
  useEffect(() => {
    fetchFunds();
  }, []);

  // --- Handle Form Input Changes ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    setFormError(''); // Clear errors on change
    setFormSuccess(''); // Clear success on change
  };

  // --- Handle Adding a New Fund ---
  const handleAddFundSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setDeleteError('');

    // Basic Frontend Validation
    const { fund_name, amount_invested, fund_type } = formData;
    if (!fund_name.trim() || !amount_invested || !fund_type.trim()) {
      setFormError('All fields are required.');
      return;
    }
    const numericAmount = parseFloat(amount_invested);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setFormError('Please enter a valid positive amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createMutualFund({
          fund_name: fund_name.trim(),
          amount_invested: numericAmount,
          fund_type: fund_type.trim()
       });
      setFormSuccess('Investment added successfully!');
      // Clear the form
      setFormData({ fund_name: '', amount_invested: '', fund_type: '' });
      fetchFunds(); // Refresh the list
    } catch (err) {
      console.error("Add fund error:", err);
      setFormError(err.response?.data?.message || 'Failed to add investment.');
    } finally {
      setIsSubmitting(false);
    }
  };

   // --- Handle Deleting an Investment ---
  const handleDeleteFund = async (fundId) => {
    // Optional: Confirmation dialog
    if (!window.confirm('Are you sure you want to remove this investment? This action cannot be undone.')) {
        return;
    }

    setDeletingId(fundId); // Mark this specific fund as being deleted (for UI feedback)
    setDeleteError(''); // Clear previous deletion errors
    setFormError(''); // Clear other form errors
    setFormSuccess('');

    try {
        // Assumes you have deleteMutualFund(id) in api.js and corresponding backend route
        await deleteMutualFund(fundId);
        // Success: Refresh the list to show the item removed
        fetchFunds();
        // Optionally show a success message (or rely on list refresh)
    } catch (err) {
        console.error(`Delete fund error (ID: ${fundId}):`, err);
        setDeleteError(err.response?.data?.message || `Failed to delete investment (ID: ${fundId}).`);
         // Set error specific to deletion near the list?
    } finally {
        setDeletingId(null); // Finish deletion process for this ID
    }
  };

  // Loading message styled by CSS
  if (loading) return <p>Loading mutual funds...</p>;

  return (
    // Added className for container styling
    <div className="mutual-funds-page-container">
      <h2>Mutual Funds</h2>

      {/* Add New Investment Form */}
      <h3>Add Investment</h3>
       {/* Form styled by CSS */}
       <form onSubmit={handleAddFundSubmit}>
            <div>
                <label htmlFor="fund_name">Fund Name:</label>
                <input type="text" id="fund_name" name="fund_name"
                       value={formData.fund_name} onChange={handleFormChange} required />
            </div>
             <div>
                <label htmlFor="amount_invested">Amount Invested:</label>
                <input type="number" id="amount_invested" name="amount_invested"
                       value={formData.amount_invested} onChange={handleFormChange}
                       min="0.01" step="0.01" required />
            </div>
             <div>
                <label htmlFor="fund_type">Fund Type:</label>
                 <input type="text" id="fund_type" name="fund_type"
                       value={formData.fund_type} onChange={handleFormChange} required />
            </div>

            {/* Messages styled by CSS (targeting inline styles) */}
            {formError && <p style={{ color: 'red' }}>{formError}</p>}
            {formSuccess && <p style={{ color: 'green' }}>{formSuccess}</p>}
            {/* Button styled by CSS */}
            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Fund'}
            </button>
       </form>
       <hr/> {/* Styled by CSS */}

      {/* Investment List */}
       <h3>Your Investments</h3>
       {/* Page-level errors styled by CSS */}
       {error && <p style={{ color: 'red' }}>Error loading list: {error}</p>}
       {deleteError && <p style={{ color: 'red' }}>Error deleting: {deleteError}</p>}

      {investments.length > 0 ? (
        // List and items styled by CSS (overriding inline styles)
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {investments.map((fund) => (
            <li key={fund.id} style={{ border: '1px solid #ccc', marginBottom: '10px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               {/* Details styled by CSS */}
               <div>
                  <strong>{fund.fund_name}</strong> ({fund.fund_type || 'N/A'})<br />
                  Invested: ${fund.amount_invested ? fund.amount_invested.toFixed(2) : '0.00'}<br />
                  Date: {fund.date_invested ? new Date(fund.date_invested).toLocaleDateString() : 'N/A'}
               </div>
               {/* Button styled by CSS (overriding inline styles) */}
               <button
                    onClick={() => handleDeleteFund(fund.id)}
                    disabled={deletingId === fund.id} // Disable while this item is deleting
                    style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
                >
                    {deletingId === fund.id ? 'Dropping...' : 'Drop'}
                </button>
            </li>
          ))}
        </ul>
      ) : (
         // Message styled by CSS
         !error && <p>No mutual fund investments found. Add one using the form above.</p>
      )}
    </div>
  );
};

export default MutualFundsPage;