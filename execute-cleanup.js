// execute-cleanup.js - Script to permanently delete all predefined words

// Open the database directly
const DB_NAME = 'frenchMasterDB';
const DB_VERSION = 1;
const STORE_WORDS = 'words';

// Track statistics
const stats = {
  totalWords: 0,
  predefinedWords: 0,
  deletedWords: 0,
  errors: []
};

console.log('Starting predefined words cleanup script...');

// Open database
const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onerror = (event) => {
  console.error('Failed to open database:', event.target.error);
  showResults({
    success: false,
    error: event.target.error.message,
    stats: stats
  });
};

request.onupgradeneeded = (event) => {
  // Not expected in this case since the database should already exist
  const db = event.target.result;
  
  // Create object store if it doesn't exist
  if (!db.objectStoreNames.contains(STORE_WORDS)) {
    db.createObjectStore(STORE_WORDS, { keyPath: 'id' });
  }
};

request.onsuccess = async (event) => {
  const db = event.target.result;
  console.log('Database opened successfully');
  
  try {
    // Step 1: Get all words from the database
    const words = await getAllWords(db);
    stats.totalWords = words.length;
    console.log(`Found ${words.length} total words in database`);
    
    // Step 2: Identify predefined words
    const predefinedWords = words.filter(isPredefinedWord);
    stats.predefinedWords = predefinedWords.length;
    console.log(`Found ${predefinedWords.length} predefined words to delete`);
    
    // Step 3: Delete each predefined word
    if (predefinedWords.length > 0) {
      console.log('Starting deletion process...');
      
      for (const word of predefinedWords) {
        try {
          console.log(`Deleting word: ${word.id} - ${word.english}`);
          await deleteWord(db, word.id);
          stats.deletedWords++;
        } catch (error) {
          console.error(`Error deleting word ${word.id}:`, error);
          stats.errors.push({ id: word.id, error: error.message });
        }
      }
    } else {
      console.log('No predefined words found. Database is already clean!');
    }
    
    // Step 4: Verify the deletion
    const verificationResult = await verifyDeletion(db);
    
    // Step 5: Show results
    showResults({
      success: verificationResult.remainingPredefined === 0,
      stats: stats,
      verificationResult: verificationResult
    });
    
  } catch (error) {
    console.error('An error occurred during cleanup:', error);
    showResults({
      success: false,
      error: error.message,
      stats: stats
    });
  } finally {
    // Close the database connection
    db.close();
    console.log('Database connection closed');
  }
};

// Function to get all words from the database
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

// Function to check if a word is predefined
function isPredefinedWord(word) {
  return (
    word.isPredefined === true || 
    (word.id && typeof word.id === 'string' && (
      word.id.startsWith('word-') ||
      word.id.startsWith('fallback-w')
    ))
  );
}

// Function to delete a word
function deleteWord(db, wordId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_WORDS], 'readwrite');
    const store = transaction.objectStore(STORE_WORDS);
    const request = store.delete(wordId);
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
    
    request.onsuccess = (event) => {
      resolve(true);
    };
  });
}

// Function to verify the deletion
async function verifyDeletion(db) {
  // Get all words again
  const words = await getAllWords(db);
  
  // Check for any remaining predefined words
  const remainingPredefined = words.filter(isPredefinedWord);
  
  return {
    totalWords: words.length,
    remainingPredefined: remainingPredefined.length,
    userWords: words.length - remainingPredefined.length,
    remainingPredefinedList: remainingPredefined.map(word => ({
      id: word.id,
      english: word.english,
      french: word.french
    }))
  };
}

// Function to display results
function showResults(results) {
  console.log('\n===== RESULTS =====');
  if (results.success) {
    console.log('SUCCESS: All predefined words have been deleted!');
  } else {
    console.log('FAILURE: Could not delete all predefined words.');
    if (results.error) {
      console.log('Error:', results.error);
    }
  }
  
  console.log('\nStatistics:');
  console.log(`- Total words found: ${results.stats.totalWords}`);
  console.log(`- Predefined words found: ${results.stats.predefinedWords}`);
  console.log(`- Words successfully deleted: ${results.stats.deletedWords}`);
  
  if (results.verificationResult) {
    console.log('\nVerification:');
    console.log(`- Remaining words in database: ${results.verificationResult.totalWords}`);
    console.log(`- Remaining predefined words: ${results.verificationResult.remainingPredefined}`);
    console.log(`- User-added words: ${results.verificationResult.userWords}`);
    
    if (results.verificationResult.remainingPredefined > 0) {
      console.log('\nRemaining predefined words:');
      results.verificationResult.remainingPredefinedList.forEach(word => {
        console.log(`- ID: ${word.id}, English: ${word.english}`);
      });
    }
  }
  
  console.log('\nNext steps:');
  console.log('1. Refresh the application to reload the database');
  console.log('2. Navigate to the practice page to verify only your custom words appear');
  console.log('===================');
  
  // Send message to FrenchDataService to refresh its cache
  try {
    window.postMessage({ type: 'REFRESH_CACHE', target: 'FrenchDataService' }, '*');
    console.log('Refresh message sent to application');
  } catch (error) {
    console.error('Could not send refresh message:', error);
  }
}

// Execute directly if this file is loaded in a browser
if (typeof window !== 'undefined') {
  console.log('Script loaded and executing...');
}