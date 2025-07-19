// This script can be executed in the browser console to verify that predefined verbs
// are no longer loaded in the French Master application

(async function testVerbDeletion() {
  console.log("========= PREDEFINED VERBS DELETION VERIFICATION =========");
  
  // Check if FrenchDataService is available
  if (typeof FrenchDataService === 'undefined') {
    console.error("Error: FrenchDataService is not defined. Please run this script in the French Master application.");
    return;
  }

  // Step 1: Initialize the service if not already initialized
  console.log("Initializing FrenchDataService...");
  await FrenchDataService.initialize();

  // Step 2: Check for predefined verbs in memory cache
  console.log("\n--- Checking memory cache for predefined verbs ---");
  const verbs = await FrenchDataService.getAllVerbs();
  console.log(`Total verbs in memory: ${verbs.length}`);
  
  // Check for any predefined verbs by ID pattern or flag
  const predefinedVerbs = verbs.filter(verb => 
    (verb.id && typeof verb.id === 'string' && verb.id.startsWith('verb-')) || 
    verb.isPredefined === true
  );
  
  if (predefinedVerbs.length > 0) {
    console.error(`Found ${predefinedVerbs.length} predefined verbs still in memory:`);
    predefinedVerbs.forEach(verb => {
      console.error(`- ${verb.id}: ${verb.infinitive}`);
    });
  } else {
    console.log("Success: No predefined verbs found in memory!");
  }

  // Step 3: Check IndexedDB directly for predefined verbs
  console.log("\n--- Checking IndexedDB for predefined verbs ---");
  try {
    if (typeof indexedDBService === 'undefined') {
      console.warn("IndexedDBService not available in global scope, skipping direct database check.");
    } else {
      const dbVerbs = await indexedDBService.getAllData('verbs');
      console.log(`Total verbs in IndexedDB: ${dbVerbs.length}`);
      
      const dbPredefinedVerbs = dbVerbs.filter(verb => 
        (verb.id && typeof verb.id === 'string' && verb.id.startsWith('verb-')) || 
        verb.isPredefined === true
      );
      
      if (dbPredefinedVerbs.length > 0) {
        console.error(`Found ${dbPredefinedVerbs.length} predefined verbs still in database:`);
        dbPredefinedVerbs.forEach(verb => {
          console.error(`- ${verb.id}: ${verb.infinitive}`);
        });
      } else {
        console.log("Success: No predefined verbs found in the database!");
      }
    }
  } catch (error) {
    console.error("Error accessing IndexedDB:", error);
  }

  // Step 4: Test adding a new user verb to ensure functionality still works
  console.log("\n--- Testing adding a new user verb ---");
  const testVerb = {
    infinitive: "tester",
    english: "to test",
    conjugations: {
      present: {
        je: "teste",
        tu: "testes",
        il: "teste",
        nous: "testons",
        vous: "testez",
        ils: "testent"
      }
    }
  };
  
  try {
    const success = await FrenchDataService.addUserVerb(testVerb);
    if (success) {
      console.log("Success: Added test verb successfully");
      
      // Verify the verb was added
      const updatedVerbs = await FrenchDataService.getAllVerbs();
      const addedVerb = updatedVerbs.find(v => v.infinitive === "tester");
      
      if (addedVerb) {
        console.log("Success: Test verb was correctly retrieved after adding");
        console.log("Test verb details:", addedVerb);
      } else {
        console.error("Error: Could not find test verb after adding");
      }
    } else {
      console.error("Error: Failed to add test verb");
    }
  } catch (error) {
    console.error("Error during verb addition test:", error);
  }

  // Step 5: Summary
  console.log("\n========= VERIFICATION SUMMARY =========");
  if (predefinedVerbs.length === 0) {
    console.log("✅ PASS: No predefined verbs found in memory");
  } else {
    console.log("❌ FAIL: Predefined verbs still exist in memory");
  }
  
  try {
    if (typeof indexedDBService !== 'undefined') {
      const dbVerbs = await indexedDBService.getAllData('verbs');
      const dbPredefinedVerbs = dbVerbs.filter(verb => 
        (verb.id && typeof verb.id === 'string' && verb.id.startsWith('verb-')) || 
        verb.isPredefined === true
      );
      
      if (dbPredefinedVerbs.length === 0) {
        console.log("✅ PASS: No predefined verbs found in database");
      } else {
        console.log("❌ FAIL: Predefined verbs still exist in database");
      }
    }
  } catch (error) {
    console.log("⚠️ UNKNOWN: Could not verify database directly");
  }

  console.log("\nTo execute this test again, run this script in the browser console.");
  console.log("========= END OF VERIFICATION =========");
})();