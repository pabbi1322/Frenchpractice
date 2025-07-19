  /**
   * Get all words - ensures data is loaded first
   */
  static async getAllWords() {
    if (!dataCache.initialized) {
      await this.initialize();
    }
    
    // Use IndexedDB if available, otherwise use cache
    if (indexedDBService.isInitialized) {
      try {
        // Check if we need to populate the DB with built-in words first
        const count = await indexedDBService.getStoreCount(STORE_WORDS);
        if (count === 0 && dataCache.words?.length > 0) {
          // Store built-in words to IndexedDB for persistence
          await indexedDBService.bulkAddData(STORE_WORDS, dataCache.words);
        }
        
        // Get all words from IndexedDB
        const words = await indexedDBService.getAllData(STORE_WORDS);
        console.log(`FrenchDataService: Returning ${words.length} words from IndexedDB`);
        return [...words]; // Return a copy to prevent modification
      } catch (error) {
        console.error('Error getting words from IndexedDB, falling back to cache:', error);
      }
    }
    
    console.log(`FrenchDataService: Returning ${dataCache.words?.length || 0} words from cache`);
    return [...(dataCache.words || [])]; // Return a copy to prevent modification
  }

  /**
   * Get all numbers - ensures data is loaded first
   */
  static async getAllNumbers() {
    if (!dataCache.initialized) {
      await this.initialize();
    }
    
    // Use IndexedDB if available, otherwise use cache
    if (indexedDBService.isInitialized) {
      try {
        // Check if we need to populate the DB with built-in numbers first
        const count = await indexedDBService.getStoreCount(STORE_NUMBERS);
        if (count === 0 && dataCache.numbers?.length > 0) {
          // Store built-in numbers to IndexedDB for persistence
          await indexedDBService.bulkAddData(STORE_NUMBERS, dataCache.numbers);
        }
        
        // Get all numbers from IndexedDB
        const numbers = await indexedDBService.getAllData(STORE_NUMBERS);
        console.log(`FrenchDataService: Returning ${numbers.length} numbers from IndexedDB`);
        return [...numbers]; // Return a copy to prevent modification
      } catch (error) {
        console.error('Error getting numbers from IndexedDB, falling back to cache:', error);
      }
    }
    
    // If numbers are already cached, return them
    if (dataCache.numbers) {
      console.log(`FrenchDataService: Returning ${dataCache.numbers.length || 0} cached numbers`);
      return [...dataCache.numbers]; // Return a copy to prevent modification
    }
    
    // Otherwise filter from words and cache for future use
    const numbers = dataCache.words ? dataCache.words.filter(word => word.category === 'number') : [];
    dataCache.numbers = numbers; // Cache for future use
    console.log(`FrenchDataService: Returning ${numbers?.length || 0} numbers (newly filtered)`);
    return [...numbers]; // Return a copy to prevent modification
  }