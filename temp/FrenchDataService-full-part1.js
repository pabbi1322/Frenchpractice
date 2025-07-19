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
const NUMBERS_SEEN_KEY = 'french-learning-numbers-seen';class FrenchDataService {
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
  }