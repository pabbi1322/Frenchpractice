// Enhanced functions for FrenchDataService.js
import indexedDBService from './IndexedDBService';

// Store names - match those in FrenchDataService.js
const STORE_WORDS = 'words';
const STORE_VERBS = 'verbs';
const STORE_SENTENCES = 'sentences';
const STORE_NUMBERS = 'numbers';
const STORE_USER_DATA = 'userData';

// Reference to the data cache that would be in the FrenchDataService
// We'll need to access this through the service instance instead
let dataCache = null;

// Function to initialize with the correct dataCache reference
export function initializeEnhancements(serviceCacheRef) {
  dataCache = serviceCacheRef;
  console.log("Enhanced verb functions initialized with dataCache reference");
}

// Enhanced getVerbs function with force refresh option
export async function getVerbsEnhanced(forceRefresh = false) {
  try {
    console.log(`FrenchDataService: getVerbs called with forceRefresh=${forceRefresh}`);
    if (!indexedDBService.isInitialized) {
      await indexedDBService.initialize();
    }
    
    // Make sure dataCache is initialized
    if (!dataCache) {
      console.error("Enhanced functions not properly initialized, missing dataCache reference");
      return [];
    }
    
    // Use cached data if available and no force refresh is requested
    if (dataCache.verbs && !forceRefresh) {
      console.log(`FrenchDataService: Returning ${dataCache.verbs.length} verbs from cache`);
      return dataCache.verbs;
    }
    
    // If we're here, we need to get fresh data from IndexedDB
    console.log(`FrenchDataService: Getting fresh verbs data from IndexedDB`);
    const verbs = await indexedDBService.getAllData(STORE_VERBS);
    console.log(`FrenchDataService: Got ${verbs.length} verbs from IndexedDB`);
    
    // Cache the results
    dataCache.verbs = verbs;
    dataCache.lastUpdate = Date.now();
    
    return verbs;
  } catch (error) {
    console.error("FrenchDataService: Error getting verbs", error);
    return [];
  }
}

// Enhanced forceRefresh function
export async function forceRefreshEnhanced(service) {
  try {
    console.log("FrenchDataService: forceRefresh called");
    
    // Make sure dataCache is initialized
    if (!dataCache) {
      console.error("Enhanced functions not properly initialized, missing dataCache reference");
      return false;
    }
    
    // Clear cache
    dataCache.initialized = false;
    dataCache.words = null;
    dataCache.verbs = null;
    dataCache.sentences = null;
    dataCache.numbers = null;
    
    // Re-initialize and load all data
    await service.initialize();
    
    // Get fresh verb data
    const verbs = await service.getUserContent(STORE_VERBS);
    dataCache.verbs = verbs;
    console.log(`FrenchDataService: Refreshed ${verbs.length} verbs`);
    
    console.log("FrenchDataService: forceRefresh completed");
    return true;
  } catch (error) {
    console.error("FrenchDataService: Error during force refresh", error);
    return false;
  }
}

export default {
  initializeEnhancements,
  getVerbsEnhanced,
  forceRefreshEnhanced
};