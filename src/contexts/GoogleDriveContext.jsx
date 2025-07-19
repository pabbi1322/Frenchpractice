// GoogleDriveContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import googleDriveService from '../services/GoogleDriveService';
import { useAuth } from './AuthContext';

// Import credentials from JSON file
import { getGoogleDriveCredentials } from '../credentials/credentials-utils';
const { clientId: GOOGLE_CLIENT_ID, apiKey: GOOGLE_API_KEY } = getGoogleDriveCredentials();

// Create context
const GoogleDriveContext = createContext();

// Custom hook to use the GoogleDrive context
export const useGoogleDrive = () => {
  const context = useContext(GoogleDriveContext);
  if (!context) {
    throw new Error('useGoogleDrive must be used within a GoogleDriveProvider');
  }
  return context;
};

// Provider component
export const GoogleDriveProvider = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState([]);
  const [operationInProgress, setOperationInProgress] = useState(false);
  const { user } = useAuth();

  // Initialize Google Drive API
  useEffect(() => {
    const initGoogleDrive = async () => {
      try {
        setLoading(true);
        const success = await googleDriveService.initialize(GOOGLE_API_KEY, GOOGLE_CLIENT_ID);
        setInitialized(success);
        setAuthenticated(googleDriveService.isAuthenticated);
        
        if (success && googleDriveService.isAuthenticated) {
          try {
            const backupsList = await googleDriveService.listBackups();
            setBackups(backupsList);
          } catch (error) {
            console.error('Error listing backups:', error);
          }
        }
      } catch (error) {
        console.error('Error initializing Google Drive:', error);
        setAuthError('Failed to initialize Google Drive API.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      initGoogleDrive();
    }

    return () => {
      // Cleanup if needed
    };
  }, [user]);

  // Sign in to Google Drive
  const signIn = async () => {
    setAuthError(null);
    setOperationInProgress(true);
    
    try {
      const success = await googleDriveService.signIn();
      setAuthenticated(success);
      
      if (success) {
        const backupsList = await googleDriveService.listBackups();
        setBackups(backupsList);
        return { success: true };
      } else {
        setAuthError('Failed to sign in to Google Drive.');
        return { success: false, error: 'Failed to sign in to Google Drive.' };
      }
    } catch (error) {
      console.error('Error signing in to Google Drive:', error);
      setAuthError(`Failed to sign in: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setOperationInProgress(false);
    }
  };

  // Sign out from Google Drive
  const signOut = async () => {
    setOperationInProgress(true);
    
    try {
      const success = await googleDriveService.signOut();
      setAuthenticated(!success);
      return { success };
    } catch (error) {
      console.error('Error signing out from Google Drive:', error);
      return { success: false, error: error.message };
    } finally {
      setOperationInProgress(false);
    }
  };

  // Create a backup
  const createBackup = async (data) => {
    setOperationInProgress(true);
    
    try {
      const backup = await googleDriveService.createBackup(data);
      
      // Refresh backup list
      const backupsList = await googleDriveService.listBackups();
      setBackups(backupsList);
      
      return { success: true, backup };
    } catch (error) {
      console.error('Error creating backup:', error);
      return { success: false, error: error.message };
    } finally {
      setOperationInProgress(false);
    }
  };

  // Download a backup
  const downloadBackup = async (fileId) => {
    setOperationInProgress(true);
    
    try {
      const backup = await googleDriveService.downloadBackup(fileId);
      return { success: true, backup };
    } catch (error) {
      console.error('Error downloading backup:', error);
      return { success: false, error: error.message };
    } finally {
      setOperationInProgress(false);
    }
  };

  // Delete a backup
  const deleteBackup = async (fileId) => {
    setOperationInProgress(true);
    
    try {
      const success = await googleDriveService.deleteBackup(fileId);
      
      if (success) {
        // Refresh backup list
        const backupsList = await googleDriveService.listBackups();
        setBackups(backupsList);
      }
      
      return { success };
    } catch (error) {
      console.error('Error deleting backup:', error);
      return { success: false, error: error.message };
    } finally {
      setOperationInProgress(false);
    }
  };

  // Refresh backup list
  const refreshBackups = async () => {
    setOperationInProgress(true);
    
    try {
      const backupsList = await googleDriveService.listBackups();
      setBackups(backupsList);
      return { success: true, backups: backupsList };
    } catch (error) {
      console.error('Error refreshing backups:', error);
      return { success: false, error: error.message };
    } finally {
      setOperationInProgress(false);
    }
  };

  const contextValue = {
    initialized,
    authenticated,
    loading,
    authError,
    backups,
    operationInProgress,
    signIn,
    signOut,
    createBackup,
    downloadBackup,
    deleteBackup,
    refreshBackups
  };

  return (
    <GoogleDriveContext.Provider value={contextValue}>
      {children}
    </GoogleDriveContext.Provider>
  );
};

GoogleDriveProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default GoogleDriveContext;