// delete-predefined-numbers.js
// Script to delete predefined numbers from IndexedDB

/**
 * This script removes all predefined numbers from the database.
 * Predefined numbers are identified by IDs starting with "number-" or isPredefined flag.
 */

async function deletePredefinedNumbers() {
  console.log("Starting deletion of predefined numbers...");
  
  // 1. Initialize required services
  try {
    await indexedDBService.initialize();
    console.log("IndexedDB initialized");
  } catch (error) {
    console.error("Failed to initialize IndexedDB:", error);
    return;
  }
  
  // 2. Get all numbers from the database
  let numbers = [];
  try {
    numbers = await indexedDBService.getAllData('numbers');
    console.log(`Found ${numbers.length} numbers in database`);
  } catch (error) {
    console.error("Failed to get numbers from database:", error);
    return;
  }
  
  // 3. Identify predefined numbers (from additionalFrenchNumbers have IDs like "number-1", "number-2", etc.)
  const predefinedNumbers = numbers.filter(number => {
    return number.isPredefined === true || 
           (number.id && typeof number.id === 'string' && number.id.startsWith('number-'));
  });
  
  console.log(`Found ${predefinedNumbers.length} predefined numbers to delete`);
  
  // 4. Delete each predefined number
  let successCount = 0;
  let failCount = 0;
  
  for (const number of predefinedNumbers) {
    try {
      console.log(`Deleting number: ${number.id} (${number.english} - ${number.french[0]})`);
      const success = await indexedDBService.deleteData('numbers', number.id);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (error) {
      console.error(`Error deleting number ${number.id}:`, error);
      failCount++;
    }
  }
  
  console.log(`Deletion completed: ${successCount} numbers deleted, ${failCount} failed`);
  
  // 5. Refresh the cache to ensure consistency
  try {
    await FrenchDataService.forceRefresh();
    console.log("Cache refreshed successfully");
  } catch (error) {
    console.error("Failed to refresh cache:", error);
  }
  
  return {
    total: predefinedNumbers.length,
    success: successCount,
    failed: failCount
  };
}

// Execute the function
deletePredefinedNumbers().then(result => {
  console.log("Deletion operation completed with results:", result);
}).catch(error => {
  console.error("Deletion operation failed:", error);
});