// src/utils/DebugUtils.js
import indexedDBService from '../services/IndexedDBService';

/**
 * Reset the IndexedDB database by deleting and recreating stores
 * This is useful for debugging authentication issues
 */
export const clearAndResetIndexedDB = async () => {
  console.log('Clearing and resetting IndexedDB...');

  try {
    // Get DB connection info to use for reconnecting
    const dbInfo = await indexedDBService.getStatus();
    
    // Delete the database
    await new Promise((resolve, reject) => {
      const request = window.indexedDB.deleteDatabase(dbInfo.name);
      
      request.onsuccess = () => {
        console.log('Database deleted successfully');
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Could not delete database:', event);
        reject(new Error('Failed to delete database'));
      };
    });

    // Force page reload to reinitialize IndexedDB
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
    return { success: true, message: 'Database reset successful. Reloading page...' };
  } catch (error) {
    console.error('Failed to reset IndexedDB:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Dump the content of all stores in IndexedDB
 * This is useful for debugging database issues
 */
export const dumpDatabaseContent = async () => {
  try {
    const dbContent = {};
    
    // Get database info
    const dbInfo = await indexedDBService.getStatus();
    dbContent.dbInfo = dbInfo;
    
    // Get content of each store - Using correct store names
    const stores = ['words', 'verbs', 'sentences', 'numbers', 'users'];
    
    for (const store of stores) {
      try {
        const items = await indexedDBService.getAll(store);
        dbContent[store] = items;
      } catch (error) {
        console.error(`Failed to get content of store ${store}:`, error);
        dbContent[store] = { error: error.message };
      }
    }
    
    return dbContent;
  } catch (error) {
    console.error('Failed to dump database content:', error);
    return { error: error.message };
  }
};

/**
 * Check if the demo user exists and return its details
 */
export const checkDemoUser = async () => {
  try {
    const users = await indexedDBService.getAll('users');
    const demoUser = users.find(u => u.email === 'demo@example.com');
    return { exists: !!demoUser, user: demoUser };
  } catch (error) {
    console.error('Failed to check demo user:', error);
    return { error: error.message };
  }
};