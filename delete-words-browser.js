// This script should be run in the browser console
// It directly uses the global instances of indexedDBService and FrenchDataService

async function deletePredefinedWords() {
  console.log("Starting deletion of predefined words...");
  
  try {
    console.log("Making sure IndexedDB is initialized...");
    if (!indexedDBService.isInitialized) {
      await indexedDBService.initialize();
    }
    console.log("IndexedDB initialized");
    
    // Get all words from the database
    const words = await indexedDBService.getAllData('words');
    console.log(`Found ${words.length} words in database`);
    
    // Identify predefined words (IDs like "word-1", "word-2", etc.)
    const predefinedWords = words.filter(word => {
      return word.isPredefined === true || 
             (word.id && typeof word.id === 'string' && word.id.startsWith('word-'));
    });
    
    console.log(`Found ${predefinedWords.length} predefined words to delete`);
    
    // Delete each predefined word
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
    
    // Refresh the cache to ensure consistency
    await FrenchDataService.forceRefresh();
    console.log("Cache refreshed successfully");
    
    return {
      total: predefinedWords.length,
      success: successCount,
      failed: failCount
    };
  } catch (error) {
    console.error("Error in deletion script:", error);
    return { error: error.message };
  }
}

// Execute the function
console.log("Copy this function to your browser console and run: deletePredefinedWords().then(console.log)");