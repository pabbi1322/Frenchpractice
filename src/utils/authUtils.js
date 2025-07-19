// src/utils/authUtils.js

/**
 * Utility function to handle authentication errors
 * @param {Error} error - The error object
 * @returns {string} A user-friendly error message
 */
export const getAuthErrorMessage = (error) => {
  // Check if it's already a string message
  if (typeof error === 'string') {
    return error;
  }

  // Check for specific error messages
  const errorMessage = error.message?.toLowerCase() || '';
  
  if (errorMessage.includes('failed to fetch') || 
      errorMessage.includes('network') || 
      errorMessage.includes('connection')) {
    return 'Network error. Please check your internet connection.';
  }
  
  if (errorMessage.includes('invalid email') || errorMessage.includes('password')) {
    return error.message;
  }

  if (errorMessage.includes('user') && errorMessage.includes('exist')) {
    return 'A user with this email already exists.';
  }

  // Default error message
  return error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Check if IndexedDB is supported and available in the browser
 * @returns {boolean} Whether IndexedDB is available
 */
export const isIndexedDBAvailable = () => {
  try {
    // Check if IndexedDB exists
    if (!window.indexedDB) {
      console.error('Your browser doesn\'t support IndexedDB.');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error checking IndexedDB availability:', error);
    return false;
  }
};

/**
 * Debug method to check if a user exists in localStorage
 */
export const checkAuthState = () => {
  try {
    const authToken = localStorage.getItem('authToken');
    const currentUserId = localStorage.getItem('currentUserId');
    const subscription = localStorage.getItem('frenchmaster_subscription');
    
    console.log('Auth State:', {
      hasAuthToken: !!authToken,
      hasUserId: !!currentUserId,
      hasSubscription: !!subscription
    });
    
    return {
      isLoggedIn: !!authToken && !!currentUserId,
      token: authToken,
      userId: currentUserId,
      subscription: subscription ? JSON.parse(subscription) : null
    };
  } catch (error) {
    console.error('Error checking auth state:', error);
    return { isLoggedIn: false };
  }
};