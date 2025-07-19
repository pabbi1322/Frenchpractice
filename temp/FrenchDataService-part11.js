  /**
   * Get all verbs - ensures data is loaded first
   */
  static async getAllVerbs() {
    if (!dataCache.initialized) {
      await this.initialize();
    }
    
    // Use IndexedDB if available, otherwise use cache
    if (indexedDBService.isInitialized) {
      try {
        // Check if we need to populate the DB with built-in verbs first
        const count = await indexedDBService.getStoreCount(STORE_VERBS);
        if (count === 0 && dataCache.verbs?.length > 0) {
          // Store built-in verbs to IndexedDB for persistence
          await indexedDBService.bulkAddData(STORE_VERBS, dataCache.verbs);
        }
        
        // Get all verbs from IndexedDB
        let verbs = await indexedDBService.getAllData(STORE_VERBS);
        
        // MODIFIED: Filter out any predefined verbs that might still be in the database
        verbs = verbs.filter(verb => {
          const isPredefined = verb.id && typeof verb.id === 'string' && 
                             (verb.id.startsWith('verb-') || verb.isPredefined === true);
          if (isPredefined) {
            console.log(`Filtering out predefined verb: ${verb.id} - ${verb.infinitive}`);
          }
          return !isPredefined;
        });
        
        console.log(`FrenchDataService: Returning ${verbs.length} verbs from IndexedDB`);
        
        // Make a deep copy and fix any verbs missing proper English translations
        const processedVerbs = JSON.parse(JSON.stringify(verbs));
        processedVerbs.forEach(verb => {
          if (!verb.english || !verb.english.startsWith('to ')) {
            console.log(`Fixing verb English in getAllVerbs: ${verb.id} - ${verb.infinitive}`);
            verb.english = `to ${verb.infinitive || 'unknown'}`;
          }
        });
        
        return processedVerbs;
      } catch (error) {
        console.error('Error getting verbs from IndexedDB, falling back to cache:', error);
      }
    }
    
    console.log(`FrenchDataService: Returning ${dataCache.verbs?.length || 0} verbs from cache`);
    
    // Make a deep copy of the verbs
    const verbs = JSON.parse(JSON.stringify(dataCache.verbs || []));
    
    // Fix any verbs missing proper English translations
    verbs.forEach(verb => {
      if (!verb.english || !verb.english.startsWith('to ')) {
        console.log(`Fixing verb English in getAllVerbs: ${verb.id} - ${verb.infinitive}`);
        verb.english = `to ${verb.infinitive || 'unknown'}`;
      }
    });
    
    return verbs;
  }