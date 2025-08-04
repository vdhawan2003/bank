import axios from 'axios';

// Create an axios instance
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000', // Fallback URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication API calls
export const loginUser = (credentials) => apiClient.post('/login', credentials);
export const signupUser = (userData) => apiClient.post('/signup', userData);

// Account API calls (Protected)
export const getBalance = () => apiClient.get('/balance');
export const depositAmount = (data) => apiClient.post('/deposit', data);
export const getAccountType = () => apiClient.get('/account-type');

// Transaction API calls (Protected)
export const createTransaction = (data) => apiClient.post('/transaction', data);
export const getTransactions = () => apiClient.get('/transactions');

// Mutual Fund API calls (Protected)
export const createMutualFund = (data) => apiClient.post('/mutual-fund', data);
export const getMutualFunds = () => apiClient.get('/mutual-funds');
export const deleteMutualFund = (fundId) => apiClient.delete(`/mutual-fund/${fundId}`);

// Locker API calls (Protected)
export const createLocker = (data) => apiClient.post('/locker', data);
export const getLockers = () => apiClient.get('/lockers');
export const deleteLocker = (lockerId) => apiClient.delete(`/locker/${lockerId}`);

// Personal Details API calls (Protected)
export const getPersonalDetails = () => apiClient.get('/personal-details');
export const updatePersonalDetails = (data) => apiClient.post('/personal-details', data);

export const withdrawAmount = (data) => apiClient.post('/withdraw', data);

export default apiClient; // Optional: export the configured instance if needed directly