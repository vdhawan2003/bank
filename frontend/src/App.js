import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';

// Import Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import MutualFundsPage from './pages/MutualFundsPage';
import LockersPage from './pages/LockersPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Import Auth Provider Hook - not needed here directly, but good to remember it's active
// import useAuth from './hooks/useAuth';

import './index.css'; // Import global styles

function App() {
  // const { isAuthenticated } = useAuth(); // Example if needed for logic in App.js

  return (
    <div className="App">
      <Navigation />
      <main style={{ padding: '20px' }}> {/* Add some padding */}
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
           <Route
            path="/dashboard" // Explicit dashboard route
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <TransactionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mutual-funds"
            element={
              <ProtectedRoute>
                <MutualFundsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lockers"
            element={
              <ProtectedRoute>
                <LockersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Not Found Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;