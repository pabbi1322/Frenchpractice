// src/services/IndexedDBService.js
const DB_NAME = 'frenchMasterDB';
const DB_VERSION = 2; // Increased version to trigger schema update

class IndexedDBService {
  constructor() {
    this.db = null;
    this.dbSupported = this._checkIndexedDBSupport();
    if (this.dbSupported) {
      console.log('IndexedDB is supported in this browser');
      this.initPromise = this.init();
    } else {
      console.error('IndexedDB is not supported in this browser');
      this.initPromise = Promise.reject(new Error('IndexedDB not supported'));
    }
    this.isInitialized = false;
    this.isSupported = this.dbSupported;
  }

  _checkIndexedDBSupport() {
    try {
      // Check if window and indexedDB are available
      if (typeof window === 'undefined' || !window.indexedDB) {
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking IndexedDB support:', error);
      return false;
    }
  }

  // Wrapper method to match FrenchDataService expectations
  async initialize() {
    console.log('IndexedDBService: initialize() called (wrapper for init())');
    try {
      const db = await this.init();
      this.isInitialized = true;
      return db;
    } catch (error) {
      console.error('IndexedDBService: initialize() failed:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  async init() {
    if (this.db) {
      this.isInitialized = true;
      return Promise.resolve(this.db);
    }

    if (!this.dbSupported) {
      this.isInitialized = false;
      return Promise.reject(new Error('IndexedDB not supported'));
    }

    console.log('Initializing IndexedDB connection...');
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
          console.error('IndexedDB error:', event.target.error);
          this.isInitialized = false;
          reject(event.target.error);
        };

        request.onsuccess = (event) => {
          console.log('IndexedDB connection successful');
          this.db = event.target.result;
          this.isInitialized = true;
          
          // Listen for connection errors
          this.db.onerror = (event) => {
            console.error('IndexedDB error (global):', event.target.error);
          };
          
          resolve(this.db);
        };

        request.onblocked = () => {
          console.warn('IndexedDB connection blocked. Please close other tabs with this site open');
          this.isInitialized = false;
          reject(new Error('Database connection blocked'));
        };
      
      request.onupgradeneeded = (event) => {
        console.log('IndexedDB upgrade needed. Creating/updating object stores...');
        const db = event.target.result;
        
        try {
          // Create stores if they don't exist
          if (!db.objectStoreNames.contains('words')) {
            console.log('Creating words store');
            db.createObjectStore('words', { keyPath: 'id', autoIncrement: true });
          }

          if (!db.objectStoreNames.contains('verbs')) {
            console.log('Creating verbs store');
            db.createObjectStore('verbs', { keyPath: 'id', autoIncrement: true });
          }

          if (!db.objectStoreNames.contains('sentences')) {
            console.log('Creating sentences store');
            db.createObjectStore('sentences', { keyPath: 'id', autoIncrement: true });
          }

          if (!db.objectStoreNames.contains('numbers')) {
            console.log('Creating numbers store');
            db.createObjectStore('numbers', { keyPath: 'id', autoIncrement: true });
          }

          // Add user store for authentication data
          if (!db.objectStoreNames.contains('users')) {
            console.log('Creating users store');
            db.createObjectStore('users', { keyPath: 'id' });
          }
          
          // Add a store for word categories if it doesn't exist
          if (!db.objectStoreNames.contains('wordCategories')) {
            console.log('Creating wordCategories store');
            db.createObjectStore('wordCategories', { keyPath: 'id', autoIncrement: true });
          }
          
          // Handle schema upgrades for existing stores
          const oldVersion = event.oldVersion;
          console.log(`Upgrading database from version ${oldVersion} to ${DB_VERSION}`);
          
          if (oldVersion < 2) {
            console.log('Upgrading to version 2: Adding support for multiple categories per word');
            // We don't need to modify the schema for this upgrade as we'll handle it in the application code
            // by ensuring the 'categories' field is always an array when saving/retrieving words
          }
          
          console.log('All object stores created successfully');
        } catch (error) {
          console.error('Error during database upgrade:', error);
          // Note: We don't reject here because onupgradeneeded failures will trigger onerror
        }
      };
      } catch (error) {
        console.error('Error during IndexedDB initialization:', error);
        reject(error);
      }
    });
  }

  async getAll(storeName) {
    try {
      await this.initPromise;
      
      if (!this.db) {
        console.error(`Cannot get data from ${storeName}: Database connection not established`);
        return [];
      }
      
      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db.transaction(storeName, 'readonly');
          
          transaction.onerror = (event) => {
            console.error(`Transaction error for ${storeName}:`, event.target.error);
            reject(event.target.error);
          };
          
          const store = transaction.objectStore(storeName);
          const request = store.getAll();

          request.onsuccess = () => {
            console.log(`Successfully retrieved ${request.result.length} items from ${storeName}`);
            resolve(request.result);
          };

          request.onerror = (event) => {
            console.error(`Error getting all from ${storeName}:`, event.target.error);
            reject(event.target.error);
          };
        } catch (error) {
          console.error(`Unexpected error in getAll(${storeName}):`, error);
          resolve([]);  // Return empty array as fallback
        }
      });
    } catch (error) {
      console.error(`Failed to initialize database in getAll(${storeName}):`, error);
      return [];  // Return empty array as fallback
    }
  }

  async add(storeName, item) {
    try {
      console.log(`IndexedDBService.add(${storeName}) called with item:`, JSON.stringify(item));
      
      // Validate item has required structure
      if (!item) {
        console.error(`Cannot add to ${storeName}: Item is null or undefined`);
        throw new Error(`Item is null or undefined`);
      }
      
      // For words store, validate data structure
      if (storeName === 'words') {
        console.log(`Validating word item structure:`, item);
        
        // Check for required fields
        if (!item.english) {
          console.error(`Word item missing required field: english`);
          throw new Error(`Word item missing required field: english`);
        }
        
        if (!item.french) {
          console.error(`Word item missing required field: french`);
          throw new Error(`Word item missing required field: french`);
        }
        
        // Ensure french is properly formatted
        if (Array.isArray(item.french)) {
          console.log(`French is an array with ${item.french.length} elements:`, item.french);
          // Make sure the array has at least one element and none are null/undefined
          if (item.french.length === 0 || !item.french[0]) {
            console.error(`French array is empty or contains null/undefined element`);
            throw new Error(`French array is empty or invalid`);
          }
        } else {
          console.error(`French is not an array:`, item.french);
          // Convert to array format if it's a string
          if (typeof item.french === 'string') {
            console.log(`Converting french from string to array`);
            item.french = [item.french];
          } else {
            throw new Error(`French field must be an array or string`);
          }
        }
        
        // Ensure categories is an array
        if (item.categories) {
          if (!Array.isArray(item.categories)) {
            console.log(`Converting categories from ${typeof item.categories} to array`);
            item.categories = [item.categories];
          }
        } else {
          // Default to empty array if categories is not provided
          item.categories = [];
        }
      }
      
      await this.initPromise;
      
      if (!this.db) {
        console.error(`Cannot add to ${storeName}: Database connection not established`);
        throw new Error(`Database connection not established`);
      }
      
      return new Promise((resolve, reject) => {
        try {
          console.log(`Creating transaction for adding to ${storeName}`);
          const transaction = this.db.transaction(storeName, 'readwrite');
          
          transaction.oncomplete = () => {
            console.log(`Transaction for adding to ${storeName} completed successfully`);
          };
          
          transaction.onerror = (event) => {
            console.error(`Transaction error for adding to ${storeName}:`, event.target.error);
          };
          
          const store = transaction.objectStore(storeName);
          console.log(`Calling store.add with item:`, item);
          const request = store.add(item);

          request.onsuccess = (event) => {
            // For auto-increment IDs, return the generated ID
            console.log(`Successfully added item to ${storeName}`, 
              item.id ? `with ID ${item.id}` : `with generated ID ${event.target.result}`);
            resolve(event.target.result);
          };

          request.onerror = (event) => {
            console.error(`Error adding to ${storeName}:`, event.target.error);
            // Check for common errors
            if (event.target.error.name === 'ConstraintError') {
              console.error('Item with this ID already exists');
            }
            reject(event.target.error);
          };
        } catch (error) {
          console.error(`Unexpected error in add(${storeName}):`, error);
          reject(error);
        }
      });
    } catch (error) {
      console.error(`Failed in IndexedDBService.add(${storeName}):`, error);
      throw error;
    }
  }

  async update(storeName, item) {
    try {
      console.log(`IndexedDBService.update(${storeName}) started with item:`, JSON.stringify(item));
      await this.initPromise;
      
      if (!this.db) {
        console.error(`Cannot update in ${storeName}: Database connection not established`);
        throw new Error(`Database connection not established`);
      }
      
      return new Promise((resolve, reject) => {
        try {
          console.log(`Creating transaction for updating in ${storeName}`);
          const transaction = this.db.transaction(storeName, 'readwrite');
          
          transaction.oncomplete = () => {
            console.log(`Transaction for updating in ${storeName} completed successfully`);
          };
          
          transaction.onerror = (event) => {
            console.error(`Transaction error for updating in ${storeName}:`, event.target.error);
          };
          
          const store = transaction.objectStore(storeName);
          
          // First check if item exists
          console.log(`Checking if item with ID ${item.id} exists before updating`);
          const getRequest = store.get(item.id);
          
          getRequest.onsuccess = () => {
            if (getRequest.result) {
              console.log(`Item with ID ${item.id} found in ${storeName}, proceeding with update`);
            } else {
              console.log(`Item with ID ${item.id} not found in ${storeName}, will be added as new`);
            }
            
            // Proceed with put operation which will update or add
            console.log(`Putting item with ID ${item.id} in ${storeName}`);
            const request = store.put(item);

            request.onsuccess = () => {
              console.log(`Successfully updated item in ${storeName} with ID ${item.id}`);
              resolve(true);
            };

            request.onerror = (event) => {
              console.error(`Error updating in ${storeName}:`, event.target.error);
              reject(event.target.error);
            };
          };
          
          getRequest.onerror = (event) => {
            console.error(`Error checking item existence in ${storeName}:`, event.target.error);
            // Still try to put the item
            console.log(`Still trying to put item despite get error`);
            const request = store.put(item);
            
            request.onsuccess = () => {
              console.log(`Successfully updated item in ${storeName} with ID ${item.id} (after get error)`);
              resolve(true);
            };
            
            request.onerror = (event) => {
              console.error(`Error updating in ${storeName} (after get error):`, event.target.error);
              reject(event.target.error);
            };
          };
        } catch (error) {
          console.error(`Unexpected error in update(${storeName}):`, error);
          reject(error);
        }
      });
    } catch (error) {
      console.error(`Failed to initialize database in update(${storeName}):`, error);
      throw error;
    }
  }

  async delete(storeName, id) {
    try {
      console.log(`IndexedDBService.delete(${storeName}, ${id}) started`);
      
      if (!id) {
        console.error(`Invalid ID provided for deletion from ${storeName}: ${id}`);
        return false;
      }
      
      await this.initPromise;
      
      if (!this.db) {
        console.error(`Cannot delete from ${storeName}: Database connection not established`);
        throw new Error(`Database connection not established`);
      }
      
      return new Promise((resolve, reject) => {
        try {
          console.log(`Creating transaction for deleting from ${storeName} with ID ${id}`);
          const transaction = this.db.transaction(storeName, 'readwrite');
          
          transaction.oncomplete = () => {
            console.log(`Transaction for deleting from ${storeName} completed successfully`);
          };
          
          transaction.onerror = (event) => {
            console.error(`Transaction error for deleting from ${storeName}:`, event.target.error);
          };
          
          const store = transaction.objectStore(storeName);
          
          // First check if the item exists
          console.log(`Checking if item with ID ${id} exists in ${storeName} before deleting`);
          const getRequest = store.get(id);
          
          getRequest.onsuccess = () => {
            if (!getRequest.result) {
              console.warn(`Item with ID ${id} not found in ${storeName}, nothing to delete`);
              // We still resolve with true since the end state is as desired (item not in DB)
              resolve(true);
              return;
            }
            
            console.log(`Item with ID ${id} found in ${storeName}, proceeding with deletion`);
            console.log(`Item to delete:`, getRequest.result);
            
            // Now proceed with deletion
            const deleteRequest = store.delete(id);

            deleteRequest.onsuccess = (event) => {
              console.log(`Successfully deleted item with ID ${id} from ${storeName}`, event.target.result);
              resolve(true);
            };

            deleteRequest.onerror = (event) => {
              console.error(`Error deleting from ${storeName}:`, event.target.error);
              reject(event.target.error);
            };
          };
          
          getRequest.onerror = (event) => {
            console.error(`Error checking item existence in ${storeName}:`, event.target.error);
            // Still try to delete the item
            console.log(`Still trying to delete item despite get error`);
            
            const deleteRequest = store.delete(id);
            
            deleteRequest.onsuccess = (event) => {
              console.log(`Successfully deleted item with ID ${id} from ${storeName} (after get error)`, event.target.result);
              resolve(true);
            };
            
            deleteRequest.onerror = (event) => {
              console.error(`Error deleting from ${storeName} (after get error):`, event.target.error);
              reject(event.target.error);
            };
          };
        } catch (error) {
          console.error(`Unexpected error in delete(${storeName}):`, error);
          reject(error);
        }
      });
    } catch (error) {
      console.error(`Failed to initialize database in delete(${storeName}):`, error);
      return false; // Return false instead of throw to avoid unhandled rejections
    }
  }

  async getById(storeName, id) {
    try {
      await this.initPromise;
      
      if (!this.db) {
        console.error(`Cannot get by ID from ${storeName}: Database connection not established`);
        return null;
      }
      
      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.get(id);

          request.onsuccess = () => {
            if (request.result) {
              console.log(`Successfully retrieved item with ID ${id} from ${storeName}`);
            } else {
              console.log(`Item with ID ${id} not found in ${storeName}`);
            }
            resolve(request.result);
          };

          request.onerror = (event) => {
            console.error(`Error getting by id from ${storeName}:`, event.target.error);
            reject(event.target.error);
          };
        } catch (error) {
          console.error(`Unexpected error in getById(${storeName}):`, error);
          resolve(null);  // Return null as fallback
        }
      });
    } catch (error) {
      console.error(`Failed to initialize database in getById(${storeName}):`, error);
      return null;  // Return null as fallback
    }
  }

  // Wrapper methods for FrenchDataService compatibility
  async getAllData(storeName) {
    console.log(`IndexedDBService: getAllData(${storeName}) called (wrapper for getAll())`);
    return this.getAll(storeName);
  }
  
  async addData(storeName, item) {
    console.log(`IndexedDBService: addData(${storeName}) called with item:`, JSON.stringify(item));
    try {
      // First validate that the database is initialized
      if (!this.isInitialized) {
        console.log("IndexedDB not initialized, initializing now before adding data");
        await this.initialize();
      }
      
      // Ensure database connection is established
      if (!this.db) {
        console.error(`IndexedDBService: Cannot add to ${storeName}, database connection not established`);
        return false;
      }
      
      // Try to use put instead of add to ensure upsert behavior
      return new Promise((resolve, reject) => {
        try {
          console.log(`IndexedDBService: Creating transaction for adding/updating in ${storeName}`);
          const transaction = this.db.transaction(storeName, 'readwrite');
          
          transaction.oncomplete = () => {
            console.log(`IndexedDBService: Transaction completed successfully for ${storeName}`);
          };
          
          transaction.onerror = (event) => {
            console.error(`IndexedDBService: Transaction error for ${storeName}:`, event.target.error);
          };
          
          const store = transaction.objectStore(storeName);
          console.log(`IndexedDBService: Using put operation for ${storeName} to ensure data is saved`);
          const request = store.put(item); // Use put instead of add for upsert behavior
          
          request.onsuccess = (event) => {
            const resultId = event.target.result;
            console.log(`IndexedDBService: Successfully added/updated item in ${storeName} with ID:`, 
              item.id || resultId);
            resolve(item.id || resultId);
          };
          
          request.onerror = (event) => {
            console.error(`IndexedDBService: Error in put operation for ${storeName}:`, event.target.error);
            reject(event.target.error);
          };
        } catch (error) {
          console.error(`IndexedDBService: Unexpected error in addData(${storeName}):`, error);
          reject(error);
        }
      });
    } catch (error) {
      console.error(`IndexedDBService: Critical error in addData(${storeName}):`, error);
      return false;
    }
  }

  async bulkAddData(storeName, items) {
    console.log(`IndexedDBService: bulkAddData(${storeName}, ${items.length} items) called`);
    if (!Array.isArray(items) || items.length === 0) {
      console.warn('No items to add in bulkAddData');
      return false;
    }
    
    try {
      await this.initPromise;
      
      if (!this.db) {
        console.error(`Cannot bulk add to ${storeName}: Database connection not established`);
        return false;
      }
      
      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          
          let successCount = 0;
          let errorCount = 0;

          transaction.oncomplete = () => {
            console.log(`Transaction for adding ${successCount} items to ${storeName} completed successfully`);
            resolve(successCount > 0);
          };

          transaction.onerror = (event) => {
            console.error(`Transaction error for bulk add to ${storeName}:`, event.target.error);
            reject(event.target.error);
          };

          items.forEach((item) => {
            try {
              // Use add method to avoid overwriting existing items
              const request = store.add(item);

              request.onsuccess = () => {
                successCount++;
              };

              request.onerror = (e) => {
                console.warn(`Error adding item to ${storeName}:`, e.target.error);
                errorCount++;
              };
            } catch (err) {
              console.error(`Error processing item in bulkAddData:`, err);
              errorCount++;
            }
          });
          
        } catch (error) {
          console.error(`Unexpected error in bulkAddData(${storeName}):`, error);
          reject(error);
        }
      });
    } catch (error) {
      console.error(`Failed to initialize database in bulkAddData(${storeName}):`, error);
      return false;
    }
  }

  async updateData(storeName, item) {
    console.log(`IndexedDBService: updateData(${storeName}) called with item:`, JSON.stringify(item));
    try {
      const result = await this.update(storeName, item);
      console.log(`IndexedDBService: updateData result: ${result}`);
      return result;
    } catch (error) {
      console.error(`IndexedDBService: updateData error:`, error);
      return false;
    }
  }
  
  async deleteData(storeName, id) {
    console.log(`IndexedDBService: deleteData(${storeName}, ${id}) called (wrapper for delete())`);
    return this.delete(storeName, id);
  }
  
  async getStoreCount(storeName) {
    console.log(`IndexedDBService: getStoreCount(${storeName}) called`);
    try {
      await this.initPromise;
      
      if (!this.db) {
        console.error(`Cannot get count for ${storeName}: Database connection not established`);
        return 0;
      }
      
      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.count();
          
          request.onsuccess = () => {
            console.log(`Count for ${storeName}: ${request.result}`);
            resolve(request.result);
          };
          
          request.onerror = (event) => {
            console.error(`Error getting count for ${storeName}:`, event.target.error);
            reject(event.target.error);
          };
        } catch (error) {
          console.error(`Unexpected error in getStoreCount(${storeName}):`, error);
          resolve(0);  // Return 0 as fallback
        }
      });
    } catch (error) {
      console.error(`Failed to initialize database in getStoreCount(${storeName}):`, error);
      return 0;  // Return 0 as fallback
    }
  }
  
  async clearStore(storeName) {
    console.log(`IndexedDBService: clearStore(${storeName}) called`);
    try {
      await this.initPromise;
      
      if (!this.db) {
        console.error(`Cannot clear store ${storeName}: Database connection not established`);
        return false;
      }
      
      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.clear();
          
          request.onsuccess = () => {
            console.log(`Successfully cleared store ${storeName}`);
            resolve(true);
          };
          
          request.onerror = (event) => {
            console.error(`Error clearing store ${storeName}:`, event.target.error);
            reject(event.target.error);
          };
        } catch (error) {
          console.error(`Unexpected error in clearStore(${storeName}):`, error);
          reject(error);
        }
      });
    } catch (error) {
      console.error(`Failed to initialize database in clearStore(${storeName}):`, error);
      return false;
    }
  }

  // Authentication specific methods
  async saveUser(userData) {
    console.log('Saving user data to IndexedDB:', userData.id);
    return this.update('users', userData);
  }

  async getUser(userId) {
    console.log('Fetching user data from IndexedDB:', userId);
    return this.getById('users', userId);
  }
  
  // Get database status information
  async getStatus() {
    try {
      await this.initPromise;
      
      if (!this.db) {
        return {
          connected: false,
          version: null,
          objectStores: []
        };
      }
      
      const objectStores = Array.from(this.db.objectStoreNames);
      
      return {
        connected: true,
        version: this.db.version,
        objectStores,
        name: this.db.name
      };
    } catch (error) {
      console.error('Error getting database status:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

// Create and export a singleton instance
const indexedDBService = new IndexedDBService();
export default indexedDBService;