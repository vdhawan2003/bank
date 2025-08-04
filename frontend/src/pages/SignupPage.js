import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import useAuth from '../hooks/useAuth';
import './SignupPage.css'; // <-- Import the CSS file

const SignupPage = () => {
  const navigate = useNavigate();
  // Removed 'error' from useAuth as it's not used (commented out below)
  // If you uncomment the error display, add { error } back: const { error } = useAuth();
  useAuth();
  const [signupMessage, setSignupMessage] = useState('');

  const handleSignupSuccess = () => {
    // Optional: Show a success message and redirect to login
    setSignupMessage('Signup successful! Please log in.');
    // Redirect after a short delay or provide a link
    setTimeout(() => {
       navigate('/login');
    }, 2000); // Redirect after 2 seconds
  };

  // --- Backend logic - Should NOT be in frontend component ---
  // const bankDetailsQuery = `
  // INSERT INTO bank_details
  // (user_id, account_type, opening_balance, current_balance, account_status)
  // VALUES (?, ?, ?, ?, ?)
  // `;
  // const initialBalance = 0.00;
  // const accountType = 'Saving';
  // const initialStatus = 'active';
  // --- End of backend logic ---

  return (
    // Added className for container styling
    <div className="signup-page-container">
      {/* AuthForm contents will be styled by CSS */}
      <AuthForm mode="signup" onSubmitSuccess={handleSignupSuccess} />

      {/* Signup success message - Styled by CSS targeting inline style */}
      {signupMessage && <p style={{ color: 'green', marginTop: '10px' }}>{signupMessage}</p>}

      {/* Optional context error - Styled by CSS targeting inline style */}
      {/* {error && !signupMessage && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>} */}
    </div>
  );
};

export default SignupPage;