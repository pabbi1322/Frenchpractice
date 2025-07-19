import React, { useState, useRef } from 'react';
import { Upload, Loader2, AlertCircle, Check } from 'lucide-react';
import indexedDBService from '../../services/IndexedDBService';
import FrenchDataService from '../../services/FrenchDataService';
import { useToast } from '../../contexts/ToastContext';

/**
 * ContentImportFix Component
 * 
 * An improved version of content import functionality that properly handles
 * the backup format created by ContentExportFix.
 */
const ContentImportFix = () => {
  // Refs
  const fileInputRef = useRef(null);
  
  // Context
  const { showToast } = useToast();
  
  // Component state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [importStats, setImportStats] = useState(null);

  // Handle file selection
  const handleFileChange = async (event) => {
    const files = event.target.files;
    
    if (!files || files.length === 0) {
      return;
    }
    
    setLoading(true);
    setSuccess(false);
    setError(null);
    setImportStats(null);
    
    try {
      // Initialize IndexedDB
      await indexedDBService.initialize();
      
      // Process the first file only (for simplicity)
      const file = files[0];
      console.log(`Processing file: ${file.name}`);
      
      // Read the file content
      const fileContent = await readFileAsText(file);
      let jsonData;
      
      try {
        jsonData = JSON.parse(fileContent);
      } catch (err) {
        throw new Error('Invalid JSON format. Please select a valid backup file.');
      }
      
      // Check if it's our expected format
      if (jsonData.metadata && jsonData.data) {
        // It's our standard backup format
        console.log('Found standard backup format with metadata and data');
        const { data } = jsonData;
        const importResults = await importContentFromBackup(data);
        setImportStats(importResults);
        
        if (importResults.total.added > 0) {
          setSuccess(true);
          showToast(`Successfully imported ${importResults.total.added} items`, 'success');
        } else if (importResults.total.errors > 0) {
          setError(`Import completed with ${importResults.total.errors} errors.`);
          showToast(error, 'error');
        } else {
          setError('No new content was added.');
          showToast('No new content was added.', 'warning');
        }
      } else if (jsonData.web && jsonData.web.client_id) {
        // This is a Google API credentials file
        setError('This appears to be a Google API credentials file, not a content backup. Please select a valid backup file.');
        showToast('Invalid file type: Google API credentials', 'error');
      } else if (Array.isArray(jsonData)) {
        // Try to guess the content type
        setError('Please use the standard backup format. Direct arrays are not supported in this fixed importer.');
        showToast('Unsupported format. Please use the fixed export feature.', 'error');
      } else {
        // Unknown format
        setError('Unrecognized file format. Please select a valid backup file created by the "Create Complete Backup" button.');
        showToast('Unrecognized file format', 'error');
      }
      
      // Refresh data after import
      await FrenchDataService.forceRefresh();
      
    } catch (err) {
      console.error('Error importing content:', err);
      setError(err.message || 'Failed to import content');
      showToast(err.message || 'Failed to import content', 'error');
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Helper function to read file as text
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Import content from backup data
  const importContentFromBackup = async (data) => {
    const importResults = {
      words: { added: 0, skipped: 0, errors: 0 },
      verbs: { added: 0, skipped: 0, errors: 0 },
      sentences: { added: 0, skipped: 0, errors: 0 },
      numbers: { added: 0, skipped: 0, errors: 0 },
      total: { added: 0, skipped: 0, errors: 0 }
    };
    
    // Process each content type
    const contentTypes = ['words', 'verbs', 'sentences', 'numbers'];
    const storeMap = {
      words: 'words',
      verbs: 'verbs',
      sentences: 'sentences',
      numbers: 'numbers'
    };
    
    for (const contentType of contentTypes) {
      if (!Array.isArray(data[contentType])) {
        console.log(`No ${contentType} found in backup`);
        continue;
      }
      
      const items = data[contentType];
      console.log(`Processing ${items.length} ${contentType}...`);
      
      const storeName = storeMap[contentType];
      
      // Get existing items to check for duplicates
      const existingItems = await indexedDBService.getAllData(storeName);
      const existingIds = new Set(existingItems.map(item => item.id));
      
      // Process each item
      for (const item of items) {
        try {
          // Skip if item has no ID or we already have this ID
          if (!item.id) {
            importResults[contentType].skipped++;
            continue;
          }
          
          if (existingIds.has(item.id)) {
            importResults[contentType].skipped++;
            continue;
          }
          
          // Validate the item based on content type
          let isValid = true;
          switch (contentType) {
            case 'words':
              isValid = item.english && (Array.isArray(item.french) || typeof item.french === 'string');
              break;
            case 'verbs':
              isValid = item.infinitive && item.conjugations;
              break;
            case 'sentences':
              isValid = item.english && (Array.isArray(item.french) || typeof item.french === 'string');
              break;
            case 'numbers':
              isValid = item.english && (Array.isArray(item.french) || typeof item.french === 'string');
              break;
          }
          
          if (!isValid) {
            console.log(`Invalid ${contentType} item:`, item);
            importResults[contentType].errors++;
            continue;
          }
          
          // Ensure french field is an array
          if (contentType !== 'verbs' && typeof item.french === 'string') {
            item.french = [item.french];
          }
          
          // Add to database
          await indexedDBService.addData(storeName, item);
          importResults[contentType].added++;
          existingIds.add(item.id); // Prevent duplicates within the import
          
        } catch (err) {
          console.error(`Error importing ${contentType} item:`, err);
          importResults[contentType].errors++;
        }
      }
    }
    
    // Calculate totals
    importResults.total.added = Object.values(importResults)
      .filter(r => typeof r === 'object' && r !== null && 'added' in r)
      .reduce((sum, type) => sum + type.added, 0);
      
    importResults.total.skipped = Object.values(importResults)
      .filter(r => typeof r === 'object' && r !== null && 'skipped' in r)
      .reduce((sum, type) => sum + type.skipped, 0);
      
    importResults.total.errors = Object.values(importResults)
      .filter(r => typeof r === 'object' && r !== null && 'errors' in r)
      .reduce((sum, type) => sum + type.errors, 0);
    
    return importResults;
  };
  
  // Handle button click
  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-100">Restore Content (Fixed)</h2>
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
      
      {/* Error message */}
      {error && (
        <div className="bg-red-900 text-red-100 p-3 rounded mb-3 text-sm">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 mt-1 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {/* Import stats */}
      {importStats && (
        <div className="bg-gray-800 p-4 rounded-md mb-4 text-sm">
          <h3 className="text-gray-300 font-semibold mb-2">Import Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
            {Object.entries(importStats).map(([type, stats]) => {
              if (type === 'total') return null;
              return (
                <div key={type} className="p-2 bg-gray-700 rounded">
                  <div className="font-semibold text-gray-300 capitalize mb-1">{type}</div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="block text-green-400">{stats.added}</span>
                      <span className="text-gray-400">Added</span>
                    </div>
                    <div>
                      <span className="block text-yellow-400">{stats.skipped}</span>
                      <span className="text-gray-400">Skipped</span>
                    </div>
                    <div>
                      <span className="block text-red-400">{stats.errors}</span>
                      <span className="text-gray-400">Errors</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-3 bg-gray-700 rounded">
            <div className="font-semibold text-gray-300 mb-1">Total</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="block text-green-400 font-bold">{importStats.total.added}</span>
                <span className="text-gray-400">Added</span>
              </div>
              <div>
                <span className="block text-yellow-400 font-bold">{importStats.total.skipped}</span>
                <span className="text-gray-400">Skipped</span>
              </div>
              <div>
                <span className="block text-red-400 font-bold">{importStats.total.errors}</span>
                <span className="text-gray-400">Errors</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Import Button */}
      <button
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-white ${
          loading ? 'bg-purple-700 cursor-not-allowed' : 
          success ? 'bg-green-600 hover:bg-green-700' : 
          'bg-purple-600 hover:bg-purple-700'
        }`}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : success ? (
          <Check className="h-4 w-4" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        <span>
          {loading ? 'Importing Content...' : 
           success ? 'Import Successful!' : 
           'Import Content Backup'}
        </span>
      </button>
      
      <p className="text-gray-400 text-xs mt-2">
        Import a content backup file created with the "Create Complete Backup" button.
        This fixed importer handles the complete backup format correctly.
      </p>
    </div>
  );
};

export default ContentImportFix;