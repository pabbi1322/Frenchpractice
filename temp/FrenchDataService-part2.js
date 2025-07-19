class FrenchDataService {
  /**
   * Initialize the service with a user ID for tracking purposes
   */
  static async initialize(userId = null) {
    console.log(`FrenchDataService: Initializing with userId ${userId}`);
    
    // If already initialized with same userId, don't reinitialize
    if (dataCache.initialized && dataCache.userId === userId) {
      console.log('FrenchDataService: Already initialized with this userId');
      return;
    }
    
    // Reset cache before initializing
    dataCache.initialized = false;
    dataCache.userId = userId;
    
    try {
      // Initialize IndexedDB service
      await indexedDBService.initialize();
      
      // Merge all content sources and prepare data
      await this.loadAllContent();
      dataCache.initialized = true;
      console.log('FrenchDataService: Successfully initialized');
      console.log(`Content loaded - Words: ${dataCache.words?.length || 0}, Verbs: ${dataCache.verbs?.length || 0}, Sentences: ${dataCache.sentences?.length || 0}`);
    } catch (error) {
      console.error('FrenchDataService: Failed to initialize', error);
      // Add fallback data for emergency cases
      this.loadFallbackContent();
    }
  }