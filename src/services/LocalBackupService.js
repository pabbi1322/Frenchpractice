// LocalBackupService.js
// A service for handling local backup and restore operations
import backupService from './BackupService';

class LocalBackupService {
  /**
   * Export data to a downloadable file
   * @returns {Promise<string>} - The data URL for the downloadable file
   */
  async exportToFile() {
    try {
      console.log('LocalBackupService: Exporting data to downloadable file');
      
      // Get data from backup service
      const backupData = await backupService.exportData();
      
      // Generate downloadable file
      const dataUrl = backupService.generateDownloadableBackup(backupData);
      return dataUrl;
    } catch (error) {
      console.error('LocalBackupService: Error exporting to file', error);
      throw error;
    }
  }
  
  /**
   * Parse a backup file and import the data
   * @param {File} file - The backup file to parse and import
   * @returns {Promise<Object>} - The import results
   */
  async importFromFile(file) {
    try {
      console.log('LocalBackupService: Importing data from file');
      
      // Parse the backup file
      const backupData = await backupService.parseBackupFile(file);
      
      // Import data
      const importResult = await backupService.importData(backupData);
      return importResult;
    } catch (error) {
      console.error('LocalBackupService: Error importing from file', error);
      throw error;
    }
  }
  
  /**
   * Save the latest backup to localStorage
   * @param {Object} backupData - The data to backup
   * @returns {Promise<boolean>} - Whether the backup was successful
   */
  async saveToLocalStorage(backupData) {
    try {
      console.log('LocalBackupService: Saving backup to localStorage');
      
      // Create backup object with metadata
      const backup = {
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0',
          description: 'Auto-saved French Learning App Backup'
        },
        data: backupData
      };
      
      // Save to localStorage
      localStorage.setItem('french-learning-backup', JSON.stringify(backup));
      return true;
    } catch (error) {
      console.error('LocalBackupService: Error saving to localStorage', error);
      return false;
    }
  }
  
  /**
   * Load the latest backup from localStorage
   * @returns {Promise<Object|null>} - The backup data, or null if not found
   */
  async loadFromLocalStorage() {
    try {
      console.log('LocalBackupService: Loading backup from localStorage');
      
      // Get from localStorage
      const backup = localStorage.getItem('french-learning-backup');
      
      if (!backup) {
        console.log('LocalBackupService: No backup found in localStorage');
        return null;
      }
      
      // Parse the backup
      const parsedBackup = JSON.parse(backup);
      
      // Extract the actual data
      const backupData = parsedBackup.data || parsedBackup;
      
      return backupData;
    } catch (error) {
      console.error('LocalBackupService: Error loading from localStorage', error);
      return null;
    }
  }
}

// Create and export a singleton instance
const localBackupService = new LocalBackupService();
export default localBackupService;