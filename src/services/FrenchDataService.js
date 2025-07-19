// FrenchDataService.js - A centralized service for all French content data
import indexedDBService from './IndexedDBService';
// Use empty arrays instead of importing the JSON files directly
const frenchWords = [];
const frenchVerbs = [];
const frenchSentences = [];
const frenchNumbers = [];

// We'll load the JSON files using fetch when needed

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
const NUMBERS_SEEN_KEY = 'french-learning-numbers-seen';

// Create a singleton instance
class FrenchDataServiceImpl {
  constructor() {
    // No need to initialize anything in constructor
  }

  // Initialize the service with a user ID for tracking purposes
  async initialize(userId = null) {
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
      
      // CRITICAL: Clean up any remaining predefined words in the database
      await this.cleanupPredefinedData();
      
      // Merge all content sources and prepare data
      await this.loadAllContent();
      dataCache.initialized = true;
      console.log('FrenchDataService: Successfully initialized');
      console.log(`Content loaded - Words: ${dataCache.words?.length || 0}, Verbs: ${dataCache.verbs?.length || 0}, Sentences: ${dataCache.sentences?.length || 0}, Numbers: ${dataCache.numbers?.length || 0}`);
    } catch (error) {
      console.error('FrenchDataService: Failed to initialize', error);
      // Add fallback data for emergency cases
      this.loadFallbackContent();
    }
  }
  
  // ADDED: Special method to clean up any predefined data in the database
  async cleanupPredefinedData() {
    if (!indexedDBService.isInitialized) {
      console.error('Cannot clean up predefined data - IndexedDB not initialized');
      return;
    }
    
    try {
      console.log('FrenchDataService: Cleaning up predefined data...');
      
      // First, clean up predefined words
      const words = await indexedDBService.getAllData(STORE_WORDS);
      let deletedCount = 0;
      
      for (const word of words) {
        // Check for any predefined word patterns
        const isPredefined = word.isPredefined === true || 
          (word.id && typeof word.id === 'string' && (
            word.id.startsWith('word-') ||
            word.id.startsWith('fallback-w')
          ));
        
        if (isPredefined) {
          console.log(`Deleting predefined word: ${word.id} - ${word.english}`);
          await indexedDBService.deleteData(STORE_WORDS, word.id);
          deletedCount++;
        }
      }
      
      console.log(`Cleaned up ${deletedCount} predefined words out of ${words.length} total words`);
      
      // Also clean other predefined data types if needed
      // This ensures all data types are handled consistently
      
      return {
        cleanedWords: deletedCount,
        totalWords: words.length
      };
    } catch (error) {
      console.error('Error cleaning up predefined data:', error);
    }
  }

  // Load all content from data files and user storage
  async loadAllContent() {
    try {
      console.log("FrenchDataService: Starting content loading...");
      
      // Only load user content from IndexedDB, not from predefined sources
      let userWords = [];
      let userVerbs = [];
      let userSentences = [];
      let userNumbers = [];
      
      try {
        // Try to get user words from IndexedDB
        userWords = await this.getUserContent(STORE_WORDS);
        console.log(`Loaded ${userWords.length} user words from IndexedDB`);
      } catch (e) {
        console.error("Failed to load user words:", e);
        userWords = [];
      }
      
      try {
        // Try to get user verbs from IndexedDB
        userVerbs = await this.getUserContent(STORE_VERBS);
        console.log(`Loaded ${userVerbs.length} user verbs from IndexedDB`);
      } catch (e) {
        console.error("Failed to load user verbs:", e);
        userVerbs = [];
      }
      
      try {
        // Try to get user sentences from IndexedDB
        userSentences = await this.getUserContent(STORE_SENTENCES);
        console.log(`Loaded ${userSentences.length} user sentences from IndexedDB`);
      } catch (e) {
        console.error("Failed to load user sentences:", e);
        userSentences = [];
      }
      
      try {
        // Try to get user numbers from IndexedDB
        userNumbers = await this.getUserContent(STORE_NUMBERS);
        console.log(`Loaded ${userNumbers.length} user numbers from IndexedDB`);
      } catch (e) {
        console.error("Failed to load user numbers:", e);
        userNumbers = [];
      }
      
      // Store user content in cache (no predefined content)
      dataCache.words = this.combineAndValidateData(userWords, 'word');
      dataCache.verbs = this.combineAndValidateData(userVerbs, 'verb');
      dataCache.sentences = this.combineAndValidateData(userSentences, 'sentence');
      dataCache.numbers = this.combineAndValidateData(userNumbers, 'number');
      
      console.log(`FrenchDataService: Content loading complete. 
        Words: ${dataCache.words?.length || 0} 
        Verbs: ${dataCache.verbs?.length || 0} 
        Sentences: ${dataCache.sentences?.length || 0}
        Numbers: ${dataCache.numbers?.length || 0}`);
    } catch (e) {
      console.error("Critical error in loadAllContent:", e);
      // In case of critical failure, load fallback content with minimal data
      this.loadFallbackContent();
    }
  }

  // Load emergency fallback content if regular loading fails
  loadFallbackContent() {
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
  }

  // Ensure all data items have required properties and unique IDs
  combineAndValidateData(data, type) {
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
  }

  // Get user-created content from IndexedDB with localStorage fallback
  // Get all verbs with option to force refresh from database
  async getVerbs(forceRefresh = false) {
    try {
      console.log(`FrenchDataService: getVerbs called with forceRefresh=${forceRefresh}`);
      if (!indexedDBService.isInitialized) {
        await indexedDBService.initialize();
      }
      
      // Use cached data if available and no force refresh is requested
      if (dataCache.verbs && !forceRefresh) {
        console.log(`FrenchDataService: Returning ${dataCache.verbs.length} verbs from cache`);
        return dataCache.verbs;
      }
      
      // If we're here, we need to get fresh data from IndexedDB
      console.log(`FrenchDataService: Getting fresh verbs data from IndexedDB`);
      const verbs = await this.getUserContent(STORE_VERBS);
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
  
  async getUserContent(storeName) {
    try {
      // If IndexedDB is initialized, get data from there
      if (indexedDBService.isInitialized) {
        const data = await indexedDBService.getAllData(storeName);
        
        // MODIFIED: Filter out any predefined items that might still be in the database
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
        else if (storeName === STORE_WORDS) {
          const filteredData = data.filter(word => {
            // Filter out words with ID pattern "word-N" which are the predefined words
            const isPredefined = word.id && typeof word.id === 'string' && 
                               (word.id.startsWith('word-') || word.isPredefined === true);
            if (isPredefined) {
              console.log(`Filtering out predefined word: ${word.id} - ${word.english}`);
            }
            return !isPredefined;
          });
          console.log(`Filtered words: ${data.length} before, ${filteredData.length} after`);
          return filteredData || [];
        }
        else if (storeName === STORE_SENTENCES) {
          const filteredData = data.filter(sentence => {
            // Filter out sentences with ID pattern "sentence-N" which are the predefined sentences
            const isPredefined = sentence.id && typeof sentence.id === 'string' && 
                               (sentence.id.startsWith('sentence-') || sentence.isPredefined === true);
            if (isPredefined) {
              console.log(`Filtering out predefined sentence: ${sentence.id} - ${sentence.english}`);
            }
            return !isPredefined;
          });
          console.log(`Filtered sentences: ${data.length} before, ${filteredData.length} after`);
          return filteredData || [];
        }
        else if (storeName === STORE_NUMBERS) {
          const filteredData = data.filter(number => {
            // Filter out numbers with ID pattern "number-N" which are the predefined numbers
            const isPredefined = number.id && typeof number.id === 'string' && 
                               (number.id.startsWith('number-') || number.isPredefined === true);
            if (isPredefined) {
              console.log(`Filtering out predefined number: ${number.id} - ${number.english}`);
            }
            return !isPredefined;
          });
          console.log(`Filtered numbers: ${data.length} before, ${filteredData.length} after`);
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
        
        // Also filter predefined items from localStorage if needed
        if (storeName === STORE_VERBS && Array.isArray(parsedContent)) {
          parsedContent = parsedContent.filter(verb => {
            const isPredefined = verb.id && typeof verb.id === 'string' && 
                              (verb.id.startsWith('verb-') || verb.isPredefined === true);
            return !isPredefined;
          });
        }
        else if (storeName === STORE_WORDS && Array.isArray(parsedContent)) {
          parsedContent = parsedContent.filter(word => {
            const isPredefined = word.id && typeof word.id === 'string' && 
                              (word.id.startsWith('word-') || word.isPredefined === true);
            return !isPredefined;
          });
        }
        else if (storeName === STORE_SENTENCES && Array.isArray(parsedContent)) {
          parsedContent = parsedContent.filter(sentence => {
            const isPredefined = sentence.id && typeof sentence.id === 'string' && 
                              (sentence.id.startsWith('sentence-') || sentence.isPredefined === true);
            return !isPredefined;
          });
        }
        else if (storeName === STORE_NUMBERS && Array.isArray(parsedContent)) {
          parsedContent = parsedContent.filter(number => {
            const isPredefined = number.id && typeof number.id === 'string' && 
                              (number.id.startsWith('number-') || number.isPredefined === true);
            return !isPredefined;
          });
        }
        
        return parsedContent;
      }
    } catch (error) {
      console.error(`FrenchDataService: Error retrieving user content for ${storeName}`, error);
      return [];
    }
  }

  // Get the next item for practice
  async getNextItem(type, userId = 'guest') {
    console.log(`FrenchDataService: Getting next ${type} item for user ${userId}`);
    
    try {
      let items = [];
      let seenKey = '';
      
      // Get the appropriate items and seen key based on type
      switch (type) {
        case 'words':
          items = await this.getAllWords();
          // Filter out numbers from words when in word practice mode
          items = items.filter(word => word.category !== 'number');
          console.log(`FrenchDataService: getNextItem filtered words count: ${items.length}`);
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
  }

  // Mark an item as seen by the user
  markItemAsSeen(type, itemId, userId = 'guest') {
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
  }

  // Get all words - ensures data is loaded first
  async getAllWords() {
    if (!dataCache.initialized) {
      await this.initialize();
    }
    
    // Use IndexedDB if available, otherwise use cache
    if (indexedDBService.isInitialized) {
      try {
        // Get all words from IndexedDB
        let words = await indexedDBService.getAllData(STORE_WORDS);
        
        // MODIFIED: Filter out any predefined words that might still be in the database
        words = words.filter(word => {
          const isPredefined = word.id && typeof word.id === 'string' && 
                             (word.id.startsWith('word-') || word.isPredefined === true);
          if (isPredefined) {
            console.log(`Filtering out predefined word: ${word.id} - ${word.english}`);
          }
          return !isPredefined;
        });
        
        console.log(`FrenchDataService: Returning ${words.length} words from IndexedDB`);
        return [...words]; // Return a copy to prevent modification
      } catch (error) {
        console.error('Error getting words from IndexedDB, falling back to cache:', error);
      }
    }
    
    console.log(`FrenchDataService: Returning ${dataCache.words?.length || 0} words from cache`);
    return [...(dataCache.words || [])]; // Return a copy to prevent modification
  }

  // Get all sentences - ensures data is loaded first
  async getAllSentences() {
    if (!dataCache.initialized) {
      await this.initialize();
    }
    
    // Use IndexedDB if available, otherwise use cache
    if (indexedDBService.isInitialized) {
      try {
        // Get all sentences from IndexedDB
        let sentences = await indexedDBService.getAllData(STORE_SENTENCES);
        
        // MODIFIED: Filter out any predefined sentences that might still be in the database
        sentences = sentences.filter(sentence => {
          const isPredefined = sentence.id && typeof sentence.id === 'string' && 
                             (sentence.id.startsWith('sentence-') || sentence.isPredefined === true);
          if (isPredefined) {
            console.log(`Filtering out predefined sentence: ${sentence.id} - ${sentence.english}`);
          }
          return !isPredefined;
        });
        
        console.log(`FrenchDataService: Returning ${sentences.length} sentences from IndexedDB`);
        return [...sentences]; // Return a copy to prevent modification
      } catch (error) {
        console.error('Error getting sentences from IndexedDB, falling back to cache:', error);
      }
    }
    
    console.log(`FrenchDataService: Returning ${dataCache.sentences?.length || 0} sentences from cache`);
    return [...(dataCache.sentences || [])]; // Return a copy to prevent modification
  }

  // Get all verbs - ensures data is loaded first
  async getAllVerbs() {
    if (!dataCache.initialized) {
      await this.initialize();
    }
    
    // Use IndexedDB if available, otherwise use cache
    if (indexedDBService.isInitialized) {
      try {
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
        return [...verbs]; // Return a copy to prevent modification
      } catch (error) {
        console.error('Error getting verbs from IndexedDB, falling back to cache:', error);
      }
    }
    
    console.log(`FrenchDataService: Returning ${dataCache.verbs?.length || 0} verbs from cache`);
    return [...(dataCache.verbs || [])]; // Return a copy to prevent modification
  }

  // Get all numbers - ensures data is loaded first
  async getAllNumbers() {
    if (!dataCache.initialized) {
      await this.initialize();
    }
    
    // Use IndexedDB if available, otherwise use cache
    if (indexedDBService.isInitialized) {
      try {
        // Get all numbers from IndexedDB
        let numbers = await indexedDBService.getAllData(STORE_NUMBERS);
        
        // MODIFIED: Filter out any predefined numbers that might still be in the database
        numbers = numbers.filter(number => {
          const isPredefined = number.id && typeof number.id === 'string' && 
                             (number.id.startsWith('number-') || number.isPredefined === true);
          if (isPredefined) {
            console.log(`Filtering out predefined number: ${number.id} - ${number.english}`);
          }
          return !isPredefined;
        });
        
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
  }

  // Debug method to get cache status - this is the critical method being called in debug.js
  debugGetCacheStatus() {
    return {
      initialized: dataCache.initialized,
      userId: dataCache.userId,
      wordCount: dataCache.words?.length || 0,
      verbCount: dataCache.verbs?.length || 0,
      sentenceCount: dataCache.sentences?.length || 0,
      numberCount: dataCache.numbers?.length || 0
    };
  }

  // Force refresh of data - this is called in debug.js
  async forceRefresh() {
    console.log("FrenchDataService: Force refreshing data...");
    // Reset initialization state
    dataCache.initialized = false;
    
    // Schedule re-initialization and await it
    await this.initialize(dataCache.userId);
    
    return {
      message: "Data refresh initiated",
      userId: dataCache.userId
    };
  }

  // Fix incorrect verb conjugations in the database
  async fixVerbConjugations() {
    if (!indexedDBService.isInitialized) {
      await indexedDBService.initialize();
    }

    try {
      console.log("FrenchDataService: Fixing verb conjugations...");
      
      // Get all verbs from IndexedDB
      const allVerbs = await indexedDBService.getAllData(STORE_VERBS);
      
      console.log(`Found ${allVerbs.length} total verbs in database`);
      
      // Define correct conjugations for common verbs
      const verbFixes = {
        'être': {
          conjugations: {
            je: ['suis'],
            tu: ['es'],
            il: ['est'],
            nous: ['sommes'],
            vous: ['êtes'],
            ils: ['sont']
          }
        },
        'avoir': {
          conjugations: {
            je: ['ai'],
            tu: ['as'],
            il: ['a'],
            nous: ['avons'],
            vous: ['avez'],
            ils: ['ont']
          }
        },
        'faire': {
          conjugations: {
            je: ['fais'],
            tu: ['fais'],
            il: ['fait'],
            nous: ['faisons'],
            vous: ['faites'],
            ils: ['font']
          }
        },
        'aller': {
          conjugations: {
            je: ['vais'],
            tu: ['vas'],
            il: ['va'],
            nous: ['allons'],
            vous: ['allez'],
            ils: ['vont']
          }
        },
        'dire': {
          conjugations: {
            je: ['dis'],
            tu: ['dis'],
            il: ['dit'],
            nous: ['disons'],
            vous: ['dites'],
            ils: ['disent']
          }
        },
        'voir': {
          conjugations: {
            je: ['vois'],
            tu: ['vois'],
            il: ['voit'],
            nous: ['voyons'],
            vous: ['voyez'],
            ils: ['voient']
          }
        },
        'pouvoir': {
          conjugations: {
            je: ['peux', 'puis'],
            tu: ['peux'],
            il: ['peut'],
            nous: ['pouvons'],
            vous: ['pouvez'],
            ils: ['peuvent']
          }
        },
        'vouloir': {
          conjugations: {
            je: ['veux'],
            tu: ['veux'],
            il: ['veut'],
            nous: ['voulons'],
            vous: ['voulez'],
            ils: ['veulent']
          }
        },
        'prendre': {
          conjugations: {
            je: ['prends'],
            tu: ['prends'],
            il: ['prend'],
            nous: ['prenons'],
            vous: ['prenez'],
            ils: ['prennent']
          }
        },
        'mettre': {
          conjugations: {
            je: ['mets'],
            tu: ['mets'],
            il: ['met'],
            nous: ['mettons'],
            vous: ['mettez'],
            ils: ['mettent']
          }
        }
      };
      
      // Count statistics
      let fixed = 0;
      let deleted = 0;
      let alreadyValid = 0;
      
      // Process each verb
      for (const verb of allVerbs) {
        // Skip if verb has no infinitive
        if (!verb.infinitive) {
          await indexedDBService.deleteData(STORE_VERBS, verb.id);
          deleted++;
          continue;
        }
        
        // Check if we have a fix for this verb
        if (verbFixes[verb.infinitive]) {
          // Apply the fix
          const correctedVerb = {
            ...verb,
            conjugations: verbFixes[verb.infinitive].conjugations
          };
          
          // Update in database
          await indexedDBService.updateData(STORE_VERBS, correctedVerb);
          fixed++;
          
          console.log(`Fixed verb: ${verb.infinitive}`);
        } else {
          // Check if verb has valid structure
          const subjects = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];
          const hasAllSubjects = subjects.every(subject => 
            verb.conjugations && 
            verb.conjugations[subject] && 
            Array.isArray(verb.conjugations[subject])
          );
          
          if (!hasAllSubjects) {
            // Delete invalid verb that we can't fix
            await indexedDBService.deleteData(STORE_VERBS, verb.id);
            deleted++;
            console.log(`Deleted invalid verb: ${verb.infinitive}`);
          } else {
            // Verb is already valid
            alreadyValid++;
          }
        }
      }
      
      // Get updated verbs count after fixes
      const updatedVerbs = await indexedDBService.getAllData(STORE_VERBS);
      
      // Force reload data in cache
      dataCache.initialized = false;
      await this.initialize();
      
      return {
        totalBefore: allVerbs.length,
        totalAfter: updatedVerbs.length,
        fixed,
        deleted,
        alreadyValid
      };
    } catch (error) {
      console.error('Error fixing verb conjugations:', error);
      throw error;
    }
  }

  // Add user word to database
  async addUserWord(wordData) {
    try {
      console.log("FrenchDataService: Adding user word:", wordData);
      if (!indexedDBService.isInitialized) {
        await indexedDBService.initialize();
      }
      
      // Ensure a category is set, default to 'general' if none provided
      if (!wordData.category || typeof wordData.category !== 'string' || !wordData.category.trim()) {
        console.log("FrenchDataService: No category provided, setting to 'general'");
        wordData.category = 'general';
      }
      
      // Clean up any categories array to maintain backward compatibility
      // but we're no longer using this field
      if (wordData.categories) {
        delete wordData.categories;
      }
      
      // Add to IndexedDB
      const result = await indexedDBService.addData(STORE_WORDS, wordData);
      
      // Update cache if successful
      if (result) {
        if (dataCache.words) {
          dataCache.words.push(wordData);
        }
      }
      
      return !!result;
    } catch (error) {
      console.error("FrenchDataService: Error adding user word:", error);
      return false;
    }
  }

  // Add user sentence to database
  async addUserSentence(sentenceData) {
    try {
      console.log("FrenchDataService: Adding user sentence:", sentenceData);
      if (!indexedDBService.isInitialized) {
        await indexedDBService.initialize();
      }
      
      // Add to IndexedDB
      const result = await indexedDBService.addData(STORE_SENTENCES, sentenceData);
      
      // Update cache if successful
      if (result) {
        if (dataCache.sentences) {
          dataCache.sentences.push(sentenceData);
        }
      }
      
      return !!result;
    } catch (error) {
      console.error("FrenchDataService: Error adding user sentence:", error);
      return false;
    }
  }

  // Add user verb to database
  async addUserVerb(verbData) {
    try {
      console.log("FrenchDataService: Adding user verb:", verbData);
      if (!indexedDBService.isInitialized) {
        await indexedDBService.initialize();
      }
      
      // Add to IndexedDB
      const result = await indexedDBService.addData(STORE_VERBS, verbData);
      
      // Update cache if successful
      if (result) {
        if (dataCache.verbs) {
          dataCache.verbs.push(verbData);
        }
      }
      
      return !!result;
    } catch (error) {
      console.error("FrenchDataService: Error adding user verb:", error);
      return false;
    }
  }

  // Update data in database
  async updateData(storeName, itemData) {
    try {
      console.log(`FrenchDataService: Updating ${storeName} item:`, JSON.stringify(itemData));
      if (!indexedDBService.isInitialized) {
        await indexedDBService.initialize();
      }
      
      // Create a deep clone of the item data to prevent mutation issues
      const safeItemData = JSON.parse(JSON.stringify(itemData));
      console.log(`FrenchDataService: Working with deep clone of data:`, safeItemData);
      
      // Ensure the item has an ID
      if (!safeItemData.id) {
        console.error(`FrenchDataService: Cannot update ${storeName} item without ID`, safeItemData);
        return false;
      }
      
      // For words, handle category consistently
      if (storeName === STORE_WORDS) {
        // Ensure a category is set, default to 'general' if none provided
        if (!safeItemData.category || typeof safeItemData.category !== 'string' || !safeItemData.category.trim()) {
          console.log("FrenchDataService: No category provided during update, setting to 'general'");
          safeItemData.category = 'general';
        }
        
        // Clean up any categories array to maintain backward compatibility
        // but we're no longer using this field
        if (safeItemData.categories) {
          delete safeItemData.categories;
        }
      }
      
      // For verbs, ensure conjugations structure is valid
      if (storeName === STORE_VERBS) {
        // Make sure conjugations is an object with required properties
        if (!safeItemData.conjugations) {
          console.log("FrenchDataService: No conjugations provided, initializing empty structure");
          safeItemData.conjugations = {
            je: [""],
            tu: [""],
            il: [""],
            nous: [""],
            vous: [""],
            ils: [""]
          };
        } else {
          // Ensure each subject has a valid array value
          ['je', 'tu', 'il', 'nous', 'vous', 'ils'].forEach(subject => {
            // If subject doesn't exist or is null/undefined, create an empty array
            if (!safeItemData.conjugations[subject]) {
              safeItemData.conjugations[subject] = [""];
            } 
            // If subject exists but is not an array, convert to array
            else if (!Array.isArray(safeItemData.conjugations[subject])) {
              console.log(`FrenchDataService: Converting ${subject} conjugation to array`);
              safeItemData.conjugations[subject] = [safeItemData.conjugations[subject]];
            }
            
            // Ensure array is not empty
            if (safeItemData.conjugations[subject].length === 0) {
              safeItemData.conjugations[subject] = [""];
            }
          });
        }
        
        // Ensure timestamps exist
        if (!safeItemData.createdAt) {
          safeItemData.createdAt = new Date().toISOString();
        }
        safeItemData.updatedAt = new Date().toISOString();
      }
      
      // Update in IndexedDB using the safe item data
      console.log(`FrenchDataService: Calling indexedDBService.updateData with item ID: ${safeItemData.id}`);
      const result = await indexedDBService.updateData(storeName, safeItemData);
      console.log(`FrenchDataService: indexedDBService.updateData result:`, result);
      
      // Update cache if successful
      if (result) {
        switch(storeName) {
          case STORE_VERBS:
            if (dataCache.verbs) {
              console.log(`FrenchDataService: Updating verb in cache with ID: ${safeItemData.id}`);
              const index = dataCache.verbs.findIndex(item => item.id === safeItemData.id);
              
              // Use deep cloning instead of shallow copy to prevent reference issues
              const deepClonedItem = JSON.parse(JSON.stringify(safeItemData));
              console.log(`FrenchDataService: Deep cloned item:`, deepClonedItem);
              
              if (index !== -1) {
                // Completely replace the object to ensure all properties are updated
                dataCache.verbs[index] = deepClonedItem;
                console.log(`FrenchDataService: Successfully updated verb in cache at index ${index}`, dataCache.verbs[index]);
              } else {
                console.log(`FrenchDataService: Verb not found in cache, adding it now`);
                dataCache.verbs.push(deepClonedItem);
              }
              
              // Force cache refresh flag
              dataCache.lastUpdate = Date.now();
            }
            break;
          case STORE_WORDS:
            if (dataCache.words) {
              console.log(`FrenchDataService: Updating word in cache with ID: ${safeItemData.id}`);
              const index = dataCache.words.findIndex(item => item.id === safeItemData.id);
              // Use deep cloning to prevent reference issues
              const deepClonedWord = JSON.parse(JSON.stringify(safeItemData));
              
              if (index !== -1) {
                dataCache.words[index] = deepClonedWord;
                console.log(`FrenchDataService: Successfully updated word in cache at index ${index}`);
              } else {
                dataCache.words.push(deepClonedWord);
                console.log(`FrenchDataService: Word not found in cache, added it now`);
              }
              
              // Force cache refresh flag for words too
              dataCache.lastUpdate = Date.now();
            }
            break;
          case STORE_SENTENCES:
            if (dataCache.sentences) {
              console.log(`FrenchDataService: Updating sentence in cache with ID: ${safeItemData.id}`);
              const index = dataCache.sentences.findIndex(item => item.id === safeItemData.id);
              // Use deep cloning to prevent reference issues
              const deepClonedSentence = JSON.parse(JSON.stringify(safeItemData));
              
              if (index !== -1) {
                dataCache.sentences[index] = deepClonedSentence;
                console.log(`FrenchDataService: Successfully updated sentence in cache at index ${index}`);
              } else {
                dataCache.sentences.push(deepClonedSentence);
                console.log(`FrenchDataService: Sentence not found in cache, added it now`);
              }
              
              // Force cache refresh flag for sentences too
              dataCache.lastUpdate = Date.now();
            }
            break;
          case STORE_NUMBERS:
            if (dataCache.numbers) {
              console.log(`FrenchDataService: Updating number in cache with ID: ${safeItemData.id}`);
              const index = dataCache.numbers.findIndex(item => item.id === safeItemData.id);
              // Use deep cloning to prevent reference issues
              const deepClonedNumber = JSON.parse(JSON.stringify(safeItemData));
              
              if (index !== -1) {
                dataCache.numbers[index] = deepClonedNumber;
                console.log(`FrenchDataService: Successfully updated number in cache at index ${index}`);
              } else {
                dataCache.numbers.push(deepClonedNumber);
                console.log(`FrenchDataService: Number not found in cache, added it now`);
              }
              
              // Force cache refresh flag for numbers too
              dataCache.lastUpdate = Date.now();
            }
            break;
        }
      }
      
      return !!result;
    } catch (error) {
      console.error(`FrenchDataService: Error updating ${storeName} item:`, error);
      return false;
    }
  }

  // Delete data from database
  async deleteData(storeName, itemId) {
    try {
      console.log(`FrenchDataService: Deleting ${storeName} item with ID:`, itemId);
      if (!indexedDBService.isInitialized) {
        await indexedDBService.initialize();
      }
      
      // Delete from IndexedDB
      const result = await indexedDBService.deleteData(storeName, itemId);
      
      // Update cache if successful
      if (result) {
        switch(storeName) {
          case STORE_WORDS:
            if (dataCache.words) {
              dataCache.words = dataCache.words.filter(item => item.id !== itemId);
            }
            break;
          case STORE_VERBS:
            if (dataCache.verbs) {
              dataCache.verbs = dataCache.verbs.filter(item => item.id !== itemId);
            }
            break;
          case STORE_SENTENCES:
            if (dataCache.sentences) {
              dataCache.sentences = dataCache.sentences.filter(item => item.id !== itemId);
            }
            break;
          case STORE_NUMBERS:
            if (dataCache.numbers) {
              dataCache.numbers = dataCache.numbers.filter(item => item.id !== itemId);
            }
            break;
        }
      }
      
      return !!result;
    } catch (error) {
      console.error(`FrenchDataService: Error deleting ${storeName} item:`, error);
      return false;
    }
  }
}

// Create singleton instance
const FrenchDataService = new FrenchDataServiceImpl();

export default FrenchDataService;