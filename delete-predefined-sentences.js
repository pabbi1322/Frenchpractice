// delete-predefined-sentences.js
// Script to delete predefined sentences from IndexedDB

/**
 * This script removes all predefined sentences from the database.
 * Predefined sentences are identified by IDs starting with "sentence-" or isPredefined flag.
 */

async function deletePredefinedSentences() {
  console.log("Starting deletion of predefined sentences...");
  
  // 1. Initialize required services
  try {
    await indexedDBService.initialize();
    console.log("IndexedDB initialized");
  } catch (error) {
    console.error("Failed to initialize IndexedDB:", error);
    return;
  }
  
  // 2. Get all sentences from the database
  let sentences = [];
  try {
    sentences = await indexedDBService.getAllData('sentences');
    console.log(`Found ${sentences.length} sentences in database`);
  } catch (error) {
    console.error("Failed to get sentences from database:", error);
    return;
  }
  
  // 3. Identify predefined sentences (from additionalFrenchSentences have IDs like "sentence-1", "sentence-2", etc.)
  const predefinedSentences = sentences.filter(sentence => {
    return sentence.isPredefined === true || 
           (sentence.id && typeof sentence.id === 'string' && sentence.id.startsWith('sentence-'));
  });
  
  console.log(`Found ${predefinedSentences.length} predefined sentences to delete`);
  
  // 4. Delete each predefined sentence
  let successCount = 0;
  let failCount = 0;
  
  for (const sentence of predefinedSentences) {
    try {
      console.log(`Deleting sentence: ${sentence.id} (${sentence.english})`);
      const success = await indexedDBService.deleteData('sentences', sentence.id);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (error) {
      console.error(`Error deleting sentence ${sentence.id}:`, error);
      failCount++;
    }
  }
  
  console.log(`Deletion completed: ${successCount} sentences deleted, ${failCount} failed`);
  
  // 5. Refresh the cache to ensure consistency
  try {
    await FrenchDataService.forceRefresh();
    console.log("Cache refreshed successfully");
  } catch (error) {
    console.error("Failed to refresh cache:", error);
  }
  
  return {
    total: predefinedSentences.length,
    success: successCount,
    failed: failCount
  };
}

// Execute the function
deletePredefinedSentences().then(result => {
  console.log("Deletion operation completed with results:", result);
}).catch(error => {
  console.error("Deletion operation failed:", error);
});