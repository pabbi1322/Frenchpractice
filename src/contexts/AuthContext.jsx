// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services/AuthService';
import indexedDBService from '../services/IndexedDBService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);

  // Check IndexedDB status
  useEffect(() => {
    const checkDbStatus = async () => {
      try {
        const status = await indexedDBService.getStatus();
        setDbStatus(status);
        
        if (!status.connected) {
          console.error('IndexedDB is not available');
          setAuthError('Database connection issue detected. Some features may not work properly.');
        }
      } catch (error) {
        console.error('Failed to check IndexedDB status:', error);
        setDbStatus({ connected: false, error: error.message });
      }
    };
    
    checkDbStatus();
  }, []);

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userId = localStorage.getItem('currentUserId');
        
        if (token && userId) {
          console.log(`Found auth token and user ID (${userId}), verifying...`);
          
          try {
            const userData = await AuthService.verifyToken(token);
            console.log('Token verified successfully, user data:', userData);
            setUser(userData);
            setAuthError(null);
            
            // Get subscription status
            const subStatus = await AuthService.getSubscriptionStatus();
            console.log('Subscription status:', subStatus);
            setSubscription(subStatus);
          } catch (verifyError) {
            console.error('Token verification failed:', verifyError);
            // Clear invalid auth data
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUserId');
            setAuthError('Your session has expired. Please login again.');
          }
        } else {
          console.log('No complete auth data found');
          // Clear any partial auth data
          if (token || userId) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUserId');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthError(`Authentication check failed: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      // Clear any previous errors
      setAuthError(null);
      
      if (!email || !password) {
        setAuthError('Email and password are required');
        return { success: false, error: 'Email and password are required' };
      }
      
      console.log(`Attempting to login with email: ${email}`);
      
      // Check database status first
      const status = await indexedDBService.getStatus();
      if (!status.connected) {
        const errorMsg = 'Database connection issue. Please try again or check browser compatibility.';
        setAuthError(errorMsg);
        return { success: false, error: errorMsg };
      }
      
      const response = await AuthService.login(email, password);
      console.log('Login successful:', response);
      
      setUser(response.user);
      setSubscription(response.subscription);
      localStorage.setItem('authToken', response.token);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error.message);
      return { success: false, error: error.message };
    }
  };

  const signup = async (email, password, name) => {
    try {
      // Clear any previous errors
      setAuthError(null);
      
      if (!email || !password || !name) {
        setAuthError('All fields are required');
        return { success: false, error: 'All fields are required' };
      }
      
      if (password.length < 6) {
        setAuthError('Password must be at least 6 characters');
        return { success: false, error: 'Password must be at least 6 characters' };
      }
      
      console.log(`Attempting to create account with email: ${email} and name: ${name}`);
      
      // Check database status first
      const status = await indexedDBService.getStatus();
      if (!status.connected) {
        const errorMsg = 'Database connection issue. Please try again or check browser compatibility.';
        setAuthError(errorMsg);
        return { success: false, error: errorMsg };
      }
      
      const response = await AuthService.signup(email, password, name);
      console.log('Signup successful:', response);
      
      setUser(response.user);
      localStorage.setItem('authToken', response.token);
      
      // Set default subscription for new users
      const defaultSubscription = {
        id: 'sub_new_user',
        status: 'active',
        planId: 'free',
        currentPeriodEnd: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
      };
      
      setSubscription(defaultSubscription);
      localStorage.setItem('frenchmaster_subscription', JSON.stringify(defaultSubscription));
      setAuthError(null);
      
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      setAuthError(error.message);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    console.log('Logging out user');
    setUser(null);
    setSubscription(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUserId');
    AuthService.logout();
  };

  const updateSubscription = (newSubscription) => {
    console.log('Updating subscription:', newSubscription);
    setSubscription(newSubscription);
    localStorage.setItem('frenchmaster_subscription', JSON.stringify(newSubscription));
  };

  const isPaidUser = () => {
    // Try localStorage first (set by the payment/subscription process)
    const storedSubscription = localStorage.getItem('frenchmaster_subscription');
    
    if (storedSubscription) {
      try {
        const subData = JSON.parse(storedSubscription);
        if (subData && subData.status === 'active') {
          return true;
        }
      } catch (error) {
        console.error('Error parsing subscription data:', error);
      }
    }
    
    // Fall back to context state if localStorage doesn't have valid data
    if (subscription && subscription.status === 'active') {
      return true;
    }
    
    // For demo purposes, we're returning true to unlock all features
    // In a production app, you would properly validate the subscription status
    return true;
  };

  const value = {
    user,
    subscription,
    loading,
    login,
    signup,
    logout,
    updateSubscription,
    isPaidUser,
    authError,
    dbStatus,
    clearAuthError: () => setAuthError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {import.meta.env.MODE !== 'production' && import.meta.env.VITE_ENABLE_DEBUG === 'true' && (
        <div className="auth-debug-info">
          {authError && (
            <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 px-4 z-50">
              Authentication Error: {authError}
              <button 
                className="ml-4 bg-white text-red-500 rounded px-2" 
                onClick={() => setAuthError(null)}
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </AuthContext.Provider>
  );
};