// exec-words-deletion.js - Direct script to delete all predefined words from IndexedDB

// IndexedDB configuration
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

// Open a direct connection to the database
function openDatabase() {
  return new Promise((resolve, reject) => {
    console.log(`Opening IndexedDB database: ${DB_NAME}`);
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Failed to open database:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      console.log('Database opened successfully');
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      console.log('Database upgrade needed - not expected in this script');
      const db = event.target.result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_WORDS)) {
        db.createObjectStore(STORE_WORDS, { keyPath: 'id' });
      }
    };
  });
}

// Get all words from the database
function getAllWords(db) {
  return new Promise((resolve, reject) => {
    console.log('Getting all words from database...');
    const transaction = db.transaction([STORE_WORDS], 'readonly');
    const store = transaction.objectStore(STORE_WORDS);
    const request = store.getAll();

    request.onerror = (event) => {
      console.error('Failed to get words:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const words = event.target.result;
      console.log(`Retrieved ${words.length} total words`);
      resolve(words);
    };
  });
}

// Identify if a word is predefined
function isPredefinedWord(word) {
  // Check multiple patterns to catch all predefined words
  return (
    word.isPredefined === true || 
    (word.id && typeof word.id === 'string' && (
      word.id.startsWith('word-') ||
      word.id.startsWith('fallback-w') ||
      // Additional pattern checks if needed
      false
    ))
  );
}

// Delete a word by ID
function deleteWord(db, wordId) {
  return new Promise((resolve, reject) => {
    console.log(`Deleting word with ID: ${wordId}`);
    const transaction = db.transaction([STORE_WORDS], 'readwrite');
    const store = transaction.objectStore(STORE_WORDS);
    const request = store.delete(wordId);

    request.onerror = (event) => {
      console.error(`Failed to delete word ${wordId}:`, event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      console.log(`Successfully deleted word: ${wordId}`);
      resolve(true);
    };
  });
}

// Verify deletion by checking if any predefined words remain
async function verifyDeletion(db) {
  const words = await getAllWords(db);
  const predefinedWords = words.filter(isPredefinedWord);
  
  stats.remaining = predefinedWords.length;
  stats.userWords = words.length - predefinedWords.length;
  
  console.log(`Verification complete: ${predefinedWords.length} predefined words remaining`);
  
  if (predefinedWords.length > 0) {
    console.log('Some predefined words still exist:');
    predefinedWords.forEach(word => {
      console.log(`  ID: ${word.id}, English: ${word.english}, French: ${word.french}`);
    });
  } else {
    console.log('All predefined words successfully deleted!');
  }
  
  return predefinedWords;
}

// Main deletion function
async function deletePredefinedWords() {
  let db;
  try {
    // Open database connection
    db = await openDatabase();
    
    // Get all words
    const words = await getAllWords(db);
    stats.total = words.length;
    
    // Identify predefined words
    const predefinedWords = words.filter(isPredefinedWord);
    stats.predefined = predefinedWords.length;
    
    console.log(`Found ${predefinedWords.length} predefined words out of ${words.length} total words`);
    
    // Delete each predefined word
    for (const word of predefinedWords) {
      try {
        await deleteWord(db, word.id);
        stats.deleted++;
      } catch (error) {
        console.error(`Failed to delete word ${word.id}:`, error);
        stats.failed++;
      }
    }
    
    // Verify deletion
    const remainingWords = await verifyDeletion(db);
    
    // Output final results
    console.log('\n==== DELETION SUMMARY ====');
    console.log(`Total words in database: ${stats.total}`);
    console.log(`Predefined words identified: ${stats.predefined}`);
    console.log(`Words successfully deleted: ${stats.deleted}`);
    console.log(`Failed deletions: ${stats.failed}`);
    console.log(`Remaining predefined words: ${stats.remaining}`);
    console.log(`User words in database: ${stats.userWords}`);
    console.log('========================\n');
    
    // Return status
    return {
      success: stats.remaining === 0,
      stats: stats
    };
    
  } catch (error) {
    console.error('An error occurred during the deletion process:', error);
    return { 
      success: false, 
      error: error.message,
      stats: stats
    };
  } finally {
    // Close the database connection
    if (db) {
      db.close();
      console.log('Database connection closed');
    }
  }
}

// Execute deletion process
console.log('Starting predefined words deletion process...');
deletePredefinedWords().then(result => {
  if (result.success) {
    console.log('DELETION SUCCESSFUL: All predefined words have been removed from the database.');
  } else {
    console.error('DELETION FAILED:', result.error || 'Some predefined words still exist.');
  }
}).catch(error => {
  console.error('CRITICAL ERROR:', error);
});