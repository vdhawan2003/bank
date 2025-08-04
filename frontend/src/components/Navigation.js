import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Navigation = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login after logout
  };

  return (
    <nav style={{ background: '#eee', padding: '10px', marginBottom: '20px' }}>
      <Link to="/" style={{ marginRight: '10px' }}>Home</Link>
      {isAuthenticated ? (
        <>
          <Link to="/transactions" style={{ marginRight: '10px' }}>Transactions</Link>
          <Link to="/mutual-funds" style={{ marginRight: '10px' }}>Mutual Funds</Link>
          <Link to="/lockers" style={{ marginRight: '10px' }}>Lockers</Link>
          <Link to="/profile" style={{ marginRight: '10px' }}>Profile</Link>
          <span style={{ marginRight: '15px' }}>Welcome, {user?.name || 'User'}!</span>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login" style={{ marginRight: '10px' }}>Login</Link>
          <Link to="/signup" style={{ marginRight: '10px' }}>Signup</Link>
        </>
      )}
    </nav>
  );
};

export default Navigation;