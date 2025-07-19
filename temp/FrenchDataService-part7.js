  /**
   * Save user-created content to IndexedDB with localStorage fallback
   */
  static async saveUserContent(storeName, content) {
    try {
      // If IndexedDB is initialized, save data there
      if (indexedDBService.isInitialized) {
        // If content is an array, use bulkAddData
        if (Array.isArray(content)) {
          await indexedDBService.clearStore(storeName);
          const success = await indexedDBService.bulkAddData(storeName, content);
          
          // Also save to localStorage as backup
          const key = this.getLocalStorageKeyForStore(storeName);
          if (key) {
            localStorage.setItem(key, JSON.stringify(content));
          }
          
          // Refresh cache after saving
          await this.loadAllContent();
          return success;
        } else {
          // For single items
          const success = await indexedDBService.updateData(storeName, content);
          // Refresh cache after saving
          await this.loadAllContent();
          return success;
        }
      } else {
        // Fallback to localStorage
        const key = this.getLocalStorageKeyForStore(storeName);
        if (!key) return false;
        
        localStorage.setItem(key, JSON.stringify(content));
        // Refresh cache after saving
        await this.loadAllContent();
        return true;
      }
    } catch (error) {
      console.error(`FrenchDataService: Error saving user content for ${storeName}`, error);
      return false;
    }
  }
  
  /**
   * Get localStorage key for a given store name
   */
  static getLocalStorageKeyForStore(storeName) {
    switch (storeName) {
      case STORE_WORDS:
        return USER_WORDS_KEY;
      case STORE_VERBS:
        return USER_VERBS_KEY;
      case STORE_SENTENCES:
        return USER_SENTENCES_KEY;
      default:
        return `frenchmaster_${storeName}`;
    }
  }