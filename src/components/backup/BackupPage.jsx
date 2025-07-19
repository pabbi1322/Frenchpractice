// BackupPage.jsx
import React, { useState, useEffect } from 'react';
import { useGoogleDrive } from '../../contexts/GoogleDriveContext';
import { useContent } from '../../contexts/ContentContext';
import { useAuth } from '../../contexts/AuthContext';
import backupService from '../../services/BackupService';
import indexedDBService from '../../services/IndexedDBService';
import CredentialsStatus from './CredentialsStatus';

// Icons
import { CloudUpload, CloudDownload, RefreshCcw, Trash2, CheckCircle, AlertCircle, LogOut } from 'lucide-react';

const BackupPage = () => {
  const { user } = useAuth();
  const { words, sentences, verbs, numbers, loadAllContentData } = useContent();
  const { 
    initialized, 
    authenticated, 
    loading: driveLoading, 
    backups,
    operationInProgress,
    signIn,
    signOut,
    createBackup,
    downloadBackup,
    deleteBackup,
    refreshBackups
  } = useGoogleDrive();
  
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [localBackupUrl, setLocalBackupUrl] = useState(null);
  const [operation, setOperation] = useState({ type: null, status: null, message: '' });
  const [localFile, setLocalFile] = useState(null);
  const [backupStats, setBackupStats] = useState(null);
  const [loadingDb, setLoadingDb] = useState(false);

  // Get IndexedDB status on component load
  useEffect(() => {
    const checkDbStatus = async () => {
      try {
        setLoadingDb(true);
        const status = await indexedDBService.getStatus();
        setLoadingDb(false);
        
        // Update backup stats if database is connected
        if (status.connected) {
          const stats = {
            words: words.length,
            verbs: verbs.length,
            sentences: sentences.length,
            numbers: numbers.length,
            total: words.length + verbs.length + sentences.length + numbers.length
          };
          setBackupStats(stats);
        }
      } catch (error) {
        console.error('Error checking IndexedDB status:', error);
        setLoadingDb(false);
      }
    };
    
    checkDbStatus();
  }, [words, verbs, sentences, numbers]);

  // Handle backup operation
  const handleBackup = async () => {
    if (!authenticated) {
      const result = await signIn();
      if (!result.success) {
        setOperation({
          type: 'backup',
          status: 'error',
          message: 'Failed to authenticate with Google Drive.'
        });
        return;
      }
    }
    
    setOperation({
      type: 'backup',
      status: 'loading',
      message: 'Creating backup...'
    });
    
    try {
      // Export data from IndexedDB
      const backupData = await backupService.exportData();
      
      // Create a backup in Google Drive
      const result = await createBackup(backupData);
      
      if (result.success) {
        setOperation({
          type: 'backup',
          status: 'success',
          message: 'Backup created successfully!'
        });
      } else {
        setOperation({
          type: 'backup',
          status: 'error',
          message: result.error || 'Failed to create backup.'
        });
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      setOperation({
        type: 'backup',
        status: 'error',
        message: error.message || 'Failed to create backup.'
      });
    }
  };

  // Handle restore operation
  const handleRestore = async () => {
    if (!selectedBackup) {
      setOperation({
        type: 'restore',
        status: 'error',
        message: 'Please select a backup to restore.'
      });
      return;
    }
    
    setOperation({
      type: 'restore',
      status: 'loading',
      message: 'Restoring from backup...'
    });
    
    try {
      // Download the backup from Google Drive
      const result = await downloadBackup(selectedBackup.id);
      
      if (result.success) {
        // Import data to IndexedDB
        const importResult = await backupService.importData(result.backup);
        
        if (importResult.success) {
          setOperation({
            type: 'restore',
            status: 'success',
            message: 'Data restored successfully!'
          });
          
          // Refresh backup stats
          const stats = {
            words: importResult.stats.importedWords,
            verbs: importResult.stats.importedVerbs,
            sentences: importResult.stats.importedSentences,
            numbers: importResult.stats.importedNumbers,
            total: 
              importResult.stats.importedWords + 
              importResult.stats.importedVerbs + 
              importResult.stats.importedSentences +
              importResult.stats.importedNumbers
          };
          setBackupStats(stats);
          
          // Reload all content to reflect the restored data
          await loadAllContentData();
        } else {
          setOperation({
            type: 'restore',
            status: 'error',
            message: 'Failed to import data from backup.'
          });
        }
      } else {
        setOperation({
          type: 'restore',
          status: 'error',
          message: result.error || 'Failed to download backup.'
        });
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      setOperation({
        type: 'restore',
        status: 'error',
        message: error.message || 'Failed to restore backup.'
      });
    }
  };

  // Handle delete backup
  const handleDeleteBackup = async () => {
    if (!selectedBackup) {
      setOperation({
        type: 'delete',
        status: 'error',
        message: 'Please select a backup to delete.'
      });
      return;
    }
    
    setOperation({
      type: 'delete',
      status: 'loading',
      message: 'Deleting backup...'
    });
    
    try {
      const result = await deleteBackup(selectedBackup.id);
      
      if (result.success) {
        setOperation({
          type: 'delete',
          status: 'success',
          message: 'Backup deleted successfully!'
        });
        setSelectedBackup(null);
      } else {
        setOperation({
          type: 'delete',
          status: 'error',
          message: 'Failed to delete backup.'
        });
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
      setOperation({
        type: 'delete',
        status: 'error',
        message: error.message || 'Failed to delete backup.'
      });
    }
  };

  // Handle refresh backups
  const handleRefreshBackups = async () => {
    setOperation({
      type: 'refresh',
      status: 'loading',
      message: 'Refreshing backup list...'
    });
    
    try {
      const result = await refreshBackups();
      
      if (result.success) {
        setOperation({
          type: 'refresh',
          status: 'success',
          message: 'Backup list refreshed!'
        });
      } else {
        setOperation({
          type: 'refresh',
          status: 'error',
          message: result.error || 'Failed to refresh backup list.'
        });
      }
    } catch (error) {
      console.error('Error refreshing backup list:', error);
      setOperation({
        type: 'refresh',
        status: 'error',
        message: error.message || 'Failed to refresh backup list.'
      });
    }
  };

  // Handle download backup as local file
  const handleDownloadBackupLocally = async () => {
    setOperation({
      type: 'localBackup',
      status: 'loading',
      message: 'Preparing backup for download...'
    });
    
    try {
      // Export data from IndexedDB
      const backupData = await backupService.exportData();
      
      // Generate downloadable file
      const dataUrl = backupService.generateDownloadableBackup(backupData);
      setLocalBackupUrl(dataUrl);
      
      setOperation({
        type: 'localBackup',
        status: 'success',
        message: 'Backup ready for download!'
      });
    } catch (error) {
      console.error('Error preparing local backup:', error);
      setOperation({
        type: 'localBackup',
        status: 'error',
        message: error.message || 'Failed to prepare backup for download.'
      });
    }
  };

  // Handle file upload
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLocalFile(file);
    }
  };

  // Handle restore from local file
  const handleRestoreFromLocal = async () => {
    if (!localFile) {
      setOperation({
        type: 'localRestore',
        status: 'error',
        message: 'Please select a backup file to restore.'
      });
      return;
    }
    
    setOperation({
      type: 'localRestore',
      status: 'loading',
      message: 'Restoring from local backup...'
    });
    
    try {
      // Parse the backup file
      const backupData = await backupService.parseBackupFile(localFile);
      
      // Import data to IndexedDB
      const importResult = await backupService.importData(backupData);
      
      if (importResult.success) {
        setOperation({
          type: 'localRestore',
          status: 'success',
          message: 'Data restored successfully from local backup!'
        });
        
        // Reset local file selection
        setLocalFile(null);
        document.getElementById('backupFileInput').value = '';
        
        // Refresh backup stats
        const stats = {
          words: importResult.stats.importedWords,
          verbs: importResult.stats.importedVerbs,
          sentences: importResult.stats.importedSentences,
          numbers: importResult.stats.importedNumbers,
          total: 
            importResult.stats.importedWords + 
            importResult.stats.importedVerbs + 
            importResult.stats.importedSentences +
            importResult.stats.importedNumbers
        };
        setBackupStats(stats);
        
        // Reload all content to reflect the restored data
        await loadAllContentData();
      } else {
        setOperation({
          type: 'localRestore',
          status: 'error',
          message: 'Failed to import data from local backup.'
        });
      }
    } catch (error) {
      console.error('Error restoring from local backup:', error);
      setOperation({
        type: 'localRestore',
        status: 'error',
        message: error.message || 'Failed to restore from local backup.'
      });
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format file size for display
  const formatFileSize = (size) => {
    if (!size) return 'Unknown size';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Backup & Restore</h1>
      
      {/* Database Status */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Current Content</h2>
        {loadingDb ? (
          <p>Loading database status...</p>
        ) : backupStats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-md shadow-sm">
              <span className="text-gray-600 text-sm">Words</span>
              <p className="text-2xl font-semibold">{backupStats.words}</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm">
              <span className="text-gray-600 text-sm">Verbs</span>
              <p className="text-2xl font-semibold">{backupStats.verbs}</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm">
              <span className="text-gray-600 text-sm">Sentences</span>
              <p className="text-2xl font-semibold">{backupStats.sentences}</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm">
              <span className="text-gray-600 text-sm">Numbers</span>
              <p className="text-2xl font-semibold">{backupStats.numbers}</p>
            </div>
          </div>
        ) : (
          <p className="text-red-500">Failed to load database status.</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Drive Backup Section */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Google Drive Backup</h2>
          
          {/* Always show credentials status */}
          <CredentialsStatus />
          
          {!initialized ? (
            <div className="text-center p-4 border border-yellow-400 rounded-md bg-yellow-50">
              <p className="text-yellow-600 mb-2 font-semibold">Google Drive API not initialized</p>
              <p className="text-sm text-gray-600 mb-2">Credentials are loaded but API initialization failed.</p>
              <p className="text-sm text-gray-600 mb-2">
                This is likely because your current origin isn't authorized in Google Cloud Console.
                <br />
                Please note that localhost:3000 is authorized but you may be using a different port.
              </p>
              <p className="text-sm text-gray-500 mt-2 italic">You can still use local backup options below</p>
            </div>
          ) : driveLoading ? (
            <div className="text-center p-4">
              <p>Loading Google Drive integration...</p>
            </div>
          ) : (
            <>
              {/* Authentication Status */}
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    Google Drive: {authenticated ? 'Connected' : 'Not connected'}
                  </span>
                  {authenticated ? (
                    <button
                      onClick={signOut}
                      disabled={operationInProgress}
                      className="text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md px-3 py-1 flex items-center"
                    >
                      <LogOut size={14} className="mr-1" /> Sign Out
                    </button>
                  ) : (
                    <button
                      onClick={signIn}
                      disabled={operationInProgress}
                      className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md px-3 py-1"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </div>
              
              {authenticated && (
                <>
                  {/* Backup Actions */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    <button
                      onClick={handleBackup}
                      disabled={operationInProgress || !authenticated}
                      className="flex items-center bg-green-600 hover:bg-green-700 text-white font-medium rounded-md px-4 py-2 disabled:bg-gray-300"
                    >
                      <CloudUpload size={18} className="mr-2" /> Backup to Drive
                    </button>
                    
                    <button
                      onClick={handleRefreshBackups}
                      disabled={operationInProgress || !authenticated}
                      className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md px-4 py-2 disabled:bg-gray-100"
                    >
                      <RefreshCcw size={18} className="mr-2" /> Refresh
                    </button>
                  </div>
                  
                  {/* Backup List */}
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Backup History</h3>
                    
                    {backups.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto border rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Backup Name</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {backups.map(backup => (
                              <tr 
                                key={backup.id} 
                                onClick={() => setSelectedBackup(backup)}
                                className={`cursor-pointer hover:bg-blue-50 ${selectedBackup?.id === backup.id ? 'bg-blue-100' : ''}`}
                              >
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{backup.name}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{formatDate(backup.createdTime)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{formatFileSize(backup.size)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No backups found.</p>
                    )}
                  </div>
                  
                  {/* Backup Actions */}
                  {selectedBackup && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleRestore}
                        disabled={operationInProgress || !selectedBackup}
                        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md px-4 py-2 disabled:bg-gray-300"
                      >
                        <CloudDownload size={18} className="mr-2" /> Restore from Selected
                      </button>
                      
                      <button
                        onClick={handleDeleteBackup}
                        disabled={operationInProgress || !selectedBackup}
                        className="flex items-center bg-red-600 hover:bg-red-700 text-white font-medium rounded-md px-4 py-2 disabled:bg-gray-300"
                      >
                        <Trash2 size={18} className="mr-2" /> Delete Backup
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
        
        {/* Local Backup Section */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Local Backup</h2>
          
          {/* Download Backup */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Download Backup</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownloadBackupLocally}
                disabled={operationInProgress}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white font-medium rounded-md px-4 py-2 disabled:bg-gray-300"
              >
                <CloudUpload size={18} className="mr-2" /> Prepare Backup File
              </button>
              
              {localBackupUrl && (
                <a
                  href={localBackupUrl}
                  download={`french-learning-backup-${new Date().toISOString().slice(0, 10)}.json`}
                  className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md px-4 py-2"
                >
                  <CloudDownload size={18} className="mr-2" /> Download File
                </a>
              )}
            </div>
          </div>
          
          {/* Upload and Restore Backup */}
          <div>
            <h3 className="font-semibold mb-3">Restore from Local File</h3>
            <div className="mb-4">
              <input
                type="file"
                id="backupFileInput"
                accept=".json"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            
            <button
              onClick={handleRestoreFromLocal}
              disabled={operationInProgress || !localFile}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md px-4 py-2 disabled:bg-gray-300"
            >
              <CloudDownload size={18} className="mr-2" /> Restore from File
            </button>
          </div>
        </div>
      </div>
      
      {/* Operation Status */}
      {operation.status && (
        <div className={`mt-6 p-4 rounded-md ${
          operation.status === 'success' ? 'bg-green-100 text-green-700' :
          operation.status === 'error' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          <div className="flex items-start">
            {operation.status === 'success' && <CheckCircle size={20} className="mr-2 flex-shrink-0" />}
            {operation.status === 'error' && <AlertCircle size={20} className="mr-2 flex-shrink-0" />}
            <div>
              <p className="font-medium">{operation.message}</p>
              {operation.status === 'loading' && (
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupPage;