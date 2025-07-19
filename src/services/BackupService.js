// BackupService.js
// A service for handling backup and restore operations
import FrenchDataService from './FrenchDataService';
import UserContentService from './UserContentService';
import indexedDBService from './IndexedDBService';

// Store names for IndexedDB
const STORE_WORDS = 'words';
const STORE_VERBS = 'verbs';
const STORE_SENTENCES = 'sentences';
const STORE_NUMBERS = 'numbers';

class BackupService {
  /**
   * Export all data from IndexedDB and localStorage
   * @param {Object} options - Export options
   * @param {Boolean} options.includePredefined - Whether to include predefined content
   * @param {Boolean} options.includeUserContent - Whether to include user content
   * @param {Array} options.contentTypes - Array of content types to export (words, verbs, sentences, numbers)
   * @returns {Promise<Object>} - The exported data
   */
  async exportData(options = {}) {
    try {
      console.log('BackupService: Exporting all data with options:', options);
      
      // Default options
      const exportOptions = {
        includePredefined: true,
        includeUserContent: true,
        contentTypes: ['words', 'verbs', 'sentences', 'numbers'],
        ...options
      };
      
      // Initialize IndexedDB if needed
      if (!indexedDBService.isInitialized) {
        console.log('BackupService: Initializing IndexedDB');
        await indexedDBService.initialize();
      }
      
      // Collect all data from all sources
      const allData = {};
      const contentCounts = {
        user: {},
        predefined: {},
        total: {}
      };

      // Process each content type
      for (const type of exportOptions.contentTypes) {
        // Get data from IndexedDB via FrenchDataService
        let indexedDBData = [];
        switch (type) {
          case STORE_WORDS:
            indexedDBData = await FrenchDataService.getAllWords();
            break;
          case STORE_VERBS:
            indexedDBData = await FrenchDataService.getAllVerbs();
            break;
          case STORE_SENTENCES:
            indexedDBData = await FrenchDataService.getAllSentences();
            break;
          case STORE_NUMBERS:
            indexedDBData = await FrenchDataService.getAllNumbers();
            break;
          default:
            indexedDBData = [];
        }
        
        // Filter based on user preferences
        let filteredData = [];
        
        if (exportOptions.includePredefined && exportOptions.includeUserContent) {
          // Include all content
          filteredData = indexedDBData;
        } else if (exportOptions.includePredefined) {
          // Only predefined content
          filteredData = indexedDBData.filter(item => item.isPredefined);
        } else if (exportOptions.includeUserContent) {
          // Only user content
          filteredData = indexedDBData.filter(item => !item.isPredefined);
        }
        
        // Get localStorage content as a fallback (for users with older data)
        let localStorageData = [];
        if (exportOptions.includeUserContent) {
          switch (type) {
            case STORE_WORDS:
              localStorageData = UserContentService.getUserWords() || [];
              break;
            case STORE_VERBS:
              localStorageData = UserContentService.getUserVerbs() || [];
              break;
            case STORE_SENTENCES:
              localStorageData = UserContentService.getUserSentences() || [];
              break;
            default:
              localStorageData = [];
          }
        }

        // Merge IndexedDB and localStorage data based on unique IDs
        // First, create a Map with ID as key
        const mergedMap = new Map();
        
        // Add items from IndexedDB
        filteredData.forEach(item => {
          if (item.id) {
            mergedMap.set(item.id, item);
          }
        });
        
        // Add items from localStorage if they don't already exist in IndexedDB
        if (exportOptions.includeUserContent) {
          localStorageData.forEach(item => {
            // Only add localStorage items if they're user content (no isPredefined flag or false)
            const isUserContent = !item.isPredefined;
            
            // Generate an ID if one doesn't exist
            const itemId = item.id || 
              `${type}-${item.english || item.infinitive || item.value || ''}-local`;
              
            if (isUserContent && !mergedMap.has(itemId)) {
              // Add metadata if missing
              if (!item.id) item.id = itemId;
              if (!item.createdAt) item.createdAt = new Date().toISOString();
              if (!item.updatedAt) item.updatedAt = new Date().toISOString();
              if (!item.isPredefined) item.isPredefined = false;
              if (!item.createdBy) item.createdBy = 'anonymous';
              
              mergedMap.set(itemId, item);
            }
          });
        }
        
        // Convert Map back to array
        const mergedData = Array.from(mergedMap.values());
        
        // Store the data and counts
        allData[type] = mergedData;
        contentCounts.user[type] = mergedData.filter(item => !item.isPredefined).length;
        contentCounts.predefined[type] = mergedData.filter(item => item.isPredefined).length;
        contentCounts.total[type] = mergedData.length;
      }
      
      // Create backup object
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.1',
        data: allData,
        stats: {
          total: contentCounts.total,
          user: contentCounts.user,
          predefined: contentCounts.predefined,
          totalItems: Object.values(contentCounts.total).reduce((sum, count) => sum + count, 0)
        },
        exportOptions: {
          includePredefined: exportOptions.includePredefined,
          includeUserContent: exportOptions.includeUserContent,
          contentTypes: exportOptions.contentTypes
        }
      };
      
      console.log('BackupService: Data export complete', backupData.stats);
      return backupData;
    } catch (error) {
      console.error('BackupService: Error exporting data', error);
      throw error;
    }
  }
  
  /**
   * Import data to IndexedDB
   * @param {Object} backupData - The backup data to import
   * @param {Object} options - Import options
   * @param {Boolean} options.clearExisting - Whether to clear existing data before import
   * @param {Boolean} options.skipPredefined - Whether to skip importing predefined content
   * @returns {Promise<Object>} - The import results
   */
  async importData(backupData, options = {}) {
    try {
      console.log('BackupService: Importing data to IndexedDB with options:', options);
      
      // Default options
      const importOptions = {
        clearExisting: true,
        skipPredefined: false,
        ...options
      };
      
      // Validate backup data
      if (!backupData || !backupData.data) {
        throw new Error('Invalid backup data: Missing data property');
      }
      
      // Check version compatibility
      const version = backupData.version || '1.0';
      console.log(`BackupService: Backup file version: ${version}`);
      
      // Initialize IndexedDB if needed
      if (!indexedDBService.isInitialized) {
        console.log('BackupService: Initializing IndexedDB');
        await indexedDBService.initialize();
      }
      
      // Extract data from the backup
      const dataToImport = backupData.data;
      
      // Import stats for tracking
      const importStats = {
        totalImported: 0,
        importedWords: 0,
        importedVerbs: 0,
        importedSentences: 0,
        importedNumbers: 0,
        skippedPredefined: 0
      };
      
      // Process words
      if (dataToImport.words && Array.isArray(dataToImport.words)) {
        console.log(`BackupService: Importing ${dataToImport.words.length} words`);
        
        // Filter out predefined content if skipPredefined is true
        let wordsToImport = dataToImport.words;
        if (importOptions.skipPredefined) {
          const predefinedCount = wordsToImport.filter(item => item.isPredefined).length;
          wordsToImport = wordsToImport.filter(item => !item.isPredefined);
          importStats.skippedPredefined += predefinedCount;
        }
        
        if (wordsToImport.length > 0) {
          // Clear existing data if specified
          if (importOptions.clearExisting) {
            await indexedDBService.clearStore(STORE_WORDS);
          }
          
          // Import the data
          await indexedDBService.bulkAddData(STORE_WORDS, wordsToImport);
          importStats.importedWords = wordsToImport.length;
          importStats.totalImported += wordsToImport.length;
        }
      }
      
      // Process verbs
      if (dataToImport.verbs && Array.isArray(dataToImport.verbs)) {
        console.log(`BackupService: Importing ${dataToImport.verbs.length} verbs`);
        
        // Filter out predefined content if skipPredefined is true
        let verbsToImport = dataToImport.verbs;
        if (importOptions.skipPredefined) {
          const predefinedCount = verbsToImport.filter(item => item.isPredefined).length;
          verbsToImport = verbsToImport.filter(item => !item.isPredefined);
          importStats.skippedPredefined += predefinedCount;
        }
        
        if (verbsToImport.length > 0) {
          // Clear existing data if specified
          if (importOptions.clearExisting) {
            await indexedDBService.clearStore(STORE_VERBS);
          }
          
          // Import the data
          await indexedDBService.bulkAddData(STORE_VERBS, verbsToImport);
          importStats.importedVerbs = verbsToImport.length;
          importStats.totalImported += verbsToImport.length;
        }
      }
      
      // Process sentences
      if (dataToImport.sentences && Array.isArray(dataToImport.sentences)) {
        console.log(`BackupService: Importing ${dataToImport.sentences.length} sentences`);
        
        // Filter out predefined content if skipPredefined is true
        let sentencesToImport = dataToImport.sentences;
        if (importOptions.skipPredefined) {
          const predefinedCount = sentencesToImport.filter(item => item.isPredefined).length;
          sentencesToImport = sentencesToImport.filter(item => !item.isPredefined);
          importStats.skippedPredefined += predefinedCount;
        }
        
        if (sentencesToImport.length > 0) {
          // Clear existing data if specified
          if (importOptions.clearExisting) {
            await indexedDBService.clearStore(STORE_SENTENCES);
          }
          
          // Import the data
          await indexedDBService.bulkAddData(STORE_SENTENCES, sentencesToImport);
          importStats.importedSentences = sentencesToImport.length;
          importStats.totalImported += sentencesToImport.length;
        }
      }
      
      // Process numbers
      if (dataToImport.numbers && Array.isArray(dataToImport.numbers)) {
        console.log(`BackupService: Importing ${dataToImport.numbers.length} numbers`);
        
        // Filter out predefined content if skipPredefined is true
        let numbersToImport = dataToImport.numbers;
        if (importOptions.skipPredefined) {
          const predefinedCount = numbersToImport.filter(item => item.isPredefined).length;
          numbersToImport = numbersToImport.filter(item => !item.isPredefined);
          importStats.skippedPredefined += predefinedCount;
        }
        
        if (numbersToImport.length > 0) {
          // Clear existing data if specified
          if (importOptions.clearExisting) {
            await indexedDBService.clearStore(STORE_NUMBERS);
          }
          
          // Import the data
          await indexedDBService.bulkAddData(STORE_NUMBERS, numbersToImport);
          importStats.importedNumbers = numbersToImport.length;
          importStats.totalImported += numbersToImport.length;
        }
      }
      
      // Refresh FrenchDataService cache
      await FrenchDataService.forceRefresh();
      
      // Return success
      const results = {
        success: true,
        stats: importStats,
        backupInfo: {
          version: backupData.version,
          timestamp: backupData.timestamp
        }
      };
      
      console.log('BackupService: Data import complete', results.stats);
      return results;
    } catch (error) {
      console.error('BackupService: Error importing data', error);
      throw error;
    }
  }
  
  /**
   * Generate a downloadable backup file
   * @param {Object} backupData - The backup data
   * @returns {string} - The data URL for the backup file
   */
  generateDownloadableBackup(backupData) {
    try {
      // Create a formatted backup object with metadata
      const fullBackup = {
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.1',
          description: 'French Learning App Backup'
        },
        data: backupData
      };
      
      // Convert to JSON string
      const jsonStr = JSON.stringify(fullBackup, null, 2);
      
      // Create blob and data URL
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const dataUrl = URL.createObjectURL(blob);
      
      return dataUrl;
    } catch (error) {
      console.error('BackupService: Error generating downloadable backup', error);
      throw error;
    }
  }
  
  /**
   * Parse a backup file
   * @param {File} file - The backup file to parse
   * @returns {Promise<Object>} - The parsed backup data
   */
  parseBackupFile(file) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          try {
            const fileContent = event.target.result;
            const data = JSON.parse(fileContent);
            
            // Check if this is an OAuth credential file
            if (this._isOAuthCredentialFile(data)) {
              reject(new Error('This appears to be an OAuth credentials file, not a content backup file'));
              return;
            }
            
            // Extract actual backup data from the wrapper if present
            let backupData;
            
            // Handle different backup file structures
            if (data.data && data.metadata) {
              // Structure: { metadata: {...}, data: {...} }
              backupData = data.data;
            } else if (data.metadata && data.data && data.data.data) {
              // Structure: { metadata: {...}, data: { data: {...}, timestamp: '...', ...} }
              backupData = data.data;
            } else if (data.data) {
              // Structure: { data: {...}, timestamp: '...', ... }
              backupData = data;
            } else {
              // Assume the entire file is the backup data
              backupData = data;
            }
            
            // Basic validation - check that data contains at least one content type
            const hasContentData = backupData.data && (
              (Array.isArray(backupData.data.words) && backupData.data.words.length > 0) ||
              (Array.isArray(backupData.data.verbs) && backupData.data.verbs.length > 0) ||
              (Array.isArray(backupData.data.sentences) && backupData.data.sentences.length > 0) ||
              (Array.isArray(backupData.data.numbers) && backupData.data.numbers.length > 0)
            );
            
            if (!hasContentData) {
              reject(new Error('Invalid backup file: No content data found'));
              return;
            }
            
            resolve(backupData);
          } catch (error) {
            console.error('BackupService: Error parsing backup file', error);
            reject(new Error('Invalid backup file format: Not a valid JSON file'));
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read backup file'));
        };
        
        reader.readAsText(file);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Check if a file contains OAuth credentials
   * @private
   * @param {Object} data - The parsed JSON data
   * @returns {Boolean} - True if the file appears to be an OAuth credentials file
   */
  _isOAuthCredentialFile(data) {
    // Check for common OAuth credential file patterns
    return (
      // Check for Google OAuth client secrets file structure
      (data.web && (data.web.client_id || data.web.client_secret)) ||
      (data.installed && (data.installed.client_id || data.installed.client_secret)) ||
      
      // Check for OAuth access token response structure
      (data.access_token && data.token_type) ||
      
      // Check for specific fields that indicate OAuth credentials
      (data.client_id && data.client_secret) ||
      (data.client_id && data.auth_uri && data.token_uri) ||
      
      // Check for project_id which is common in Google service account files
      (data.project_id && data.auth_uri && data.token_uri)
    );
  }
  
  /**
   * Check if a file is valid for importing
   * @param {File} file - The file to check
   * @returns {Promise<{isValid: Boolean, error: String|null}>} Validation result
   */
  async validateBackupFile(file) {
    try {
      // Check file type
      if (!file.name.endsWith('.json')) {
        return { 
          isValid: false, 
          error: 'File must be a JSON file (.json extension)' 
        };
      }
      
      // Read and parse the file content
      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });
      
      // Try to parse the JSON
      let data;
      try {
        data = JSON.parse(fileContent);
      } catch (e) {
        return { 
          isValid: false, 
          error: 'Invalid JSON format: The file is not properly formatted JSON' 
        };
      }
      
      // Check if it's an OAuth credential file
      if (this._isOAuthCredentialFile(data)) {
        return { 
          isValid: false, 
          error: 'This appears to be an OAuth credentials file, not a content backup file' 
        };
      }
      
      // Check if this is a backup file with content data
      let backupData = data;
      
      // Handle different backup file structures
      if (data.data && data.metadata) {
        // Structure: { metadata: {...}, data: {...} }
        backupData = data.data;
      } else if (data.metadata && data.data && data.data.data) {
        // Structure: { metadata: {...}, data: { data: {...}, timestamp: '...', ...} }
        backupData = data.data;
      }
      
      // Check for content data structure
      const hasDataProperty = backupData.data !== undefined;
      if (!hasDataProperty) {
        return { 
          isValid: false, 
          error: 'Invalid backup file: Missing required data property' 
        };
      }
      
      // Check that at least one content type exists and is an array
      const contentData = backupData.data;
      const hasValidContentType = 
        (Array.isArray(contentData.words)) || 
        (Array.isArray(contentData.verbs)) || 
        (Array.isArray(contentData.sentences)) || 
        (Array.isArray(contentData.numbers));
        
      if (!hasValidContentType) {
        return { 
          isValid: false, 
          error: 'Invalid backup file: No valid content data found (words, verbs, sentences, or numbers)' 
        };
      }
      
      // If we have content, check that at least one array has data
      const hasContent = 
        (contentData.words && contentData.words.length > 0) || 
        (contentData.verbs && contentData.verbs.length > 0) || 
        (contentData.sentences && contentData.sentences.length > 0) || 
        (contentData.numbers && contentData.numbers.length > 0);
        
      if (!hasContent) {
        return { 
          isValid: false, 
          error: 'Backup file contains no content data (empty arrays)' 
        };
      }
      
      // Generate a summary of the content in the backup file
      const contentSummary = {
        words: contentData.words?.length || 0,
        verbs: contentData.verbs?.length || 0,
        sentences: contentData.sentences?.length || 0,
        numbers: contentData.numbers?.length || 0,
        total: (contentData.words?.length || 0) + 
               (contentData.verbs?.length || 0) + 
               (contentData.sentences?.length || 0) + 
               (contentData.numbers?.length || 0)
      };
      
      // Extract metadata if available
      const metadata = {
        version: backupData.version || '1.0',
        timestamp: backupData.timestamp || 'unknown',
        exportDate: backupData.exportDate || 'unknown'
      };
      
      // File is valid
      return { 
        isValid: true, 
        error: null,
        summary: contentSummary,
        metadata
      };
    } catch (error) {
      console.error('Error validating backup file:', error);
      return { 
        isValid: false, 
        error: `Error validating file: ${error.message}` 
      };
    }
  }
}

// Create and export a singleton instance
const backupService = new BackupService();
export default backupService;