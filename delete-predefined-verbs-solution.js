// delete-predefined-verbs-solution.js
// This file contains two solutions for removing predefined verbs:
// 1. Code modification to FrenchDataService.js to prevent loading predefined verbs
// 2. A script to run in the browser console to delete any existing predefined verbs

/**
 * SOLUTION PART 1: Modification to FrenchDataService.js
 * 
 * Locate the loadAllContent method in FrenchDataService.js (approximately line 80)
 * and replace the verb loading section with the modified version below.
 * 
 * Change from:
 *   try {
 *     additionalVerbs = additionalFrenchVerbs || [];
 *     console.log(`Loaded ${additionalVerbs.length} additional verbs`);
 *   } catch (e) {
 *     console.error("Failed to load additionalFrenchVerbs:", e);
 *     additionalVerbs = [];
 *   }
 * 
 * To:
 *   // MODIFIED: Skip loading additionalFrenchVerbs as per user request
 *   additionalVerbs = [];
 *   console.log('Skipping additionalFrenchVerbs as requested by user');
 */

// Location of change: src/services/FrenchDataService.js around line 121-126

/**
 * SOLUTION PART 2: Script to delete existing predefined verbs
 * 
 * Copy and paste this script into the browser console to remove any predefined
 * verbs that might already be in the database.
 */

async function deletePredefinedVerbs() {
  console.log("Starting deletion of predefined verbs...");
  
  // 1. Initialize required services
  try {
    await indexedDBService.initialize();
    console.log("IndexedDB initialized");
  } catch (error) {
    console.error("Failed to initialize IndexedDB:", error);
    return;
  }
  
  // 2. Get all verbs from the database
  let verbs = [];
  try {
    verbs = await indexedDBService.getAllData('verbs');
    console.log(`Found ${verbs.length} verbs in database`);
  } catch (error) {
    console.error("Failed to get verbs from database:", error);
    return;
  }
  
  // 3. Identify predefined verbs (verbs from additionalFrenchVerbs have IDs like "verb-1", "verb-2", etc.)
  const predefinedVerbs = verbs.filter(verb => {
    return verb.isPredefined === true || 
           (verb.id && typeof verb.id === 'string' && verb.id.startsWith('verb-'));
  });
  
  console.log(`Found ${predefinedVerbs.length} predefined verbs to delete`);
  
  // 4. Delete each predefined verb
  let successCount = 0;
  let failCount = 0;
  
  for (const verb of predefinedVerbs) {
    try {
      console.log(`Deleting verb: ${verb.id} (${verb.infinitive})`);
      const success = await indexedDBService.deleteData('verbs', verb.id);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (error) {
      console.error(`Error deleting verb ${verb.id}:`, error);
      failCount++;
    }
  }
  
  console.log(`Deletion completed: ${successCount} verbs deleted, ${failCount} failed`);
  
  // 5. Refresh the cache to ensure consistency
  try {
    await FrenchDataService.forceRefresh();
    console.log("Cache refreshed successfully");
  } catch (error) {
    console.error("Failed to refresh cache:", error);
  }
  
  return {
    total: predefinedVerbs.length,
    success: successCount,
    failed: failCount
  };
}

// Execute the function
deletePredefinedVerbs().then(result => {
  console.log("Deletion operation completed with results:", result);
}).catch(error => {
  console.error("Deletion operation failed:", error);
});