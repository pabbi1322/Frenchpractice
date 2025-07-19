  /**
   * Force refresh of data
   */
  static forceRefresh() {
    console.log("FrenchDataService: Force refreshing data...");
    // Reset initialization state
    dataCache.initialized = false;
    
    // Schedule re-initialization
    this.initialize(dataCache.userId);
    
    return {
      message: "Data refresh initiated",
      userId: dataCache.userId
    };
  }
  
  /**
   * Get the next item for practice
   * This method returns an item that the user hasn't seen before or hasn't seen in a while
   * @param {string} type - The type of content to get ('words', 'verbs', 'sentences', 'numbers')
   * @param {string} userId - User ID to track progress
   * @returns {Object} The next item for practice
   */
  static async getNextItem(type, userId = 'guest') {
    console.log(`FrenchDataService: Getting next ${type} item for user ${userId}`);
    
    try {
      let items = [];
      let seenKey = '';
      
      // Get the appropriate items and seen key based on type
      switch (type) {
        case 'words':
          items = await this.getAllWords();
          seenKey = WORDS_SEEN_KEY;
          break;
        case 'verbs':
          items = await this.getAllVerbs();
          seenKey = VERBS_SEEN_KEY;
          break;
        case 'sentences':
          items = await this.getAllSentences();
          seenKey = SENTENCES_SEEN_KEY;
          break;
        case 'numbers':
          items = await this.getAllNumbers();
          seenKey = NUMBERS_SEEN_KEY;
          break;
        default:
          console.error(`FrenchDataService: Unknown item type: ${type}`);
          return null;
      }
      
      if (!items || items.length === 0) {
        console.error(`FrenchDataService: No items available for type: ${type}`);
        return null;
      }