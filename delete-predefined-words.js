// delete-predefined-words.js
// Script to delete predefined words from IndexedDB

// Import required services
import indexedDBService from './src/services/IndexedDBService.js';
import FrenchDataService from './src/services/FrenchDataService.js';

/**
 * This script removes all predefined words from the database.
 * Predefined words are identified by IDs starting with "word-" or isPredefined flag.
 */

async function deletePredefinedWords() {
  console.log("Starting deletion of predefined words...");
  
  // 1. Initialize required services
  try {
    await indexedDBService.initialize();
    console.log("IndexedDB initialized");
  } catch (error) {
    console.error("Failed to initialize IndexedDB:", error);
    return;
  }
  
  // 2. Get all words from the database
  let words = [];
  try {
    words = await indexedDBService.getAllData('words');
    console.log(`Found ${words.length} words in database`);
  } catch (error) {
    console.error("Failed to get words from database:", error);
    return;
  }
  
  // 3. Identify predefined words (words from additionalFrenchWords have IDs like "word-1", "word-2", etc.)
  const predefinedWords = words.filter(word => {
    return word.isPredefined === true || 
           (word.id && typeof word.id === 'string' && word.id.startsWith('word-'));
  });
  
  console.log(`Found ${predefinedWords.length} predefined words to delete`);
  
  // 4. Delete each predefined word
  let successCount = 0;
  let failCount = 0;
  
  for (const word of predefinedWords) {
    try {
      console.log(`Deleting word: ${word.id} (${word.english} - ${word.french[0]})`);
      const success = await indexedDBService.deleteData('words', word.id);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (error) {
      console.error(`Error deleting word ${word.id}:`, error);
      failCount++;
    }
  }
  
  console.log(`Deletion completed: ${successCount} words deleted, ${failCount} failed`);
  
  // 5. Refresh the cache to ensure consistency
  try {
    await FrenchDataService.forceRefresh();
    console.log("Cache refreshed successfully");
  } catch (error) {
    console.error("Failed to refresh cache:", error);
  }
  
  return {
    total: predefinedWords.length,
    success: successCount,
    failed: failCount
  };
}

// Execute the function
deletePredefinedWords().then(result => {
  console.log("Deletion operation completed with results:", result);
}).catch(error => {
  console.error("Deletion operation failed:", error);
});