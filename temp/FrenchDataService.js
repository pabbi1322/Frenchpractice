// FrenchDataService.js - A centralized service for all French content data
import additionalFrenchWords from '../data/additionalFrenchWords';
import additionalFrenchSentences from '../data/additionalFrenchSentences';
import additionalFrenchNumbers from '../data/additionalFrenchNumbers';
// Still importing but NOT using additionalFrenchVerbs
import additionalFrenchVerbs from '../data/additionalFrenchVerbs';
import indexedDBService from './IndexedDBService';

// No longer importing extended verbs from JSON file
// We will only use the approved data sources from the data folder

// Initialize empty arrays since frenchContent.js was removed
const frenchWords = [];
const frenchVerbs = [];
const frenchSentences = [];
const frenchNumbers = [];

// In-memory cache implementation
const dataCache = {
  initialized: false,
  userId: null,
  words: null,
  verbs: null,
  sentences: null,
  numbers: null // Explicitly add numbers to cache
};

// IndexedDB store names
const STORE_WORDS = 'words';
const STORE_VERBS = 'verbs';
const STORE_SENTENCES = 'sentences';
const STORE_NUMBERS = 'numbers';
const STORE_USER_DATA = 'userData';

// Local storage keys for user added content (used as fallback)
const USER_WORDS_KEY = 'frenchmaster_user_words';
const USER_VERBS_KEY = 'frenchmaster_user_verbs'; 
const USER_SENTENCES_KEY = 'frenchmaster_user_sentences';

// Local storage keys for tracking viewed content
const WORDS_SEEN_KEY = 'french-learning-words-seen';
const VERBS_SEEN_KEY = 'french-learning-verbs-seen';
const SENTENCES_SEEN_KEY = 'french-learning-sentences-seen';
const NUMBERS_SEEN_KEY = 'french-learning-numbers-seen';  /**
   * Get all words - ensures data is loaded first
   */
  static async getAllWords() {
    if (!dataCache.initialized) {
      await this.initialize();
    }
    
    // Use IndexedDB if available, otherwise use cache
    if (indexedDBService.isInitialized) {
      try {
        // Check if we need to populate the DB with built-in words first
        const count = await indexedDBService.getStoreCount(STORE_WORDS);
        if (count === 0 && dataCache.words?.length > 0) {
          // Store built-in words to IndexedDB for persistence
          await indexedDBService.bulkAddData(STORE_WORDS, dataCache.words);
        }
        
        // Get all words from IndexedDB
        const words = await indexedDBService.getAllData(STORE_WORDS);
        console.log(`FrenchDataService: Returning ${words.length} words from IndexedDB`);
        return [...words]; // Return a copy to prevent modification
      } catch (error) {
        console.error('Error getting words from IndexedDB, falling back to cache:', error);
      }
    }
    
    console.log(`FrenchDataService: Returning ${dataCache.words?.length || 0} words from cache`);
    return [...(dataCache.words || [])]; // Return a copy to prevent modification
  }

  /**
   * Get all numbers - ensures data is loaded first
   */
  static async getAllNumbers() {
    if (!dataCache.initialized) {
      await this.initialize();
    }
    
    // Use IndexedDB if available, otherwise use cache
    if (indexedDBService.isInitialized) {
      try {
        // Check if we need to populate the DB with built-in numbers first
        const count = await indexedDBService.getStoreCount(STORE_NUMBERS);
        if (count === 0 && dataCache.numbers?.length > 0) {
          // Store built-in numbers to IndexedDB for persistence
          await indexedDBService.bulkAddData(STORE_NUMBERS, dataCache.numbers);
        }
        
        // Get all numbers from IndexedDB
        const numbers = await indexedDBService.getAllData(STORE_NUMBERS);
        console.log(`FrenchDataService: Returning ${numbers.length} numbers from IndexedDB`);
        return [...numbers]; // Return a copy to prevent modification
      } catch (error) {
        console.error('Error getting numbers from IndexedDB, falling back to cache:', error);
      }
    }
    
    // If numbers are already cached, return them
    if (dataCache.numbers) {
      console.log(`FrenchDataService: Returning ${dataCache.numbers.length || 0} cached numbers`);
      return [...dataCache.numbers]; // Return a copy to prevent modification
    }
    
    // Otherwise filter from words and cache for future use
    const numbers = dataCache.words ? dataCache.words.filter(word => word.category === 'number') : [];
    dataCache.numbers = numbers; // Cache for future use
    console.log(`FrenchDataService: Returning ${numbers?.length || 0} numbers (newly filtered)`);
    return [...numbers]; // Return a copy to prevent modification
  }  /**
   * Get all verbs - ensures data is loaded first
   */
  static async getAllVerbs() {
    if (!dataCache.initialized) {
      await this.initialize();
    }
    
    // Use IndexedDB if available, otherwise use cache
    if (indexedDBService.isInitialized) {
      try {
        // Check if we need to populate the DB with built-in verbs first
        const count = await indexedDBService.getStoreCount(STORE_VERBS);
        if (count === 0 && dataCache.verbs?.length > 0) {
          // Store built-in verbs to IndexedDB for persistence
          await indexedDBService.bulkAddData(STORE_VERBS, dataCache.verbs);
        }
        
        // Get all verbs from IndexedDB
        let verbs = await indexedDBService.getAllData(STORE_VERBS);
        
        // MODIFIED: Filter out any predefined verbs that might still be in the database
        verbs = verbs.filter(verb => {
          const isPredefined = verb.id && typeof verb.id === 'string' && 
                             (verb.id.startsWith('verb-') || verb.isPredefined === true);
          if (isPredefined) {
            console.log(`Filtering out predefined verb: ${verb.id} - ${verb.infinitive}`);
          }
          return !isPredefined;
        });
        
        console.log(`FrenchDataService: Returning ${verbs.length} verbs from IndexedDB`);
        
        // Make a deep copy and fix any verbs missing proper English translations
        const processedVerbs = JSON.parse(JSON.stringify(verbs));
        processedVerbs.forEach(verb => {
          if (!verb.english || !verb.english.startsWith('to ')) {
            console.log(`Fixing verb English in getAllVerbs: ${verb.id} - ${verb.infinitive}`);
            verb.english = `to ${verb.infinitive || 'unknown'}`;
          }
        });
        
        return processedVerbs;
      } catch (error) {
        console.error('Error getting verbs from IndexedDB, falling back to cache:', error);
      }
    }
    
    console.log(`FrenchDataService: Returning ${dataCache.verbs?.length || 0} verbs from cache`);
    
    // Make a deep copy of the verbs
    const verbs = JSON.parse(JSON.stringify(dataCache.verbs || []));
    
    // Fix any verbs missing proper English translations
    verbs.forEach(verb => {
      if (!verb.english || !verb.english.startsWith('to ')) {
        console.log(`Fixing verb English in getAllVerbs: ${verb.id} - ${verb.infinitive}`);
        verb.english = `to ${verb.infinitive || 'unknown'}`;
      }
    });
    
    return verbs;
  }  /**
   * Get all sentences - ensures data is loaded first
   */
  static async getAllSentences() {
    if (!dataCache.initialized) {
      await this.initialize();
    }
    
    // Use IndexedDB if available, otherwise use cache
    if (indexedDBService.isInitialized) {
      try {
        // Check if we need to populate the DB with built-in sentences first
        const count = await indexedDBService.getStoreCount(STORE_SENTENCES);
        if (count === 0 && dataCache.sentences?.length > 0) {
          // Store built-in sentences to IndexedDB for persistence
          await indexedDBService.bulkAddData(STORE_SENTENCES, dataCache.sentences);
        }
        
        // Get all sentences from IndexedDB
        const sentences = await indexedDBService.getAllData(STORE_SENTENCES);
        console.log(`FrenchDataService: Returning ${sentences.length} sentences from IndexedDB`);
        return [...sentences]; // Return a copy to prevent modification
      } catch (error) {
        console.error('Error getting sentences from IndexedDB, falling back to cache:', error);
      }
    }
    
    console.log(`FrenchDataService: Returning ${dataCache.sentences?.length || 0} sentences from cache`);
    return [...(dataCache.sentences || [])]; // Return a copy to prevent modification
  }

  /**
   * Debug method to get cache status
   */
  static debugGetCacheStatus() {
    return {
      initialized: dataCache.initialized,
      userId: dataCache.userId,
      wordCount: dataCache.words?.length || 0,
      verbCount: dataCache.verbs?.length || 0,
      sentenceCount: dataCache.sentences?.length || 0,
      numberCount: dataCache.numbers?.length || 0
    };
  }  /**
   * Force refresh of data
   */
  static forceRefresh() {
    console.log("FrenchDataService: Force refreshing data...");
    // Reset initialization state
    dataCache.initialized = false;
    
    // Schedule re-initialization
    this.initialize(dataCache.userId);
    
    return {
      message: "Data refresh initiated",
      userId: dataCache.userId
    };
  }
  
  /**
   * Get the next item for practice
   * This method returns an item that the user hasn't seen before or hasn't seen in a while
   * @param {string} type - The type of content to get ('words', 'verbs', 'sentences', 'numbers')
   * @param {string} userId - User ID to track progress
   * @returns {Object} The next item for practice
   */
  static async getNextItem(type, userId = 'guest') {
    console.log(`FrenchDataService: Getting next ${type} item for user ${userId}`);
    
    try {
      let items = [];
      let seenKey = '';
      
      // Get the appropriate items and seen key based on type
      switch (type) {
        case 'words':
          items = await this.getAllWords();
          seenKey = WORDS_SEEN_KEY;
          break;
        case 'verbs':
          items = await this.getAllVerbs();
          seenKey = VERBS_SEEN_KEY;
          break;
        case 'sentences':
          items = await this.getAllSentences();
          seenKey = SENTENCES_SEEN_KEY;
          break;
        case 'numbers':
          items = await this.getAllNumbers();
          seenKey = NUMBERS_SEEN_KEY;
          break;
        default:
          console.error(`FrenchDataService: Unknown item type: ${type}`);
          return null;
      }
      
      if (!items || items.length === 0) {
        console.error(`FrenchDataService: No items available for type: ${type}`);
        return null;
      }      // Get seen items from localStorage
      const userSeenKey = `${seenKey}-${userId}`;
      const seenItemsStr = localStorage.getItem(userSeenKey) || '{}';
      let seenItems;
      
      try {
        seenItems = JSON.parse(seenItemsStr);
      } catch (error) {
        console.error('Error parsing seen items, resetting:', error);
        seenItems = {};
      }
      
      // Find an item the user hasn't seen or hasn't seen in a while
      const now = Date.now();
      const unseenItems = items.filter(item => !seenItems[item.id]);
      
      // If there are unseen items, pick a random one
      if (unseenItems.length > 0) {
        const randomIndex = Math.floor(Math.random() * unseenItems.length);
        return unseenItems[randomIndex];
      }
      
      // Otherwise, pick the least recently seen item
      let oldestSeenTime = now;
      let oldestSeenItem = items[0];
      
      items.forEach(item => {
        const lastSeen = seenItems[item.id] || 0;
        if (lastSeen < oldestSeenTime) {
          oldestSeenTime = lastSeen;
          oldestSeenItem = item;
        }
      });
      
      return oldestSeenItem;
    } catch (error) {
      console.error(`FrenchDataService: Error getting next item for ${type}:`, error);
      // Fallback: return a random item from cache
      let items = [];
      switch (type) {
        case 'words':
          items = dataCache.words || [];
          break;
        case 'verbs':
          items = dataCache.verbs || [];
          break;
        case 'sentences':
          items = dataCache.sentences || [];
          break;
        case 'numbers':
          items = dataCache.numbers || [];
          break;
      }
      
      if (items.length === 0) return null;
      
      const randomIndex = Math.floor(Math.random() * items.length);
      return items[randomIndex];
    }
  }  /**
   * Mark an item as seen by the user
   * @param {string} type - Type of content ('words', 'verbs', 'sentences', 'numbers')
   * @param {string} itemId - ID of the item
   * @param {string} userId - User ID
   */
  static markItemAsSeen(type, itemId, userId = 'guest') {
    if (!itemId) {
      console.error('FrenchDataService: Cannot mark item as seen, no itemId provided');
      return;
    }
    
    try {
      let seenKey = '';
      
      // Get the appropriate seen key based on type
      switch (type) {
        case 'words':
          seenKey = WORDS_SEEN_KEY;
          break;
        case 'verbs':
          seenKey = VERBS_SEEN_KEY;
          break;
        case 'sentences':
          seenKey = SENTENCES_SEEN_KEY;
          break;
        case 'numbers':
          seenKey = NUMBERS_SEEN_KEY;
          break;
        default:
          console.error(`FrenchDataService: Unknown item type for marking as seen: ${type}`);
          return;
      }
      
      // Get seen items from localStorage
      const userSeenKey = `${seenKey}-${userId}`;
      const seenItemsStr = localStorage.getItem(userSeenKey) || '{}';
      let seenItems;
      
      try {
        seenItems = JSON.parse(seenItemsStr);
      } catch (error) {
        console.error('Error parsing seen items, resetting:', error);
        seenItems = {};
      }
      
      // Mark the item as seen with the current timestamp
      seenItems[itemId] = Date.now();
      
      // Save back to localStorage
      localStorage.setItem(userSeenKey, JSON.stringify(seenItems));
      
      console.log(`FrenchDataService: Marked ${type} item ${itemId} as seen by user ${userId}`);
    } catch (error) {
      console.error(`FrenchDataService: Error marking item as seen:`, error);
    }
  }  /**
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
  }  /**
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

export default FrenchDataService;class FrenchDataService {
  /**
   * Initialize the service with a user ID for tracking purposes
   */
  static async initialize(userId = null) {
    console.log(`FrenchDataService: Initializing with userId ${userId}`);
    
    // If already initialized with same userId, don't reinitialize
    if (dataCache.initialized && dataCache.userId === userId) {
      console.log('FrenchDataService: Already initialized with this userId');
      return;
    }
    
    // Reset cache before initializing
    dataCache.initialized = false;
    dataCache.userId = userId;
    
    try {
      // Initialize IndexedDB service
      await indexedDBService.initialize();
      
      // Merge all content sources and prepare data
      await this.loadAllContent();
      dataCache.initialized = true;
      console.log('FrenchDataService: Successfully initialized');
      console.log(`Content loaded - Words: ${dataCache.words?.length || 0}, Verbs: ${dataCache.verbs?.length || 0}, Sentences: ${dataCache.sentences?.length || 0}`);
    } catch (error) {
      console.error('FrenchDataService: Failed to initialize', error);
      // Add fallback data for emergency cases
      this.loadFallbackContent();
    }
  }  /**
   * Load all content from data files and user storage
   */
  static async loadAllContent() {
    try {
      console.log("FrenchDataService: Starting content loading...");
      
      // 1. Load words from all sources with safe handling
      const baseWords = frenchWords || [];
      let additionalWords = [];
      let additionalNumbers = [];
      let userWords = [];
      
      try {
        additionalWords = additionalFrenchWords || [];
        console.log(`Loaded ${additionalWords.length} additional words`);
      } catch (e) {
        console.error("Failed to load additionalFrenchWords:", e);
        additionalWords = [];
      }
      
      try {
        additionalNumbers = additionalFrenchNumbers || [];
        console.log(`Loaded ${additionalNumbers.length} additional numbers`);
      } catch (e) {
        console.error("Failed to load additionalFrenchNumbers:", e);
        additionalNumbers = [];
      }
      
      try {
        // Try to get user words from IndexedDB first
        userWords = await this.getUserContent(STORE_WORDS);
        console.log(`Loaded ${userWords.length} user words from IndexedDB`);
      } catch (e) {
        console.error("Failed to load user words:", e);
        userWords = [];
      }
      
      // 2. Load verbs from all sources with safe handling
      const baseVerbs = frenchVerbs || [];
      
      // MODIFIED: Skip loading additionalFrenchVerbs as requested by user
      // Use empty array instead of additionalFrenchVerbs to prevent loading predefined verbs
      let additionalVerbs = [];
      console.log('Skipping loading predefined verbs as requested by user');
      
      let userVerbs = [];
      
      try {
        // Try to get user verbs from IndexedDB
        userVerbs = await this.getUserContent(STORE_VERBS);
        console.log(`Loaded ${userVerbs.length} user verbs from IndexedDB`);
      } catch (e) {
        console.error("Failed to load user verbs:", e);
        userVerbs = [];
      }
      
      // 3. Load sentences from all sources with safe handling
      const baseSentences = frenchSentences || [];
      let additionalSentences = [];
      let userSentences = [];
      
      try {
        additionalSentences = additionalFrenchSentences || [];
        console.log(`Loaded ${additionalSentences.length} additional sentences`);
      } catch (e) {
        console.error("Failed to load additionalFrenchSentences:", e);
        additionalSentences = [];
      }
      
      try {
        // Try to get user sentences from IndexedDB
        userSentences = await this.getUserContent(STORE_SENTENCES);
        console.log(`Loaded ${userSentences.length} user sentences from IndexedDB`);
      } catch (e) {
        console.error("Failed to load user sentences:", e);
        userSentences = [];
      }
      
      // Process number items to mark them as predefined and with category "number"
      const processedNumbers = additionalNumbers.map((number, index) => ({
        ...number,
        id: number.id || `number-${index}`, // Ensure each number has an ID
        isPredefined: true,
        category: 'number'
      }));
      
      // Check if numbers exist in IndexedDB, if not add them
      const existingNumbers = await this.getUserContent(STORE_NUMBERS);
      if (existingNumbers.length === 0 && processedNumbers.length > 0) {
        console.log(`Storing ${processedNumbers.length} numbers in IndexedDB`);
        await indexedDBService.bulkAddData(STORE_NUMBERS, processedNumbers);
      }
      
      // Store merged content in cache
      dataCache.words = this.combineAndValidateData([...baseWords, ...additionalWords, ...userWords], 'word');
      
      const verbsBeforeValidation = [...baseVerbs, ...additionalVerbs, ...userVerbs];
      console.log(`Before validation: ${verbsBeforeValidation.length} verbs total (${baseVerbs.length} base, ${additionalVerbs.length} additional, ${userVerbs.length} user)`);
      
      dataCache.verbs = this.combineAndValidateData(verbsBeforeValidation, 'verb');
      console.log(`After validation: ${dataCache.verbs.length} verbs in dataCache`);
      
      dataCache.sentences = this.combineAndValidateData([...baseSentences, ...additionalSentences, ...userSentences], 'sentence');
      
      // Get numbers from IndexedDB or use processed numbers - but avoid duplicating them
      // Only get from DB if we added them to the DB earlier, otherwise use processed numbers directly
      const numbersFromDB = existingNumbers.length > 0 ? existingNumbers : await this.getUserContent(STORE_NUMBERS);
      
      // If we have numbers in DB, use those, otherwise use our processed numbers
      dataCache.numbers = this.combineAndValidateData(
        numbersFromDB.length > 0 ? numbersFromDB : processedNumbers, 
        'number'
      );
      
      console.log(`FrenchDataService: Content loading complete. 
        Words: ${dataCache.words?.length || 0} 
        Verbs: ${dataCache.verbs?.length || 0} 
        Sentences: ${dataCache.sentences?.length || 0}
        Numbers: ${dataCache.numbers?.length || 0}`);
    } catch (e) {
      console.error("Critical error in loadAllContent:", e);
      // In case of critical failure, load fallback content
      this.loadFallbackContent();
    }
  }  /**
   * Load emergency fallback content if regular loading fails
   */
  static loadFallbackContent() {
    console.warn('FrenchDataService: Loading fallback content');
    
    dataCache.words = [
      {
        id: "fallback-w1",
        english: "hello",
        french: ["bonjour"],
        hint: "Greeting",
        explanation: "Basic greeting in French"
      },
      {
        id: "fallback-w2",
        english: "thank you",
        french: ["merci"],
        hint: "Expressing gratitude",
        explanation: "Basic way to say thanks"
      },
      {
        id: "fallback-w3",
        english: "yes",
        french: ["oui"],
        hint: "Affirmative",
        explanation: "Basic affirmation"
      }
    ];
    
    // MODIFIED: Remove predefined verbs from fallback content
    dataCache.verbs = [];
    
    dataCache.sentences = [
      {
        id: "fallback-s1",
        english: "How are you?",
        french: ["Comment allez-vous?"],
        explanation: "Formal way to ask how someone is doing"
      },
      {
        id: "fallback-s2", 
        english: "I am fine",
        french: ["Je vais bien"],
        explanation: "Simple response to how are you"
      }
    ];
    
    dataCache.numbers = [
      {
        id: "fallback-n1",
        english: "1",
        french: ["un"],
        category: "number",
        isPredefined: true
      },
      {
        id: "fallback-n2",
        english: "2",
        french: ["deux"],
        category: "number",
        isPredefined: true
      }
    ];
    
    dataCache.initialized = true;
  }  /**
   * Ensure all data items have required properties and unique IDs
   */
  static combineAndValidateData(data, type) {
    // Add unique IDs to items without IDs and ensure data integrity
    const result = data.map((item, index) => {
      if (!item.id) {
        // Create ID based on type and index if missing
        item.id = `${type}-${index}`;
      }
      return item;
    }).filter(item => {
      // Filter out invalid items based on type
      switch (type) {
        case 'word':
          return item.english && item.french;
        case 'verb':
          // Modified to be more flexible - only require infinitive for verbs
          if (!(item.infinitive && item.english && item.conjugations)) {
            console.log(`Filtering out verb with incomplete data: ${JSON.stringify({
              id: item.id,
              infinitive: item.infinitive || '(missing)',
              english: item.english || '(missing)',
              hasConjugations: !!item.conjugations
            })}`);
          }
          return item.infinitive && item.english && item.conjugations;
        case 'sentence':
          return item.english && item.french;
        default:
          return true;
      }
    });
    
    if (type === 'verb') {
      console.log(`Verb validation: ${data.length} verbs before filtering, ${result.length} after filtering`);
    }
    
    return result;
  }  /**
   * Get user-created content from IndexedDB with localStorage fallback
   */
  static async getUserContent(storeName) {
    try {
      // If IndexedDB is initialized, get data from there
      if (indexedDBService.isInitialized) {
        const data = await indexedDBService.getAllData(storeName);
        
        // MODIFIED: Filter out any predefined verbs that might still be in the database
        if (storeName === STORE_VERBS) {
          const filteredData = data.filter(verb => {
            // Filter out verbs with ID pattern "verb-N" which are the predefined verbs
            const isPredefined = verb.id && typeof verb.id === 'string' && 
                               (verb.id.startsWith('verb-') || verb.isPredefined === true);
            if (isPredefined) {
              console.log(`Filtering out predefined verb: ${verb.id} - ${verb.infinitive}`);
            }
            return !isPredefined;
          });
          console.log(`Filtered verbs: ${data.length} before, ${filteredData.length} after`);
          return filteredData || [];
        }
        
        return data || [];
      } else {
        // Fallback to localStorage for backward compatibility
        let key;
        
        switch(storeName) {
          case STORE_WORDS:
            key = USER_WORDS_KEY;
            break;
          case STORE_VERBS:
            key = USER_VERBS_KEY;
            break;
          case STORE_SENTENCES:
            key = USER_SENTENCES_KEY;
            break;
          default:
            key = `frenchmaster_${storeName}`;
        }
        
        const content = localStorage.getItem(key);
        let parsedContent = content ? JSON.parse(content) : [];
        
        // Also filter predefined verbs from localStorage if needed
        if (storeName === STORE_VERBS && Array.isArray(parsedContent)) {
          parsedContent = parsedContent.filter(verb => {
            const isPredefined = verb.id && typeof verb.id === 'string' && 
                              (verb.id.startsWith('verb-') || verb.isPredefined === true);
            return !isPredefined;
          });
        }
        
        return parsedContent;
      }
    } catch (error) {
      console.error(`FrenchDataService: Error retrieving user content for ${storeName}`, error);
      return [];
    }
  }  /**
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
  }  /**
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
  }  /**
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