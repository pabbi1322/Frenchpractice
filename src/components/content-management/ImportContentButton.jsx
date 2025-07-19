import React, { useState, useRef } from 'react';
import { Upload, Loader2, AlertCircle, Check } from 'lucide-react';
import FrenchDataService from '../../services/FrenchDataService';
import indexedDBService from '../../services/IndexedDBService';
import { useContent } from '../../contexts/ContentContext';
import { useToast } from '../../contexts/ToastContext';

/**
 * ImportContentButton Component
 * 
 * A component that allows users to import their content from previously
 * downloaded backup files (JSON or CSV) into IndexedDB.
 */
const ImportContentButton = () => {
  // Refs
  const fileInputRef = useRef(null);
  
  // Context
  const { loadAllContentData } = useContent();
  const { showToast } = useToast();
  
  // Component state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [importStats, setImportStats] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

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
      const importResults = {
        words: { added: 0, skipped: 0, errors: 0 },
        verbs: { added: 0, skipped: 0, errors: 0 },
        sentences: { added: 0, skipped: 0, errors: 0 },
        numbers: { added: 0, skipped: 0, errors: 0 }
      };
      
      // Process each selected file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (fileExtension === 'json') {
          // Process JSON file
          await processJsonFile(file, importResults);
        } else if (fileExtension === 'csv') {
          // Process CSV file
          await processCsvFile(file, importResults);
        } else {
          // Unsupported file type
          console.warn(`Unsupported file type: ${fileExtension}`);
          setError(`Unsupported file type: ${fileExtension}. Please select JSON or CSV files.`);
        }
      }
      
      // Calculate totals
      const totalAdded = Object.values(importResults).reduce((sum, type) => sum + type.added, 0);
      const totalSkipped = Object.values(importResults).reduce((sum, type) => sum + type.skipped, 0);
      const totalErrors = Object.values(importResults).reduce((sum, type) => sum + type.errors, 0);
      
      // Update stats
      setImportStats({
        ...importResults,
        total: {
          added: totalAdded,
          skipped: totalSkipped,
          errors: totalErrors
        }
      });
      
      // Refresh content data
      await loadAllContentData();
      
      // Show success message if anything was imported
      if (totalAdded > 0) {
        setSuccess(true);
        
        // Show toast notification
        showToast(`Successfully imported ${totalAdded} items`, 'success');
        
        // Reset success message after 5 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      } else if (totalErrors > 0) {
        const errorMsg = `Import completed with ${totalErrors} errors. No content was added.`;
        setError(errorMsg);
        showToast(errorMsg, 'error');
      } else if (totalSkipped > 0 && totalAdded === 0) {
        const warningMsg = 'All content already exists in your database. No new content was added.';
        setError(warningMsg);
        showToast(warningMsg, 'warning');
      }
    } catch (err) {
      console.error('Error importing content:', err);
      setError(err.message || 'Failed to import content');
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Process JSON file
  const processJsonFile = async (file, importResults) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = JSON.parse(e.target.result);
          
          // Check if it's our expected format (has metadata and data)
          if (content.metadata && content.data) {
            // It's our backup format
            const { data } = content;
            
            // Ensure IndexedDB is initialized
            await indexedDBService.initialize();
            
            // Process each content type
            for (const contentType in data) {
              if (data[contentType] && Array.isArray(data[contentType])) {
                const items = data[contentType];
                await importItems(contentType, items, importResults);
              }
            }
          } else if (Array.isArray(content)) {
            // It's an array of items, try to guess the type
            const contentType = guessContentType(content);
            if (contentType) {
              await importItems(contentType, content, importResults);
            } else {
              reject(new Error('Could not determine content type from JSON array'));
            }
          } else {
            reject(new Error('Invalid JSON format. Expected a backup file or array of items.'));
          }
          
          resolve();
        } catch (err) {
          console.error('Error processing JSON file:', err);
          reject(err);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  };
  
  // Process CSV file
  const processCsvFile = async (file, importResults) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target.result;
          
          // Parse CSV
          const items = parseCSV(content);
          if (items.length === 0) {
            reject(new Error('CSV file contains no valid data'));
            return;
          }
          
          // Guess content type based on columns
          const contentType = guessContentTypeFromCSV(items);
          if (!contentType) {
            reject(new Error('Could not determine content type from CSV columns'));
            return;
          }
          
          // Process items
          await importItems(contentType, items, importResults);
          
          resolve();
        } catch (err) {
          console.error('Error processing CSV file:', err);
          reject(err);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  };
  
  // Parse CSV content into array of objects
  const parseCSV = (text) => {
    const lines = text.split(/\r\n|\n/);
    if (lines.length < 2) return []; // Need at least headers + one data row
    
    // Parse headers
    const headers = lines[0].split(',').map(header => header.trim());
    
    // Process each row
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const values = parseCSVLine(lines[i]);
      if (values.length !== headers.length) {
        console.warn(`CSV line ${i+1} has ${values.length} fields but headers has ${headers.length} fields`);
        continue;
      }
      
      const obj = {};
      headers.forEach((header, index) => {
        let value = values[index];
        
        // Handle special fields
        if (header === 'french') {
          // Convert pipe-separated values back to array
          if (value.includes('|')) {
            value = value.split('|');
          } else if (value) {
            value = [value];
          } else {
            value = [];
          }
        } else if (header === 'conjugations' && value.startsWith('{')) {
          // Try to parse object from string
          try {
            value = JSON.parse(value);
          } catch (e) {
            console.warn('Failed to parse conjugations:', e);
          }
        }
        
        obj[header] = value;
      });
      
      result.push(obj);
    }
    
    return result;
  };
  
  // Parse a single CSV line handling quoted values
  const parseCSVLine = (line) => {
    const result = [];
    let inQuote = false;
    let currentValue = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (i < line.length - 1 && line[i + 1] === '"') {
          // Double quote inside quoted string = escaped quote
          currentValue += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuote = !inQuote;
        }
      } else if (char === ',' && !inQuote) {
        // End of field
        result.push(currentValue);
        currentValue = '';
      } else {
        // Add character to current value
        currentValue += char;
      }
    }
    
    // Add the last value
    result.push(currentValue);
    
    return result;
  };
  
  // Guess content type from an array of items
  const guessContentType = (items) => {
    if (items.length === 0) return null;
    
    const sample = items[0];
    
    if (sample.infinitive && sample.conjugations) {
      return 'verbs';
    } else if (sample.english && sample.french && !sample.sentence) {
      if (sample.category === 'number' || (typeof sample.english === 'string' && /^\d+$/.test(sample.english))) {
        return 'numbers';
      } else {
        return 'words';
      }
    } else if ((sample.english && sample.french && (sample.sentence || sample.french.length > 3)) ||
               (sample.english && sample.english.length > 20)) {
      return 'sentences';
    }
    
    return null;
  };
  
  // Guess content type from CSV columns
  const guessContentTypeFromCSV = (items) => {
    if (items.length === 0) return null;
    
    const sample = items[0];
    const keys = Object.keys(sample);
    
    if (keys.includes('infinitive') && keys.includes('conjugations')) {
      return 'verbs';
    } else if (keys.includes('english') && keys.includes('french') && !keys.includes('sentence')) {
      if (sample.category === 'number' || (typeof sample.english === 'string' && /^\d+$/.test(sample.english))) {
        return 'numbers';
      } else {
        return 'words';
      }
    } else if (keys.includes('english') && keys.includes('french')) {
      return 'sentences';
    }
    
    return null;
  };
  
  // Import items into database
  const importItems = async (contentType, items, importResults) => {
    // Ensure valid store name
    const storeMap = {
      'words': 'words',
      'verbs': 'verbs',
      'sentences': 'sentences',
      'numbers': 'numbers'
    };
    
    const storeName = storeMap[contentType];
    if (!storeName) {
      throw new Error(`Invalid content type: ${contentType}`);
    }
    
    // Get existing items to avoid duplicates
    let existingItems;
    switch (contentType) {
      case 'words':
        existingItems = await FrenchDataService.getAllWords();
        break;
      case 'verbs':
        existingItems = await FrenchDataService.getAllVerbs();
        break;
      case 'sentences':
        existingItems = await FrenchDataService.getAllSentences();
        break;
      case 'numbers':
        existingItems = await FrenchDataService.getAllNumbers();
        break;
      default:
        existingItems = [];
    }
    
    // Create lookup maps for existing items
    const existingEnglishMap = new Set();
    const existingFrenchMap = new Set();
    const existingIdsMap = new Set();
    
    existingItems.forEach(item => {
      // Track by ID
      if (item.id) {
        existingIdsMap.add(item.id);
      }
      
      // Track by content
      let key;
      if (contentType === 'verbs') {
        key = `${item.infinitive}|${item.english}`;
        existingEnglishMap.add(key);
      } else if (contentType === 'words' || contentType === 'numbers' || contentType === 'sentences') {
        // For words, numbers and sentences
        if (item.english) existingEnglishMap.add(item.english.toLowerCase());
        if (item.french) {
          const frenchText = Array.isArray(item.french) ? item.french[0] : item.french;
          if (frenchText) existingFrenchMap.add(frenchText.toLowerCase());
        }
      }
    });
    
    // Import each item
    for (const item of items) {
      try {
        // Skip items with existing IDs
        if (item.id && existingIdsMap.has(item.id)) {
          importResults[contentType].skipped++;
          continue;
        }
        
        // Check for duplicate content
        let isDuplicate = false;
        
        if (contentType === 'verbs') {
          const key = `${item.infinitive}|${item.english}`;
          isDuplicate = existingEnglishMap.has(key);
        } else if (contentType === 'words' || contentType === 'numbers' || contentType === 'sentences') {
          // Check if English or French text already exists
          if (item.english) {
            isDuplicate = existingEnglishMap.has(item.english.toLowerCase());
          }
          
          if (!isDuplicate && item.french) {
            const frenchText = Array.isArray(item.french) ? item.french[0] : item.french;
            if (frenchText) isDuplicate = existingFrenchMap.has(frenchText.toLowerCase());
          }
        }
        
        if (isDuplicate) {
          importResults[contentType].skipped++;
          continue;
        }
        
        // Prepare item for import
        const newItem = { ...item };
        
        // Make sure we have a valid french field
        if (contentType !== 'verbs' && !Array.isArray(newItem.french)) {
          if (typeof newItem.french === 'string') {
            newItem.french = [newItem.french];
          } else if (!newItem.french) {
            newItem.french = [];
          }
        }
        
        // Add it to database
        let result;
        switch (contentType) {
          case 'words':
            result = await FrenchDataService.addUserWord(newItem);
            break;
          case 'verbs':
            result = await FrenchDataService.addUserVerb(newItem);
            break;
          case 'sentences':
            result = await FrenchDataService.addUserSentence(newItem);
            break;
          case 'numbers':
            // Add category if not present
            if (!newItem.category) newItem.category = 'number';
            result = await indexedDBService.addData(storeName, newItem);
            break;
        }
        
        if (result) {
          importResults[contentType].added++;
          // Add to maps to prevent duplicates within the import
          if (contentType === 'verbs') {
            const key = `${item.infinitive}|${item.english}`;
            existingEnglishMap.add(key);
          } else if (contentType === 'words' || contentType === 'numbers' || contentType === 'sentences') {
            if (item.english) existingEnglishMap.add(item.english.toLowerCase());
            if (item.french) {
              const frenchText = Array.isArray(item.french) ? item.french[0] : item.french;
              if (frenchText) existingFrenchMap.add(frenchText.toLowerCase());
            }
          }
        } else {
          importResults[contentType].errors++;
        }
      } catch (err) {
        console.error(`Error importing ${contentType} item:`, err);
        importResults[contentType].errors++;
      }
    }
    
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
        <h2 className="text-lg font-semibold text-gray-100">Content Restore</h2>
        {importStats && (
          <button 
            className="text-sm text-blue-400 hover:underline"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".json,.csv"
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
      {importStats && showDetails && (
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
        Restore your custom vocabulary, verbs, sentences, and numbers from a backup file.
        Accepts JSON or CSV files exported from the Download Content feature.
      </p>
    </div>
  );
};

export default ImportContentButton;