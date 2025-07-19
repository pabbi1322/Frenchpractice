#!/usr/bin/env node

/**
 * cleanup-predefined-words.js
 * 
 * A robust script to permanently delete all predefined words from the French Master app database
 * This script uses direct access to the IndexedDB database
 */

console.log('French Master Database Cleanup Script');
console.log('-------------------------------------');
console.log('This script will permanently delete all predefined words from your database.');

// Load dependencies
const fs = require('fs');
const path = require('path');
const http = require('http');
const { exec } = require('child_process');

// Create a simple HTTP server to serve the cleanup page
const PORT = 3456;
let serverProcess;

// Function to open the default browser
function openBrowser(url) {
  const command = process.platform === 'win32' ? 'start' :
    process.platform === 'darwin' ? 'open' : 'xdg-open';
    
  exec(`${command} ${url}`, (error) => {
    if (error) {
      console.error(`Failed to open browser: ${error}`);
      console.log(`Please open this URL manually: ${url}`);
    }
  });
}

// Cleanup HTML content - a self-contained tool to delete predefined words
const cleanupHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>French Master Database Cleanup</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.5; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
    h1, h2, h3 { color: #2563eb; }
    pre { background: #f1f5f9; padding: 15px; border-radius: 6px; overflow: auto; }
    button { background-color: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-right: 8px; margin-bottom: 8px; }
    button:hover { background-color: #1d4ed8; }
    button:disabled { background-color: #93c5fd; cursor: not-allowed; }
    .danger { background-color: #dc2626; }
    .danger:hover { background-color: #b91c1c; }
    .success { background-color: #16a34a; }
    .success:hover { background-color: #15803d; }
    .output { height: 300px; overflow: auto; }
    .status { padding: 10px; border-radius: 6px; margin: 15px 0; }
    .status.error { background-color: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; }
    .status.success { background-color: #dcfce7; border: 1px solid #86efac; color: #166534; }
    .status.info { background-color: #dbeafe; border: 1px solid #93c5fd; color: #1e40af; }
    .stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; margin: 20px 0; }
    .stat { background: #f1f5f9; padding: 15px; border-radius: 6px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; }
    .stat-label { color: #64748b; font-size: 14px; }
  </style>
</head>
<body>
  <h1>French Master Database Cleanup</h1>
  <p>This tool will permanently remove all predefined words from your French Master application database, leaving only your custom words.</p>
  
  <div class="stats">
    <div class="stat">
      <div class="stat-value" id="totalWords">-</div>
      <div class="stat-label">Total Words</div>
    </div>
    <div class="stat">
      <div class="stat-value" id="predefinedWords">-</div>
      <div class="stat-label">Predefined Words</div>
    </div>
    <div class="stat">
      <div class="stat-value" id="deletedWords">-</div>
      <div class="stat-label">Words Deleted</div>
    </div>
    <div class="stat">
      <div class="stat-value" id="userWords">-</div>
      <div class="stat-label">Your Words</div>
    </div>
  </div>
  
  <div id="status" class="status info">Ready to begin cleanup process</div>
  
  <div>
    <button id="analyzeBtn">1. Analyze Database</button>
    <button id="deleteBtn" class="danger" disabled>2. Delete Predefined Words</button>
    <button id="verifyBtn" disabled>3. Verify Deletion</button>
    <button id="doneBtn" class="success" disabled>4. Complete Process</button>
  </div>
  
  <h3>Log Output:</h3>
  <pre id="output" class="output"></pre>
  
  <script>
    // Database configuration
    const DB_NAME = 'frenchMasterDB';
    const DB_VERSION = 1;
    const STORE_WORDS = 'words';
    
    // Track statistics
    const stats = {
      totalWords: 0,
      predefinedWords: 0,
      deletedWords: 0,
      userWords: 0,
      errors: []
    };
    
    // UI elements
    const analyzeBtn = document.getElementById('analyzeBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    const doneBtn = document.getElementById('doneBtn');
    const output = document.getElementById('output');
    const status = document.getElementById('status');
    const statsElements = {
      totalWords: document.getElementById('totalWords'),
      predefinedWords: document.getElementById('predefinedWords'),
      deletedWords: document.getElementById('deletedWords'),
      userWords: document.getElementById('userWords')
    };
    
    // Utility functions
    function log(message) {
      const timestamp = new Date().toLocaleTimeString();
      output.textContent += \`[\${timestamp}] \${message}\\n\`;
      output.scrollTop = output.scrollHeight;
      console.log(message);
    }
    
    function updateStatus(message, type = 'info') {
      status.textContent = message;
      status.className = \`status \${type}\`;
    }
    
    function updateStats() {
      for (const key in stats) {
        if (statsElements[key]) {
          statsElements[key].textContent = stats[key];
        }
      }
    }
    
    // Database functions
    function openDatabase() {
      return new Promise((resolve, reject) => {
        log('Opening IndexedDB database...');
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
          log(\`ERROR: Could not open database - \${event.target.error}\`);
          reject(event.target.error);
        };
        
        request.onsuccess = (event) => {
          log('Database opened successfully');
          resolve(event.target.result);
        };
        
        request.onupgradeneeded = (event) => {
          log('Database upgrade needed - not expected in this script');
          const db = event.target.result;
          
          // Create object store if it doesn't exist
          if (!db.objectStoreNames.contains(STORE_WORDS)) {
            db.createObjectStore(STORE_WORDS, { keyPath: 'id' });
          }
        };
      });
    }
    
    function getAllWords(db) {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_WORDS], 'readonly');
        const store = transaction.objectStore(STORE_WORDS);
        const request = store.getAll();
        
        request.onerror = (event) => {
          reject(event.target.error);
        };
        
        request.onsuccess = (event) => {
          resolve(event.target.result);
        };
      });
    }
    
    function isPredefinedWord(word) {
      return (
        word.isPredefined === true || 
        (word.id && typeof word.id === 'string' && (
          word.id.startsWith('word-') ||
          word.id.startsWith('fallback-w')
        ))
      );
    }
    
    function deleteWord(db, wordId) {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_WORDS], 'readwrite');
        const store = transaction.objectStore(STORE_WORDS);
        const request = store.delete(wordId);
        
        request.onerror = (event) => {
          reject(event.target.error);
        };
        
        request.onsuccess = () => {
          resolve(true);
        };
      });
    }
    
    // Main functions
    async function analyzeDatabase() {
      analyzeBtn.disabled = true;
      updateStatus('Analyzing database...', 'info');
      
      try {
        // Open database
        const db = await openDatabase();
        
        // Get all words
        const words = await getAllWords(db);
        stats.totalWords = words.length;
        
        // Identify predefined words
        const predefinedWords = words.filter(isPredefinedWord);
        stats.predefinedWords = predefinedWords.length;
        stats.userWords = words.length - predefinedWords.length;
        
        log(\`Found \${stats.totalWords} total words in database\`);
        log(\`Identified \${stats.predefinedWords} predefined words\`);
        log(\`You have \${stats.userWords} custom words\`);
        
        if (predefinedWords.length > 0) {
          log('Sample of predefined words:');
          const samples = predefinedWords.slice(0, 5);
          samples.forEach(word => {
            log(\`  - ID: \${word.id}, English: \${word.english}\`);
          });
          
          if (predefinedWords.length > 5) {
            log(\`  ... and \${predefinedWords.length - 5} more\`);
          }
          
          deleteBtn.disabled = false;
          updateStatus(\`Found \${stats.predefinedWords} predefined words to delete\`, 'info');
        } else {
          log('No predefined words found in database!');
          updateStatus('No predefined words found! Database is already clean.', 'success');
          verifyBtn.disabled = false;
        }
        
        updateStats();
        
      } catch (error) {
        log(\`ERROR: \${error.message}\`);
        updateStatus(\`Analysis failed: \${error.message}\`, 'error');
      }
    }
    
    async function deleteAllPredefinedWords() {
      deleteBtn.disabled = true;
      updateStatus('Deleting predefined words...', 'info');
      
      try {
        // Open database
        const db = await openDatabase();
        
        // Get all words again
        const words = await getAllWords(db);
        const predefinedWords = words.filter(isPredefinedWord);
        
        if (predefinedWords.length === 0) {
          log('No predefined words to delete');
          updateStatus('No predefined words to delete', 'success');
          verifyBtn.disabled = false;
          return;
        }
        
        log(\`Starting deletion of \${predefinedWords.length} predefined words...\`);
        
        // Delete each predefined word
        for (const word of predefinedWords) {
          try {
            log(\`Deleting word: \${word.id} - \${word.english}\`);
            await deleteWord(db, word.id);
            stats.deletedWords++;
            updateStats();
          } catch (error) {
            log(\`ERROR deleting word \${word.id}: \${error.message}\`);
            stats.errors.push({ id: word.id, error: error.message });
          }
        }
        
        log(\`Completed deletion process. Deleted \${stats.deletedWords} of \${stats.predefinedWords} predefined words\`);
        
        if (stats.errors.length > 0) {
          log(\`Encountered \${stats.errors.length} errors during deletion\`);
          updateStatus(\`Deletion completed with \${stats.errors.length} errors\`, 'info');
        } else {
          updateStatus('All predefined words deleted successfully', 'success');
        }
        
        verifyBtn.disabled = false;
        
      } catch (error) {
        log(\`ERROR: \${error.message}\`);
        updateStatus(\`Deletion process failed: \${error.message}\`, 'error');
      }
    }
    
    async function verifyDeletion() {
      verifyBtn.disabled = true;
      updateStatus('Verifying deletion...', 'info');
      
      try {
        // Open database
        const db = await openDatabase();
        
        // Get all words
        const words = await getAllWords(db);
        
        // Check for remaining predefined words
        const remainingPredefined = words.filter(isPredefinedWord);
        stats.userWords = words.length - remainingPredefined.length;
        updateStats();
        
        if (remainingPredefined.length === 0) {
          log('Verification complete: No predefined words remain in the database');
          updateStatus('Verification successful! All predefined words have been removed.', 'success');
          doneBtn.disabled = false;
        } else {
          log(\`Verification failed: Found \${remainingPredefined.length} predefined words still in database\`);
          log('Remaining predefined words:');
          
          remainingPredefined.forEach(word => {
            log(\`  - ID: \${word.id}, English: \${word.english}\`);
          });
          
          updateStatus(\`\${remainingPredefined.length} predefined words remain. Try deleting again.\`, 'error');
          deleteBtn.disabled = false;
        }
        
      } catch (error) {
        log(\`ERROR: \${error.message}\`);
        updateStatus(\`Verification failed: \${error.message}\`, 'error');
      }
    }
    
    function finishProcess() {
      doneBtn.disabled = true;
      
      try {
        // Send message to parent window to refresh
        log('Sending refresh signal to application...');
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'REFRESH_CACHE', target: 'FrenchDataService' }, '*');
          log('Refresh message sent to main application');
        }
        
        updateStatus('Process complete! You can now close this window and return to the application.', 'success');
        
        // Generate final report
        log('\\n====== FINAL REPORT ======');
        log(\`Total words in database: \${stats.totalWords}\`);
        log(\`Predefined words detected: \${stats.predefinedWords}\`);
        log(\`Words successfully deleted: \${stats.deletedWords}\`);
        log(\`Your custom words: \${stats.userWords}\`);
        log('=========================');
        log('\\nYou can now close this window and return to using the French Master application.');
        
      } catch (error) {
        log(\`ERROR: \${error.message}\`);
        updateStatus(\`Failed to complete process: \${error.message}\`, 'error');
      }
    }
    
    // Attach event listeners
    analyzeBtn.addEventListener('click', analyzeDatabase);
    deleteBtn.addEventListener('click', deleteAllPredefinedWords);
    verifyBtn.addEventListener('click', verifyDeletion);
    doneBtn.addEventListener('click', finishProcess);
    
    // Initial log message
    log('Database cleanup tool initialized');
    log('Click "Analyze Database" to start the process');
  </script>
</body>
</html>
`;

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(cleanupHtml);
});

// Start the server and open the browser
server.listen(PORT, () => {
  console.log(`Cleanup server running at http://localhost:${PORT}`);
  console.log('Opening browser to run the cleanup tool...');
  
  // Open browser to the cleanup page
  openBrowser(`http://localhost:${PORT}`);
  
  console.log('\nInstructions:');
  console.log('1. Follow the steps in the browser window that just opened');
  console.log('2. Press Ctrl+C in this terminal when you\'re finished to stop the server');
  console.log('\nWaiting for cleanup process to complete...');
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down cleanup server...');
  server.close(() => {
    console.log('Server stopped. Cleanup process complete.');
    process.exit(0);
  });
});