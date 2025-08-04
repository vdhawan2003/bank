import React, { createContext, useState, useEffect, useCallback } from 'react';
import { loginUser, signupUser } from '../api'; // Assuming api calls return { data: { token, user } } on success

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(false); // Add loading state
  const [error, setError] = useState(null); // Add error state

  // Effect to potentially validate token on load (optional)
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser'); // Store user data too
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    } else {
       setIsAuthenticated(false); // Ensure state is false if no token/user
    }
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loginUser(credentials);
      if (response.data && response.data.token && response.data.user) {
        const { token: apiToken, user: apiUser } = response.data;
        localStorage.setItem('authToken', apiToken);
        localStorage.setItem('authUser', JSON.stringify(apiUser)); // Store user data
        setToken(apiToken);
        setUser(apiUser);
        setIsAuthenticated(true);
        return true; // Indicate success
      } else {
         throw new Error(response.data.message || 'Login failed: Invalid response from server');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || err.message || 'Login failed');
      setIsAuthenticated(false); // Ensure state reflects failure
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      return false; // Indicate failure
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await signupUser(userData);
       if (response.status === 201 && response.data.message) {
       
          // Signup successful, but doesn't log in automatically based on backend
          // Optionally, you could call login() right after signup if desired
          return true; // Indicate success
       } else {
         throw new Error(response.data.message || 'Signup failed: Invalid response from server');
       }
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.response?.data?.message || err.message || 'Signup failed');
       return false; // Indicate failure
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null); // Clear any previous errors on logout
  }, []);

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    signup,
    logout,
    setError // Allow components to clear errors if needed
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;