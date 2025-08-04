import React, { useState, useEffect } from 'react';
import {
  getTransactions,
  depositAmount,
  getBalance,
  withdrawAmount
} from '../api';
import './TransactionsPage.css'; // <-- Import the CSS file

const TransactionsPage = () => {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Loading states
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  // Error states
  const [errorBalance, setErrorBalance] = useState(null);
  const [errorTransactions, setErrorTransactions] = useState(null);

  // Form states
  const [depositAmountValue, setDepositAmountValue] = useState('');
  const [withdrawAmountValue, setWithdrawAmountValue] = useState('');
  const [formDepositError, setFormDepositError] = useState('');
  const [formDepositSuccess, setFormDepositSuccess] = useState('');
  const [formWithdrawalError, setFormWithdrawalError] = useState('');
  const [formWithdrawalSuccess, setFormWithdrawalSuccess] = useState('');

  // --- Fetch Balance Function ---
  const fetchBalance = async () => {
    setLoadingBalance(true);
    setErrorBalance(null);
    try {
      const res = await getBalance();
      const rawBalance = res.data.balance;
      const numericBalance = parseFloat(rawBalance);
      if (isNaN(numericBalance)) {
        throw new Error('Invalid balance data received from server.');
      }
      setBalance(numericBalance);
    } catch (err) {
      console.error("Fetch balance error:", err);
      setErrorBalance(err.response?.data?.message || err.message || 'Failed to fetch balance');
      setBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  };

  // --- Fetch Transactions Function ---
  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    setErrorTransactions(null);
    try {
      const res = await getTransactions();
      setTransactions(Array.isArray(res.data.transactions) ? res.data.transactions : []);
    } catch (err) {
      console.error("Fetch transactions error:", err);
      setErrorTransactions(err.response?.data?.message || 'Failed to fetch transactions');
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // --- Fetch initial data on mount ---
  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  // --- Handle Deposit Submission ---
  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    setFormDepositError('');
    setFormDepositSuccess('');
    setFormWithdrawalError(''); // Clear other form message
    setFormWithdrawalSuccess(''); // Clear other form message

    const amount = parseFloat(depositAmountValue);

    if (isNaN(amount) || amount <= 0) {
      setFormDepositError('Please enter a valid positive amount.');
      return;
    }

    // --- Disable interaction while submitting (optional but good UX) ---
    // setIsSubmitting(true); // Need state: const [isSubmitting, setIsSubmitting] = useState(false);

    try {
      await depositAmount({ amount });
      setFormDepositSuccess(`Successfully deposited $${amount.toFixed(2)}.`);
      setDepositAmountValue('');
      fetchBalance();
      fetchTransactions();
    } catch (depositError) {
      console.error("Deposit error:", depositError);
      setFormDepositError(depositError.response?.data?.message || 'Deposit failed.');
      fetchBalance(); // Refresh balance even on failure
    } finally {
      // setIsSubmitting(false);
    }
  };

  // --- Handle Withdrawal Submission ---
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setFormWithdrawalError('');
    setFormWithdrawalSuccess('');
    setFormDepositError(''); // Clear other form message
    setFormDepositSuccess(''); // Clear other form message

    const amount = parseFloat(withdrawAmountValue);

    if (isNaN(amount) || amount <= 0) {
        setFormWithdrawalError('Please enter a valid positive amount.');
        return;
    }

    // --- Disable interaction while submitting (optional but good UX) ---
    // setIsSubmitting(true);

    try {
        await withdrawAmount({ amount });
        setFormWithdrawalSuccess(`Successfully withdrew $${amount.toFixed(2)}.`);
        setWithdrawAmountValue('');
        fetchBalance();
        fetchTransactions();
    } catch (err) {
        console.error("Withdrawal error:", err);
        setFormWithdrawalError(err.response?.data?.message || 'Withdrawal failed.');
        fetchBalance(); // Refresh balance even on failure
    } finally {
        // setIsSubmitting(false);
    }
  };

  // --- Determine combined loading state for disabling forms maybe ---
  // const isProcessing = loadingBalance || loadingTransactions || isSubmitting; // If using isSubmitting state

  // --- JSX Below ---
  return (
    // Added className for container styling
    <div className="transactions-page-container">
      <h2>Transactions</h2>

      {/* --- Balance Display --- Styled by CSS */}
      <h3>Current Balance</h3>
      {loadingBalance && <p>Loading balance...</p>}
      {errorBalance && <p style={{ color: 'red' }}>Error: {errorBalance}</p>}
      {balance !== null && !loadingBalance && !errorBalance && (
        <p style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
          ${balance.toFixed(2)}
        </p>
      )}
      <hr />

      {/* --- Deposit Form --- Styled by CSS */}
      <h3>Make a Deposit</h3>
      <form onSubmit={handleDepositSubmit}>
          <div>
              <label htmlFor="depositAmount">Amount:</label>
              <input type="number" id="depositAmount" value={depositAmountValue}
                     onChange={(e) => setDepositAmountValue(e.target.value)}
                     min="0.01" step="0.01" required
                    //  disabled={isProcessing} // Example: Disable input while loading/submitting
                     />
          </div>
          {formDepositSuccess && <p style={{ color: 'green' }}>{formDepositSuccess}</p>}
          {formDepositError && <p style={{ color: 'red' }}>{formDepositError}</p>}
          <button type="submit"
            // disabled={isProcessing} // Example: Disable button
            >Deposit</button>
      </form>
      <hr />

      {/* --- Withdrawal Form --- Styled by CSS */}
      <h3>Make a Withdrawal</h3>
      <form onSubmit={handleWithdrawSubmit}>
            <div>
                <label htmlFor="withdrawAmount">Amount:</label>
                <input type="number" id="withdrawAmount" value={withdrawAmountValue}
                       onChange={(e) => setWithdrawAmountValue(e.target.value)}
                       min="0.01" step="0.01" required
                      //  disabled={isProcessing}
                       />
            </div>
            {formWithdrawalSuccess && <p style={{ color: 'green' }}>{formWithdrawalSuccess}</p>}
            {formWithdrawalError && <p style={{ color: 'red' }}>{formWithdrawalError}</p>}
            <button type="submit" disabled={balance === null /* || isProcessing */}>Withdraw</button>
      </form>
      <hr />

      {/* --- Transaction History --- Styled by CSS */}
      <h3>History</h3>
      {loadingTransactions && <p>Loading transaction history...</p>}
      {errorTransactions && <p style={{ color: 'red' }}>Error fetching history: {errorTransactions}</p>}
      {!loadingTransactions && transactions.length === 0 && !errorTransactions && (
           <p>No transactions found.</p>
      )}
      {Array.isArray(transactions) && transactions.length > 0 && (
        // List items styled by CSS
        <ul>
          {transactions.map((tx) => (
             tx && tx.id ? (
               <li key={tx.id}>
                  {new Date(tx.transaction_date || tx.created_at || Date.now()).toLocaleString()} -
                  {/* Capitalize type for display */}
                  <span style={{ textTransform: 'capitalize', fontWeight: '500' }}> {tx.transaction_type}</span> -
                  <span style={{ float: 'right', fontWeight: 'bold', color: tx.transaction_type === 'deposit' ? '#1a936f' : (tx.transaction_type === 'withdrawal' ? '#c62828' : '#333') }}>
                       {/* Display +/- sign based on type */}
                       {tx.transaction_type === 'deposit' ? '+' : (tx.transaction_type === 'withdrawal' ? '-' : '')}
                       ${typeof tx.amount === 'number' || !isNaN(parseFloat(tx.amount)) ? parseFloat(tx.amount).toFixed(2) : 'N/A'}
                  </span>
               </li>
             ) : null
          ))}
        </ul>
      )}
    </div>
  );
};

export default TransactionsPage;