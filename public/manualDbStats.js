// manualDbStats.js
// Run this script in the browser console to check database stats directly

async function getManualDbStats() {
  console.log("Getting manual database stats...");
  
  try {
    // Open the database directly
    const dbName = 'frenchMasterDB';
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onerror = (event) => reject(new Error(`Database error: ${event.target.error}`));
      request.onsuccess = (event) => resolve(event.target.result);
    });
    
    // Get all store names
    const storeNames = Array.from(db.objectStoreNames);
    console.log("Available stores:", storeNames);
    
    // Get counts for each store
    const counts = {};
    
    for (const storeName of storeNames) {
      const count = await new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const countRequest = store.count();
        
        countRequest.onsuccess = () => resolve(countRequest.result);
        countRequest.onerror = (event) => reject(event.target.error);
      });
      
      counts[storeName] = count;
    }
    
    console.log("Store counts:", counts);
    return counts;
  } catch (error) {
    console.error("Error getting manual stats:", error);
    return { error: error.message };
  }
}

// Run the stats function
getManualDbStats().then(results => {
  console.log("Manual stats complete:", results);
});
