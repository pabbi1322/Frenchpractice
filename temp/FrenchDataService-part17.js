  /**
   * Update data in a store
   * @param {string} storeName - Store name
   * @param {Object} item - Item to update
   */
  static async updateData(storeName, item) {
    try {
      console.log(`FrenchDataService: Updating item ${item.id} in ${storeName}`);
      
      if (!item || !item.id) {
        console.error('FrenchDataService: Cannot update item, invalid item or missing ID');
        return false;
      }
      
      if (indexedDBService.isInitialized) {
        const success = await indexedDBService.updateData(storeName, item);
        
        if (success) {
          // Update cache
          switch (storeName) {
            case STORE_WORDS:
              if (dataCache.words) {
                dataCache.words = dataCache.words.map(w => w.id === item.id ? item : w);
              }
              break;
            case STORE_VERBS:
              if (dataCache.verbs) {
                dataCache.verbs = dataCache.verbs.map(v => v.id === item.id ? item : v);
              }
              break;
            case STORE_SENTENCES:
              if (dataCache.sentences) {
                dataCache.sentences = dataCache.sentences.map(s => s.id === item.id ? item : s);
              }
              break;
            case STORE_NUMBERS:
              if (dataCache.numbers) {
                dataCache.numbers = dataCache.numbers.map(n => n.id === item.id ? item : n);
              }
              break;
          }
        }
        
        return success;
      } else {
        console.error('FrenchDataService: IndexedDB not initialized, cannot update');
        return false;
      }
    } catch (error) {
      console.error(`FrenchDataService: Error updating item ${item.id} in ${storeName}:`, error);
      return false;
    }
  }
}

export default FrenchDataService;