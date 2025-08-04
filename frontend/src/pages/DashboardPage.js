import React, { useState, useEffect } from 'react';
import { getBalance, getAccountType } from '../api'; // Import API functions
import useAuth from '../hooks/useAuth';
import './DashboardPage.css'; // <-- Import the CSS file

const DashboardPage = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [accountType, setAccountType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setBalance(null); // Reset balance on new fetch
      setAccountType(''); // Reset account type on new fetch
      try {
        // Simulate slight delay for loading indicator visibility
        // await new Promise(resolve => setTimeout(resolve, 500)); 
        
        const balanceRes = await getBalance();
        // Ensure data and balance property exist before parsing
        const balanceValue = balanceRes?.data?.balance !== undefined
          ? parseFloat(balanceRes.data.balance)
          : NaN; // Use NaN if balance is missing
        setBalance(isNaN(balanceValue) ? null : balanceValue); // Set to null if parsing failed or missing

        const accountTypeRes = await getAccountType();
        setAccountType(accountTypeRes?.data?.account_type || 'N/A'); // Provide default if missing
        
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError(err.response?.data?.message || 'Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Fetch on component mount

  // --- Loading State ---
  if (loading) {
      return (
          <div className="loading-message">
              <p>Loading your dashboard...</p>
              {/* You could add a CSS spinner here */}
          </div>
      );
  }

  // --- Error State ---
  if (error) {
      return (
          <div className="error-message">
              <p><strong>Oops! Something went wrong.</strong></p>
              <p>{error}</p>
          </div>
      );
  }

  // --- Main Content State ---
  return (
    <div className="dashboard-container">
      <h2 className="dashboard-header">Dashboard</h2>

      <div className="user-info">
        <div className="info-item">
          <span className="info-label">Welcome:</span>
          <span className="info-value">{user?.name || 'User'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Account Number:</span>
          <span className="info-value">{user?.account_no || 'N/A'}</span>
        </div>
        {accountType && (
          <div className="info-item">
            <span className="info-label">Account Type:</span>
            <span className="info-value">{accountType}</span>
          </div>
        )}
      </div>

      <div className="balance-section">
        <div className="balance-label">Current Balance</div>
        {balance !== null ? (
          <div className="balance-amount">${balance.toFixed(2)}</div>
        ) : (
          <div className="balance-error">Balance unavailable</div>
        )}
      </div>

      {/* You can add deposit/withdrawal forms or actions here */}
      {/* Example: 
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button className="action-button">Deposit Funds</button>
        <button className="action-button withdrawal">Withdraw Funds</button>
      </div> 
      */}
    </div>
  );
};

export default DashboardPage;