import React, { useState } from 'react';
import useAuth from '../hooks/useAuth'; // Use the hook

const AuthForm = ({ mode = 'login', onSubmitSuccess }) => {
  const { login, signup, loading, error, setError } = useAuth(); // Get functions and state from context
  const [formData, setFormData] = useState(
    mode === 'login'
      ? { account_no: '', mpin: '', password: '' }
      : { name: '', age: '', account_no: '', phone: '', email: '', mpin: '', password: '' }
  );
  const [loginMethod, setLoginMethod] = useState('password'); // 'mpin' or 'password'

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
     if(error) setError(null); // Clear error on input change
  };

  const handleLoginMethodChange = (e) => {
    setLoginMethod(e.target.value);
    // Clear the other login field when switching
    if (e.target.value === 'mpin') {
      setFormData({ ...formData, password: '' });
    } else {
      setFormData({ ...formData, mpin: '' });
    }
     if(error) setError(null); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let success = false;
    if (mode === 'login') {
      // Prepare credentials based on selected method
      const credentials = { account_no: formData.account_no };
      if (loginMethod === 'mpin') {
        credentials.mpin = formData.mpin;
      } else {
        credentials.password = formData.password;
      }
      success = await login(credentials);
    } else {
      success = await signup(formData);
    }

    if (success && onSubmitSuccess) {
      onSubmitSuccess(); // Callback for successful submission (e.g., redirect)
    }
    // Error handling is now managed by the AuthContext and displayed in the page component
  };

  // Common Fields
  const commonFields = (
    <>
      <div>
        <label htmlFor="account_no">Account Number:</label>
        <input type="text" id="account_no" name="account_no" value={formData.account_no} onChange={handleChange} required />
      </div>
      {mode === 'login' ? (
        <>
          <div>
            <label>Login with:</label>
            <select value={loginMethod} onChange={handleLoginMethodChange}>
              <option value="password">Password</option>
              <option value="mpin">MPIN</option>
            </select>
          </div>
          {loginMethod === 'mpin' && (
            <div>
              <label htmlFor="mpin">MPIN:</label>
              <input type="password" id="mpin" name="mpin" value={formData.mpin} onChange={handleChange} required={loginMethod === 'mpin'} maxLength="4" />
            </div>
          )}
          {loginMethod === 'password' && (
            <div>
              <label htmlFor="password">Password:</label>
              <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required={loginMethod === 'password'} />
            </div>
          )}
        </>
      ) : (
        // Signup specific fields
        <>
           <div>
             <label htmlFor="password">Password:</label>
             <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
           </div>
           <div>
             <label htmlFor="mpin">MPIN (4 digits):</label>
             <input type="password" id="mpin" name="mpin" value={formData.mpin} onChange={handleChange} required maxLength="4" pattern="\d{4}" title="MPIN must be 4 digits"/>
          </div>
        </>
      )}

    </>
  );

  return (
    <form onSubmit={handleSubmit}>
      <h2>{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
      {/* Signup specific fields */}
      {mode === 'signup' && (
        <>
          <div>
            <label htmlFor="name">Name:</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="age">Age:</label>
            <input type="number" id="age" name="age" value={formData.age} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="phone">Phone:</label>
            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
        </>
      )}

      {/* Common fields */}
      {commonFields}

      {/* Display error message */}
       {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Sign Up')}
      </button>
    </form>
  );
};

export default AuthForm;