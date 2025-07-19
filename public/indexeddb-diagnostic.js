
    // indexeddb-diagnostic.js
    // This script will be injected into the browser to diagnose IndexedDB issues
    
    // Function to check IndexedDB content and store statistics
    function diagnoseIndexedDB() {
      console.log("===== IndexedDB Diagnostic Tool =====");
      
      return new Promise((resolveMain, rejectMain) => {
        try {
          // 1. Open the database directly
          const dbName = 'frenchMasterDB';
          const dbVersion = 1;
          
          const openRequest = indexedDB.open(dbName, dbVersion);
          
          openRequest.onerror = (event) => {
            console.error("Failed to open database:", event.target.error);
            rejectMain(new Error(`Database error: ${event.target.error}`));
          };
          
          openRequest.onsuccess = (event) => {
            const db = event.target.result;
            
            // 2. Get all store names
            const storeNames = Array.from(db.objectStoreNames);
            console.log("Available stores:", storeNames);
            
            // 3. Check content in each store
            const storePromises = storeNames.map(storeName => {
              return new Promise((resolve) => {
                try {
                  const transaction = db.transaction(storeName, "readonly");
                  const store = transaction.objectStore(storeName);
                  
                  // Get count
                  const countRequest = store.count();
                  
                  countRequest.onsuccess = () => {
                    const count = countRequest.result;
                    
                    // Get sample items
                    const getAllRequest = store.getAll(null, 3);
                    
                    getAllRequest.onsuccess = () => {
                      const items = getAllRequest.result;
                      
                      resolve({
                        name: storeName,
                        count: count,
                        samples: items
                      });
                    };
                    
                    getAllRequest.onerror = (event) => {
                      console.error(`Error getting samples from ${storeName}:`, event.target.error);
                      resolve({
                        name: storeName,
                        count: count,
                        error: event.target.error.message,
                        samples: []
                      });
                    };
                  };
                  
                  countRequest.onerror = (event) => {
                    console.error(`Error counting items in ${storeName}:`, event.target.error);
                    resolve({
                      name: storeName,
                      count: 'Error',
                      error: event.target.error.message,
                      samples: []
                    });
                  };
                } catch (error) {
                  console.error(`Error accessing store ${storeName}:`, error);
                  resolve({
                    name: storeName,
                    count: 'Error',
                    error: error.message,
                    samples: []
                  });
                }
              });
            });
            
            Promise.all(storePromises).then(storeResults => {
              // 4. Check for issues
              const report = {
                stores: storeResults,
                dbVersion: db.version,
                storeNames: storeNames
              };
              
              // 5. Check expected store names
              const expectedStores = ['words', 'verbs', 'sentences', 'numbers', 'users'];
              const missingExpectedStores = expectedStores.filter(name => !storeNames.includes(name));
              
              if (missingExpectedStores.length > 0) {
                console.error("Missing expected stores:", missingExpectedStores);
                report.missingExpectedStores = missingExpectedStores;
              }
              
              // 6. Check what DebugUtils is looking for
              const debugUtilsStores = ['users', 'userContent', 'verbData', 'wordData', 'sentenceData', 'numberData'];
              const mismatchedStores = debugUtilsStores.filter(name => !storeNames.includes(name));
              
              if (mismatchedStores.length > 0) {
                console.error("DebugUtils is looking for stores that don't exist:", mismatchedStores);
                report.mismatchedStores = mismatchedStores;
              }
              
              // 7. Print summary
              console.log("\n===== DIAGNOSTIC SUMMARY =====");
              console.log(`Database '${dbName}' (version ${db.version}):`);
              
              let totalItems = 0;
              storeResults.forEach(store => {
                console.log(`${store.name}: ${store.count} items`);
                if (typeof store.count === 'number') {
                  totalItems += store.count;
                }
              });
              
              console.log(`Total items: ${totalItems}`);
              
              // Complete the promise
              resolveMain(report);
            }).catch(error => {
              console.error("Error in store diagnostics:", error);
              rejectMain(error);
            });
          };
        } catch (error) {
          console.error("Fatal error in diagnostic:", error);
          rejectMain(error);
        }
      });
    }
    
    // Run the diagnostic and store the result in a global variable for inspection
    window.runIndexedDBDiagnostic = function() {
      return diagnoseIndexedDB().then(report => {
        window.diagnosisResult = report;
        console.log("Diagnostic complete. Results stored in window.diagnosisResult");
        return report;
      }).catch(error => {
        console.error("Diagnostic failed:", error);
        return { error: error.message };
      });
    };
    
    // Function to compare the actual database content with what's reported in the UI
    window.compareDbWithStats = function() {
      // This function will be called from the browser console
      const dbReport = window.diagnosisResult;
      
      if (!dbReport) {
        console.error("No diagnosis result available. Run window.runIndexedDBDiagnostic() first.");
        return;
      }
      
      // Get the stats from the UI
      const statsElem = document.querySelector('.auth-debugger .stats-table');
      if (!statsElem) {
        console.error("Could not find stats table in the UI");
        return;
      }
      
      console.log("Comparing database content with UI statistics...");
      
      // Extract database counts
      const dbCounts = {};
      dbReport.stores.forEach(store => {
        dbCounts[store.name] = store.count;
      });
      
      console.log("Actual database counts:", dbCounts);
      
      return {
        actualDb: dbCounts,
        report: dbReport
      };
    };
    
    console.log("IndexedDB diagnostic tools loaded.");
    console.log("Use window.runIndexedDBDiagnostic() to run the diagnostic.");
    console.log("Use window.compareDbWithStats() to compare with UI statistics.");
    