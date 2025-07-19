// src/utils/DatabaseStatsUtils.js
import indexedDBService from '../services/IndexedDBService';

/**
 * Get database statistics for all content types
 * Shows counts for words, verbs, sentences, numbers
 */
export const getDatabaseStats = async () => {
  try {
    const dbInfo = await indexedDBService.getDBInfo();
    const stats = {
      timestamp: new Date().toISOString(),
      stores: [],
      totalCount: 0
    };
    
    // Content stores to check
    const contentStores = ['words', 'verbs', 'sentences', 'numbers', 'users'];
    
    // Get counts for each store
    for (const storeName of contentStores) {
      try {
        const items = await indexedDBService.getAll(storeName);
        const count = items?.length || 0;
        
        stats.stores.push({
          name: storeName,
          count: count,
          exists: true
        });
        
        stats.totalCount += count;
      } catch (error) {
        console.log(`Store '${storeName}' does not exist or cannot be accessed`);
        stats.stores.push({
          name: storeName,
          count: 0,
          exists: false
        });
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Failed to get database statistics:', error);
    return { 
      error: error.message,
      stores: [],
      totalCount: 0 
    };
  }
};

/**
 * Get sample data from each store (up to limit items)
 */
export const getDatabaseSamples = async (limit = 3) => {
  try {
    const samples = {};
    const contentStores = ['words', 'verbs', 'sentences', 'numbers'];
    
    for (const storeName of contentStores) {
      try {
        const allItems = await indexedDBService.getAll(storeName);
        samples[storeName] = allItems.slice(0, limit);
      } catch (error) {
        console.log(`Cannot get samples from store '${storeName}': ${error.message}`);
        samples[storeName] = [];
      }
    }
    
    return samples;
  } catch (error) {
    console.error('Failed to get database samples:', error);
    return {};
  }
};