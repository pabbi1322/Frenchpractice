/**
 * DirectVerbService.js
 * A simplified, direct service for verb operations that bypasses complex data chains
 * to ensure reliable verb updates in the database.
 */

import indexedDBService from './IndexedDBService';

const STORE_VERBS = 'verbs';

// Debug mode flag - set to true to enable extensive logging
const DEBUG = true;

/**
 * Log function that only outputs when DEBUG is true
 */
const log = (message, data = null) => {
  if (DEBUG) {
    if (data) {
      console.log(`DirectVerbService: ${message}`, data);
    } else {
      console.log(`DirectVerbService: ${message}`);
    }
  }
};

/**
 * Get all verbs directly from IndexedDB
 */
export const getAllVerbs = async () => {
  try {
    log('Getting all verbs directly from IndexedDB');
    
    // Ensure IndexedDB is initialized
    if (!indexedDBService.isInitialized) {
      log('Initializing IndexedDB');
      await indexedDBService.initialize();
    }
    
    // Get all verbs directly from IndexedDB
    const verbs = await indexedDBService.getAllData(STORE_VERBS);
    log(`Retrieved ${verbs.length} verbs from IndexedDB`);
    
    return verbs;
  } catch (error) {
    console.error('DirectVerbService: Error getting all verbs:', error);
    return [];
  }
};

/**
 * Get a specific verb by ID directly from IndexedDB
 */
export const getVerbById = async (id) => {
  try {
    log(`Getting verb with ID: ${id}`);
    
    // Ensure IndexedDB is initialized
    if (!indexedDBService.isInitialized) {
      log('Initializing IndexedDB');
      await indexedDBService.initialize();
    }
    
    // Get verb by ID
    const verb = await indexedDBService.getById(STORE_VERBS, id);
    
    if (verb) {
      log('Verb found:', verb);
    } else {
      log(`No verb found with ID: ${id}`);
    }
    
    return verb;
  } catch (error) {
    console.error(`DirectVerbService: Error getting verb with ID ${id}:`, error);
    return null;
  }
};

/**
 * Create a properly formatted verb object
 */
export const createVerbObject = (verbData) => {
  // Generate a timestamp
  const timestamp = new Date().toISOString();
  
  // Generate a unique ID if none exists
  const id = verbData.id || `verb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Create a clean verb object with proper structure
  const verbObject = {
    id: id,
    infinitive: verbData.infinitive || verbData.frenchInfinitive || '',
    english: verbData.english || verbData.englishInfinitive || '',
    group: verbData.group || '1',
    
    // Ensure french array exists
    french: Array.isArray(verbData.french) 
      ? [...verbData.french] 
      : [verbData.infinitive || verbData.frenchInfinitive || ''],
    
    // Create properly structured conjugations object
    conjugations: {
      je: Array.isArray(verbData.conjugations?.je) 
        ? [...verbData.conjugations.je] 
        : [verbData.conjugations?.je || ''],
        
      tu: Array.isArray(verbData.conjugations?.tu) 
        ? [...verbData.conjugations.tu] 
        : [verbData.conjugations?.tu || ''],
        
      il: Array.isArray(verbData.conjugations?.il) 
        ? [...verbData.conjugations.il] 
        : [verbData.conjugations?.il || ''],
        
      nous: Array.isArray(verbData.conjugations?.nous) 
        ? [...verbData.conjugations.nous] 
        : [verbData.conjugations?.nous || ''],
        
      vous: Array.isArray(verbData.conjugations?.vous) 
        ? [...verbData.conjugations.vous] 
        : [verbData.conjugations?.vous || ''],
        
      ils: Array.isArray(verbData.conjugations?.ils) 
        ? [...verbData.conjugations.ils] 
        : [verbData.conjugations?.ils || '']
    },
    
    // Metadata
    createdAt: verbData.createdAt || timestamp,
    updatedAt: timestamp,
    createdBy: verbData.createdBy || 'user',
    isPredefined: verbData.isPredefined || false
  };
  
  // Log the created verb object
  log('Created verb object:', verbObject);
  
  return verbObject;
};

/**
 * Update a verb directly in IndexedDB
 */
export const updateVerb = async (id, verbData) => {
  try {
    log(`Updating verb with ID: ${id}`);
    
    // Ensure ID matches
    if (verbData.id && verbData.id !== id) {
      console.error(`DirectVerbService: ID mismatch. Provided: ${verbData.id}, Expected: ${id}`);
      return { success: false, error: 'ID mismatch' };
    }
    
    // Get existing verb first
    const existingVerb = await getVerbById(id);
    
    if (!existingVerb) {
      console.error(`DirectVerbService: Verb with ID ${id} not found`);
      return { success: false, error: 'Verb not found' };
    }
    
    log('Existing verb before update:', existingVerb);
    
    // Format verb data properly
    let newVerbData;
    
    // If verbData contains conjugations directly
    if (verbData.conjugations) {
      newVerbData = {
        ...existingVerb,  // Start with existing data
        ...verbData,      // Override with new data
        id: id,           // Ensure ID remains the same
        updatedAt: new Date().toISOString()  // Update timestamp
      };
    } 
    // If verbData contains form data format (presentTense)
    else if (verbData.presentTense || verbData.frenchInfinitive) {
      newVerbData = {
        ...existingVerb,  // Start with existing data
        id: id,
        infinitive: verbData.frenchInfinitive || existingVerb.infinitive,
        english: verbData.englishInfinitive || existingVerb.english,
        group: verbData.group || existingVerb.group,
        
        // Update french array for consistency
        french: [verbData.frenchInfinitive || existingVerb.infinitive],
        
        // Update conjugations with new values or keep existing
        conjugations: {
          je: [verbData.presentTense?.je || (existingVerb.conjugations?.je?.[0] || '')],
          tu: [verbData.presentTense?.tu || (existingVerb.conjugations?.tu?.[0] || '')],
          il: [verbData.presentTense?.il || (existingVerb.conjugations?.il?.[0] || '')],
          nous: [verbData.presentTense?.nous || (existingVerb.conjugations?.nous?.[0] || '')],
          vous: [verbData.presentTense?.vous || (existingVerb.conjugations?.vous?.[0] || '')],
          ils: [verbData.presentTense?.ils || (existingVerb.conjugations?.ils?.[0] || '')]
        },
        
        // Update timestamp
        updatedAt: new Date().toISOString()
      };
    } else {
      // Use createVerbObject as a fallback to ensure proper structure
      newVerbData = createVerbObject({
        ...existingVerb,
        ...verbData,
        id: id
      });
    }
    
    // Ensure critical properties aren't lost
    if (!newVerbData.conjugations) {
      newVerbData.conjugations = existingVerb.conjugations || {
        je: [''], tu: [''], il: [''], nous: [''], vous: [''], ils: ['']
      };
    }
    
    // Create a completely new object with JSON parse/stringify to avoid any reference issues
    const safeVerbData = JSON.parse(JSON.stringify(newVerbData));
    
    log('Final verb data to save:', safeVerbData);
    
    // Save directly to IndexedDB
    const result = await indexedDBService.updateData(STORE_VERBS, safeVerbData);
    
    log(`Update result: ${result}`);
    
    // Verify the update actually worked by reading it back
    if (result) {
      const verifiedVerb = await getVerbById(id);
      log('Verified saved verb:', verifiedVerb);
      
      // Check that critical properties were saved correctly
      const success = 
        verifiedVerb && 
        verifiedVerb.infinitive === safeVerbData.infinitive && 
        verifiedVerb.english === safeVerbData.english;
      
      if (!success) {
        console.error('DirectVerbService: Verification failed - saved data doesn\'t match expected data');
        return { success: false, error: 'Verification failed', savedVerb: verifiedVerb };
      }
    }
    
    return { success: !!result, verb: safeVerbData };
  } catch (error) {
    console.error(`DirectVerbService: Error updating verb with ID ${id}:`, error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

/**
 * Add a new verb directly to IndexedDB
 */
export const addVerb = async (verbData) => {
  try {
    log('Adding new verb');
    
    // Format verb data properly
    const newVerbData = createVerbObject(verbData);
    
    // Save directly to IndexedDB
    const result = await indexedDBService.addData(STORE_VERBS, newVerbData);
    
    log(`Add result: ${result}`);
    
    return { success: !!result, verb: newVerbData };
  } catch (error) {
    console.error('DirectVerbService: Error adding verb:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

/**
 * Delete a verb directly from IndexedDB
 */
export const deleteVerb = async (id) => {
  try {
    log(`Deleting verb with ID: ${id}`);
    
    // Delete directly from IndexedDB
    const result = await indexedDBService.deleteData(STORE_VERBS, id);
    
    log(`Delete result: ${result}`);
    
    return { success: !!result };
  } catch (error) {
    console.error(`DirectVerbService: Error deleting verb with ID ${id}:`, error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

/**
 * Search for verbs based on a search term
 */
export const searchVerbs = async (searchTerm) => {
  try {
    log(`Searching verbs with term: ${searchTerm}`);
    
    // Get all verbs
    const allVerbs = await getAllVerbs();
    
    // Filter based on search term
    const filtered = allVerbs.filter(verb => {
      const term = searchTerm.toLowerCase();
      return (
        (verb.infinitive && verb.infinitive.toLowerCase().includes(term)) ||
        (verb.english && verb.english.toLowerCase().includes(term))
      );
    });
    
    log(`Found ${filtered.length} matching verbs`);
    
    return filtered;
  } catch (error) {
    console.error('DirectVerbService: Error searching verbs:', error);
    return [];
  }
};

/**
 * Check for verb data integrity and fix any issues
 */
export const repairVerbData = (verbData) => {
  // Start with a copy to avoid mutations
  const data = JSON.parse(JSON.stringify(verbData));
  
  // Fix missing conjugations
  if (!data.conjugations) {
    data.conjugations = {
      je: [''], tu: [''], il: [''], nous: [''], vous: [''], ils: ['']
    };
  } else {
    // Ensure all conjugation subjects exist and are arrays
    ['je', 'tu', 'il', 'nous', 'vous', 'ils'].forEach(subject => {
      if (!data.conjugations[subject]) {
        data.conjugations[subject] = [''];
      } else if (!Array.isArray(data.conjugations[subject])) {
        data.conjugations[subject] = [data.conjugations[subject]];
      }
      
      // Ensure arrays are not empty
      if (data.conjugations[subject].length === 0) {
        data.conjugations[subject] = [''];
      }
    });
  }
  
  // Fix timestamp issues
  if (!data.createdAt) {
    data.createdAt = new Date().toISOString();
  }
  data.updatedAt = new Date().toISOString();
  
  // Fix missing french array
  if (!data.french || !Array.isArray(data.french)) {
    data.french = [data.infinitive || ''];
  }
  
  // Fix basic metadata
  if (!data.group) {
    if (data.infinitive) {
      if (data.infinitive.endsWith('er')) {
        data.group = '1';
      } else if (data.infinitive.endsWith('ir')) {
        data.group = '2';
      } else if (data.infinitive.endsWith('re')) {
        data.group = '3';
      } else {
        data.group = '4'; // Default to irregular verbs
      }
    } else {
      data.group = '1';
    }
  }
  
  return data;
};

export default {
  getAllVerbs,
  getVerbById,
  updateVerb,
  addVerb,
  deleteVerb,
  searchVerbs,
  createVerbObject,
  repairVerbData
};