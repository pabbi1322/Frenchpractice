  /**
   * Add new user-created word
   */
  static async addUserWord(word) {
    try {
      console.log('FrenchDataService.addUserWord called with:', JSON.stringify(word));
      
      // Validate word data
      if (!word) {
        console.error('FrenchDataService: Cannot add null word');
        return false;
      }
      
      // Make sure english exists and is a string
      if (!word.english || typeof word.english !== 'string') {
        console.error('FrenchDataService: Invalid english value in word:', word.english);
        return false;
      }
      
      // Make sure french exists and is properly formatted
      if (!word.french) {
        console.error('FrenchDataService: Missing french value in word');
        return false;
      }
      
      // Ensure french is an array
      if (!Array.isArray(word.french)) {
        console.log('FrenchDataService: Converting french from string to array');
        if (typeof word.french === 'string') {
          word.french = [word.french];
        } else {
          console.error('FrenchDataService: french is neither array nor string:', word.french);
          return false;
        }
      }
      
      // Ensure array is not empty
      if (word.french.length === 0 || !word.french[0]) {
        console.error('FrenchDataService: Empty french array or first element is null/undefined');
        return false;
      }
      
      // Generate ID if missing
      if (!word.id) {
        word.id = `user-w-${Date.now()}`;
        console.log('FrenchDataService: Generated ID for word:', word.id);
      }
      
      // Add timestamp
      word.createdAt = new Date().toISOString();
      word.updatedAt = new Date().toISOString();
      word.isPredefined = false;
      
      console.log('FrenchDataService: Prepared word for storage:', JSON.stringify(word));
      
      try {
        // Add directly to IndexedDB using addData (not add)
        console.log('FrenchDataService: Calling indexedDBService.addData with word');
        const success = await indexedDBService.addData(STORE_WORDS, word);
        console.log('FrenchDataService: indexedDBService.addData result:', success);
        
        if (success) {
          console.log('FrenchDataService: Word added to IndexedDB, updating cache');
          // Update cache
          if (!dataCache.words) dataCache.words = [];
          dataCache.words.push(word);
          
          // Also update localStorage for backward compatibility
          try {
            const userWords = await this.getUserContent(STORE_WORDS) || [];
            localStorage.setItem(USER_WORDS_KEY, JSON.stringify(userWords));
            console.log('FrenchDataService: localStorage updated with new word');
          } catch (storageErr) {
            console.error('FrenchDataService: Error updating localStorage:', storageErr);
            // Don't fail the operation if just localStorage fails
          }
        } else {
          console.error('FrenchDataService: Failed to add word to IndexedDB');
        }
        
        return success;
      } catch (dbError) {
        console.error('FrenchDataService: Error adding word to IndexedDB:', dbError);
        
        // Try fallback to localStorage directly
        try {
          console.log('FrenchDataService: Trying fallback to localStorage');
          const existingWords = JSON.parse(localStorage.getItem(USER_WORDS_KEY) || '[]');
          existingWords.push(word);
          localStorage.setItem(USER_WORDS_KEY, JSON.stringify(existingWords));
          
          // Update cache as well
          if (!dataCache.words) dataCache.words = [];
          dataCache.words.push(word);
          
          console.log('FrenchDataService: Word saved to localStorage fallback');
          return true;
        } catch (fallbackError) {
          console.error('FrenchDataService: Fallback also failed:', fallbackError);
          return false;
        }
      }
    } catch (error) {
      console.error('FrenchDataService: Critical error in addUserWord:', error);
      return false;
    }
  }