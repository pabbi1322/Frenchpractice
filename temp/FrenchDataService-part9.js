  /**
   * Add new user-created verb
   */
  static async addUserVerb(verb) {
    if (!verb.id) {
      verb.id = `user-v-${Date.now()}`;
    }
    
    // Add timestamp
    verb.createdAt = new Date().toISOString();
    verb.updatedAt = new Date().toISOString();
    verb.isPredefined = false;
    
    try {
      // Add directly to IndexedDB
      const success = await indexedDBService.addData(STORE_VERBS, verb);
      
      if (success) {
        // Update cache
        if (!dataCache.verbs) dataCache.verbs = [];
        dataCache.verbs.push(verb);
        
        // Also update localStorage for backward compatibility
        const userVerbs = await this.getUserContent(STORE_VERBS) || [];
        localStorage.setItem(USER_VERBS_KEY, JSON.stringify(userVerbs));
      }
      
      return success;
    } catch (error) {
      console.error('Error adding user verb:', error);
      return false;
    }
  }
  
  /**
   * Add new user-created sentence
   */
  static async addUserSentence(sentence) {
    if (!sentence.id) {
      sentence.id = `user-s-${Date.now()}`;
    }
    
    // Add timestamp
    sentence.createdAt = new Date().toISOString();
    sentence.updatedAt = new Date().toISOString();
    sentence.isPredefined = false;
    
    try {
      // Add directly to IndexedDB
      const success = await indexedDBService.addData(STORE_SENTENCES, sentence);
      
      if (success) {
        // Update cache
        if (!dataCache.sentences) dataCache.sentences = [];
        dataCache.sentences.push(sentence);
        
        // Also update localStorage for backward compatibility
        const userSentences = await this.getUserContent(STORE_SENTENCES) || [];
        localStorage.setItem(USER_SENTENCES_KEY, JSON.stringify(userSentences));
      }
      
      return success;
    } catch (error) {
      console.error('Error adding user sentence:', error);
      return false;
    }
  }