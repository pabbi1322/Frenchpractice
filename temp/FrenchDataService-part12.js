  /**
   * Get all sentences - ensures data is loaded first
   */
  static async getAllSentences() {
    if (!dataCache.initialized) {
      await this.initialize();
    }
    
    // Use IndexedDB if available, otherwise use cache
    if (indexedDBService.isInitialized) {
      try {
        // Check if we need to populate the DB with built-in sentences first
        const count = await indexedDBService.getStoreCount(STORE_SENTENCES);
        if (count === 0 && dataCache.sentences?.length > 0) {
          // Store built-in sentences to IndexedDB for persistence
          await indexedDBService.bulkAddData(STORE_SENTENCES, dataCache.sentences);
        }
        
        // Get all sentences from IndexedDB
        const sentences = await indexedDBService.getAllData(STORE_SENTENCES);
        console.log(`FrenchDataService: Returning ${sentences.length} sentences from IndexedDB`);
        return [...sentences]; // Return a copy to prevent modification
      } catch (error) {
        console.error('Error getting sentences from IndexedDB, falling back to cache:', error);
      }
    }
    
    console.log(`FrenchDataService: Returning ${dataCache.sentences?.length || 0} sentences from cache`);
    return [...(dataCache.sentences || [])]; // Return a copy to prevent modification
  }

  /**
   * Debug method to get cache status
   */
  static debugGetCacheStatus() {
    return {
      initialized: dataCache.initialized,
      userId: dataCache.userId,
      wordCount: dataCache.words?.length || 0,
      verbCount: dataCache.verbs?.length || 0,
      sentenceCount: dataCache.sentences?.length || 0,
      numberCount: dataCache.numbers?.length || 0
    };
  }