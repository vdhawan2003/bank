import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import useAuth from '../hooks/useAuth'; // useAuth is still needed for other potential context values or side effects
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // const { error } = useAuth(); // Removed 'error' as it's unused here
  useAuth(); // Call the hook if it has side effects or provides other context implicitly, otherwise you might remove this line too if ONLY error was needed. Keep it if AuthForm or other parts rely on the Auth context being active/initialized by the hook.

  // Redirect path after successful login
  const from = location.state?.from?.pathname || "/"; // Default to dashboard

  const handleLoginSuccess = () => {
    navigate(from, { replace: true }); // Redirect to intended page or dashboard
  };

  return (
    <div className="login-page-container">
      {/* AuthForm contents will be styled by the CSS above */}
      <AuthForm mode="login" onSubmitSuccess={handleLoginSuccess} />

      {/* Optional page-level error - If you uncomment this, add 'error' back to useAuth() above */}
      {/* {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>} */}
    </div>
  );
};

export default LoginPage;