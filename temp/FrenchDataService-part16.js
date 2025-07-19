  /**
   * Delete data from a store
   * @param {string} storeName - Store name
   * @param {string} id - ID of the item to delete
   */
  static async deleteData(storeName, id) {
    try {
      console.log(`FrenchDataService: Deleting item ${id} from ${storeName}`);
      
      if (!id) {
        console.error('FrenchDataService: Cannot delete item, no ID provided');
        return false;
      }
      
      if (indexedDBService.isInitialized) {
        const success = await indexedDBService.deleteData(storeName, id);
        
        if (success) {
          // Update cache
          switch (storeName) {
            case STORE_WORDS:
              if (dataCache.words) {
                dataCache.words = dataCache.words.filter(item => item.id !== id);
              }
              break;
            case STORE_VERBS:
              if (dataCache.verbs) {
                dataCache.verbs = dataCache.verbs.filter(item => item.id !== id);
              }
              break;
            case STORE_SENTENCES:
              if (dataCache.sentences) {
                dataCache.sentences = dataCache.sentences.filter(item => item.id !== id);
              }
              break;
            case STORE_NUMBERS:
              if (dataCache.numbers) {
                dataCache.numbers = dataCache.numbers.filter(item => item.id !== id);
              }
              break;
          }
        }
        
        return success;
      } else {
        console.error('FrenchDataService: IndexedDB not initialized, cannot delete');
        return false;
      }
    } catch (error) {
      console.error(`FrenchDataService: Error deleting item ${id} from ${storeName}:`, error);
      return false;
    }
  }