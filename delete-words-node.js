// Node.js script to delete predefined words from IndexedDB
// This script uses indexedDB-js to access IndexedDB from Node.js environment

const fs = require('fs');
const path = require('path');

// Output file for results
const OUTPUT_FILE = path.join(__dirname, 'words-deletion-results.json');
const DB_PATH = path.join(__dirname, 'frenchMasterDB');

console.log('Starting predefined words deletion script...');

// Since Node.js doesn't have built-in IndexedDB, we'll read/write directly from the database file location
// First, let's check if we can access the database files
console.log(`Looking for IndexedDB files in ${__dirname}...`);

// Direct approach - execute a SQL query to delete predefined words
try {
  const indexedDB = require('fake-indexeddb');
  const IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');
  
  // Database configuration
  const DB_NAME = 'frenchMasterDB';
  const DB_VERSION = 1;
  const STORE_WORDS = 'words';

  // Statistics for reporting
  let stats = {
    total: 0,
    predefined: 0,
    deleted: 0,
    failed: 0,
    remaining: 0,
    userWords: 0
  };

  // Open the database
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  
  request.onupgradeneeded = function(event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(STORE_WORDS)) {
      db.createObjectStore(STORE_WORDS, { keyPath: 'id' });
    }
  };
  
  request.onerror = function(event) {
    console.error("Database error:", event.target.error);
    writeResults({ error: event.target.error.message, success: false });
  };
  
  request.onsuccess = async function(event) {
    const db = event.target.result;
    console.log("Database opened successfully");
    
    // Function to get all words
    function getAllWords() {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_WORDS], "readonly");
        const objectStore = transaction.objectStore(STORE_WORDS);
        const request = objectStore.getAll();
        
        request.onsuccess = function(event) {
          resolve(event.target.result);
        };
        
        request.onerror = function(event) {
          reject(event.target.error);
        };
      });
    }
    
    // Function to delete a word
    function deleteWord(id) {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_WORDS], "readwrite");
        const objectStore = transaction.objectStore(STORE_WORDS);
        const request = objectStore.delete(id);
        
        request.onsuccess = function() {
          resolve(true);
        };
        
        request.onerror = function(event) {
          reject(event.target.error);
        };
      });
    }
    
    // Check if a word is predefined
    function isPredefinedWord(word) {
      return (
        word.isPredefined === true || 
        (word.id && typeof word.id === 'string' && (
          word.id.startsWith('word-') ||
          word.id.startsWith('fallback-w')
        ))
      );
    }
    
    try {
      // Get all words
      const words = await getAllWords();
      stats.total = words.length;
      
      // Find predefined words
      const predefinedWords = words.filter(isPredefinedWord);
      stats.predefined = predefinedWords.length;
      
      console.log(`Found ${predefinedWords.length} predefined words out of ${words.length} total words`);
      
      // Delete each predefined word
      for (const word of predefinedWords) {
        try {
          console.log(`Deleting word ${word.id}: ${word.english}`);
          await deleteWord(word.id);
          stats.deleted++;
        } catch (error) {
          console.error(`Failed to delete word ${word.id}:`, error);
          stats.failed++;
        }
      }
      
      // Verify deletion
      const remainingWords = await getAllWords();
      const remainingPredefined = remainingWords.filter(isPredefinedWord);
      stats.remaining = remainingPredefined.length;
      stats.userWords = remainingWords.length - remainingPredefined.length;
      
      console.log('\n==== DELETION SUMMARY ====');
      console.log(`Total words in database: ${stats.total}`);
      console.log(`Predefined words identified: ${stats.predefined}`);
      console.log(`Words successfully deleted: ${stats.deleted}`);
      console.log(`Failed deletions: ${stats.failed}`);
      console.log(`Remaining predefined words: ${stats.remaining}`);
      console.log(`User words in database: ${stats.userWords}`);
      console.log('========================\n');
      
      // Save results
      writeResults({
        success: stats.remaining === 0,
        stats: stats,
        remainingPredefined: remainingPredefined.map(w => ({ id: w.id, english: w.english }))
      });
      
      // Close the database
      db.close();
      console.log("Database closed");
      
    } catch (error) {
      console.error("Error during deletion process:", error);
      writeResults({ error: error.message, success: false });
    }
  };
  
} catch (error) {
  console.error("Failed to use indexedDB:", error);
  
  // Alternative approach: Create a standalone HTML script that can be run in the browser
  console.log("Creating a standalone browser script for execution...");
  
  const htmlScript = `
<!DOCTYPE html>
<html>
<head>
  <title>Delete Predefined Words</title>
  <style>
    body { font-family: sans-serif; margin: 20px; line-height: 1.6; }
    pre { background: #f4f4f4; padding: 10px; overflow: auto; }
    .success { color: green; }
    .error { color: red; }
    .stats { font-weight: bold; }
    button { padding: 10px; margin: 10px 0; cursor: pointer; }
  </style>
</head>
<body>
  <h1>Delete Predefined Words Tool</h1>
  <p>This tool will delete all predefined words from your IndexedDB database.</p>
  
  <button id="startButton">Start Deletion Process</button>
  
  <div id="results">
    <h2>Results</h2>
    <pre id="output"></pre>
  </div>
  
  <script>
    // Stats object to track progress
    let stats = {
      total: 0,
      predefined: 0,
      deleted: 0,
      failed: 0,
      remaining: 0,
      userWords: 0
    };
    
    // IndexedDB configuration
    const DB_NAME = 'frenchMasterDB';
    const DB_VERSION = 1;
    const STORE_WORDS = 'words';
    
    function log(message) {
      const output = document.getElementById('output');
      output.textContent += message + '\\n';
      console.log(message);
    }
    
    // Open database connection
    function openDatabase() {
      return new Promise((resolve, reject) => {
        log('Opening IndexedDB database: ' + DB_NAME);
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
          log('ERROR: Failed to open database: ' + event.target.error);
          reject(event.target.error);
        };
        
        request.onsuccess = (event) => {
          log('Database opened successfully');
          resolve(event.target.result);
        };
      });
    }
    
    // Get all words from database
    function getAllWords(db) {
      return new Promise((resolve, reject) => {
        log('Getting all words from database...');
        const transaction = db.transaction([STORE_WORDS], 'readonly');
        const store = transaction.objectStore(STORE_WORDS);
        const request = store.getAll();
        
        request.onerror = (event) => {
          log('ERROR: Failed to get words: ' + event.target.error);
          reject(event.target.error);
        };
        
        request.onsuccess = (event) => {
          const words = event.target.result;
          log('Retrieved ' + words.length + ' total words');
          resolve(words);
        };
      });
    }
    
    // Check if a word is predefined
    function isPredefinedWord(word) {
      return (
        word.isPredefined === true || 
        (word.id && typeof word.id === 'string' && (
          word.id.startsWith('word-') ||
          word.id.startsWith('fallback-w')
        ))
      );
    }
    
    // Delete a word by ID
    function deleteWord(db, wordId) {
      return new Promise((resolve, reject) => {
        log('Deleting word with ID: ' + wordId);
        const transaction = db.transaction([STORE_WORDS], 'readwrite');
        const store = transaction.objectStore(STORE_WORDS);
        const request = store.delete(wordId);
        
        request.onerror = (event) => {
          log('ERROR: Failed to delete word ' + wordId + ': ' + event.target.error);
          reject(event.target.error);
        };
        
        request.onsuccess = () => {
          log('Successfully deleted word: ' + wordId);
          resolve(true);
        };
      });
    }
    
    // Main deletion function
    async function deletePredefinedWords() {
      let db;
      try {
        // Open database
        db = await openDatabase();
        
        // Get all words
        const words = await getAllWords(db);
        stats.total = words.length;
        
        // Find predefined words
        const predefinedWords = words.filter(isPredefinedWord);
        stats.predefined = predefinedWords.length;
        
        log('Found ' + predefinedWords.length + ' predefined words out of ' + words.length + ' total words');
        
        if (predefinedWords.length === 0) {
          log('No predefined words to delete!');
        } else {
          // Delete each predefined word
          for (const word of predefinedWords) {
            try {
              await deleteWord(db, word.id);
              stats.deleted++;
            } catch (error) {
              log('Failed to delete word ' + word.id + ': ' + error);
              stats.failed++;
            }
          }
          
          // Verify deletion
          const remainingWords = await getAllWords(db);
          const remainingPredefined = remainingWords.filter(isPredefinedWord);
          stats.remaining = remainingPredefined.length;
          stats.userWords = remainingWords.length - remainingPredefined.length;
          
          // Show summary
          log('\\n==== DELETION SUMMARY ====');
          log('Total words in database: ' + stats.total);
          log('Predefined words identified: ' + stats.predefined);
          log('Words successfully deleted: ' + stats.deleted);
          log('Failed deletions: ' + stats.failed);
          log('Remaining predefined words: ' + stats.remaining);
          log('User words in database: ' + stats.userWords);
          log('========================\\n');
          
          if (stats.remaining > 0) {
            log('WARNING: Some predefined words still exist!');
            remainingPredefined.forEach(word => {
              log('  ID: ' + word.id + ', English: ' + word.english);
            });
          } else {
            log('SUCCESS: All predefined words have been removed from the database!');
          }
        }
        
        // Set result class based on success/failure
        const output = document.getElementById('output');
        if (stats.remaining === 0) {
          output.className = 'success';
        } else {
          output.className = 'error';
        }
        
        // Return result
        return {
          success: stats.remaining === 0,
          stats: stats
        };
        
      } catch (error) {
        log('CRITICAL ERROR: ' + error);
        document.getElementById('output').className = 'error';
        return { 
          success: false, 
          error: error.message
        };
      } finally {
        // Close database connection
        if (db) {
          db.close();
          log('Database connection closed');
        }
      }
    }
    
    // Attach event handler to button
    document.getElementById('startButton').addEventListener('click', async function() {
      this.disabled = true;
      this.textContent = 'Deletion in progress...';
      
      try {
        const result = await deletePredefinedWords();
        
        if (result.success) {
          this.textContent = 'Deletion Successful!';
          this.style.backgroundColor = '#4CAF50';
        } else {
          this.textContent = 'Deletion Failed - See Logs';
          this.style.backgroundColor = '#f44336';
        }
      } catch (error) {
        log('Error running deletion process: ' + error);
        this.textContent = 'Error - See Console';
        this.style.backgroundColor = '#f44336';
      }
    });
  </script>
</body>
</html>
  `;
  
  // Write the HTML file
  const htmlPath = path.join(__dirname, 'delete-words-browser.html');
  fs.writeFileSync(htmlPath, htmlScript);
  console.log(`Created browser deletion tool: ${htmlPath}`);
}

// Write results to file
function writeResults(results) {
  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
    console.log(`Results written to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error(`Failed to write results to file: ${error.message}`);
  }
}