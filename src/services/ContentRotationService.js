/**
 * ContentRotationService.js
 * 
 * A service to handle content rotation for the French Learning Platform.
 * This service maintains separate arrays for seen and unseen content,
 * ensuring that users always get fresh content until everything has been seen.
 */
import WordDatabase from '../components/WordDatabase';
import VerbDatabase from '../components/VerbDatabase';
import SentenceDatabase from '../components/SentenceDatabase';

class ContentRotationService {
  constructor() {
    // Initialize storage for content tracking
    this.contentStore = {
      words: {
        seen: [],
        unseen: [],
        current: null
      },
      verbs: {
        seen: [],
        unseen: [],
        current: null
      },
      sentences: {
        seen: [],
        unseen: [],
        current: null
      }
    };

    // Create a unique key for storing rotation state in localStorage
    this.storageKey = 'french-learning-rotation-state';
  }

  /**
   * Initialize content for a specific type
   * @param {string} contentType - 'words', 'verbs', or 'sentences'
   * @param {Array} allContent - All available content of this type
   * @param {string} userId - User identifier
   */
  initializeContent(contentType, allContent, userId = 'guest') {
    console.log(`Initializing ${contentType} rotation with ${allContent.length} items for user ${userId}`);
    
    // Create a unique storage key for this user and content type
    const userKey = `${this.storageKey}_${userId}_${contentType}`;
    
    try {
      // Try to retrieve previously stored state
      const savedState = localStorage.getItem(userKey);
      
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        
        // Filter out items that may have been removed from the system
        const validSeen = parsedState.seen.filter(seenId => 
          allContent.some(item => item.id === seenId)
        );
        
        // Calculate what's unseen based on what's seen
        const unseenItems = allContent.filter(item => 
          !validSeen.includes(item.id)
        );

        this.contentStore[contentType] = {
          seen: validSeen,
          unseen: unseenItems,
          current: parsedState.current
        };
        
        console.log(`Loaded saved state for ${contentType}:`, {
          seen: this.contentStore[contentType].seen.length,
          unseen: this.contentStore[contentType].unseen.length,
          current: this.contentStore[contentType].current
        });
      } else {
        // First time initialization
        this.contentStore[contentType] = {
          seen: [],
          unseen: [...allContent], // Create a copy of the array
          current: null
        };
        console.log(`First time initialization for ${contentType} with ${allContent.length} items`);
      }
    } catch (error) {
      console.error(`Error initializing ${contentType} rotation:`, error);
      
      // Fallback to default state
      this.contentStore[contentType] = {
        seen: [],
        unseen: [...allContent],
        current: null
      };
    }
    
    // Save the initial state
    this._saveState(contentType, userId);
  }

  /**
   * Get the next item of a specific type, ensuring it's different from the current one
   * @param {string} contentType - 'words', 'verbs', or 'sentences' 
   * @param {string} userId - User identifier
   * @returns {Object} The next content item
   */
  getNextItem(contentType, userId = 'guest') {
    const store = this.contentStore[contentType];
    console.log(`Getting next ${contentType}, currently unseen: ${store.unseen.length}, seen: ${store.seen.length}`);
    
    // CRITICAL DEBUG: Log the actual content of unseen items to verify what's available
    console.log(`${contentType} UNSEEN ITEMS:`, store.unseen.map(item => ({ id: item.id, english: item.english || item.infinitive })));
    
    // FALLBACK DATA: Hard-coded items for testing if nothing else works
    const fallbackItems = {
      words: [
        { id: 'fallback-w1', english: 'cat', french: ['chat'], hint: 'A feline animal', explanation: 'A common pet' },
        { id: 'fallback-w2', english: 'dog', french: ['chien'], hint: 'A canine animal', explanation: 'A friendly pet' },
        { id: 'fallback-w3', english: 'car', french: ['voiture'], hint: 'A vehicle', explanation: 'Used for transportation' },
        { id: 'fallback-w4', english: 'house', french: ['maison'], hint: 'A dwelling', explanation: 'Where people live' },
        { id: 'fallback-w5', english: 'book', french: ['livre'], hint: 'For reading', explanation: 'Contains written content' }
      ],
      verbs: [
        { id: 'fallback-v1', infinitive: 'manger', english: 'to eat', tense: 'present', conjugations: { je: ['mange'], tu: ['manges'], il: ['mange'], nous: ['mangeons'], vous: ['mangez'], ils: ['mangent'] } },
        { id: 'fallback-v2', infinitive: 'parler', english: 'to speak', tense: 'present', conjugations: { je: ['parle'], tu: ['parles'], il: ['parle'], nous: ['parlons'], vous: ['parlez'], ils: ['parlent'] } },
        { id: 'fallback-v3', infinitive: 'lire', english: 'to read', tense: 'present', conjugations: { je: ['lis'], tu: ['lis'], il: ['lit'], nous: ['lisons'], vous: ['lisez'], ils: ['lisent'] } }
      ],
      sentences: [
        { id: 'fallback-s1', english: 'I am hungry', french: ['J\'ai faim'], explanation: 'Literally means "I have hunger"' },
        { id: 'fallback-s2', english: 'Where is the station?', french: ['Où est la gare?'], explanation: 'Asking for directions to the train station' },
        { id: 'fallback-s3', english: 'The book is on the table', french: ['Le livre est sur la table'], explanation: 'Describing the location of an object' }
      ]
    };
    
    let nextItem;
    
    // If there are no items at all, use fallback data
    if (store.unseen.length === 0 && store.seen.length === 0) {
      console.warn(`No ${contentType} available! Using fallback data...`);
      
      // Use fallback items with a simple rotation
      const fallbackArray = fallbackItems[contentType];
      
      // Use a timestamp-based index to ensure we cycle through all fallback items
      const fallbackIndex = Math.floor(Date.now() / 1000) % fallbackArray.length;
      nextItem = fallbackArray[fallbackIndex];
      
      console.log(`Selected fallback ${contentType}:`, nextItem);
      return nextItem;
    }
    
    // If there are no more unseen items, reset
    if (store.unseen.length === 0) {
      console.log(`All ${contentType} have been seen. Resetting...`);
      store.unseen = store.seen.map(id => {
        // Find the full item from allContent by reconstructing from the database
        const dbType = contentType === 'words' ? new WordDatabase() :
                       contentType === 'verbs' ? new VerbDatabase() :
                       new SentenceDatabase();
                       
        const allItems = dbType.getAllWords ? dbType.getAllWords() :
                         dbType.getAllVerbs ? dbType.getAllVerbs() :
                         dbType.getAllSentences();
                         
        return allItems.find(item => item.id === id) || fallbackItems[contentType][0];
      });
      store.seen = [];
    }
    
    // If there's still nothing after reset, use fallback
    if (store.unseen.length === 0) {
      console.warn(`No ${contentType} available after reset! Using fallback...`);
      nextItem = fallbackItems[contentType][0];
      console.log(`Selected fallback ${contentType}:`, nextItem);
      return nextItem;
    }
    
    // Remove the current item from unseen if it's there
    if (store.current) {
      const currentIndex = store.unseen.findIndex(item => item.id === store.current);
      if (currentIndex !== -1) {
        console.log(`Current ${contentType} found in unseen array, moving to seen`);
        const currentItem = store.unseen.splice(currentIndex, 1)[0];
        store.seen.push(currentItem.id);
      }
    }
    
    // Get a random item from unseen
    const randomIndex = Math.floor(Math.random() * store.unseen.length);
    nextItem = store.unseen[randomIndex];
    
    // Safety check - log the nextItem to verify it exists
    console.log(`Next ${contentType} at index ${randomIndex}:`, nextItem);
    
    // Safety check - if nextItem is undefined, use first item or fallback
    if (!nextItem) {
      console.error(`Failed to get next ${contentType} at index ${randomIndex} from array of length ${store.unseen.length}`);
      nextItem = store.unseen[0] || fallbackItems[contentType][0];
    }
    
    // Remove from unseen and mark as current (but don't add to seen yet)
    store.unseen.splice(randomIndex, 1);
    store.current = nextItem.id;
    
    // Save the updated state
    this._saveState(contentType, userId);
    
    console.log(`Selected next ${contentType}:`, nextItem);
    return nextItem;
  }

  /**
   * Mark the current item as completed and move it to the seen array
   * @param {string} contentType - 'words', 'verbs', or 'sentences'
   * @param {string} userId - User identifier 
   */
  markCurrentAsSeen(contentType, userId = 'guest') {
    const store = this.contentStore[contentType];
    if (store.current && !store.seen.includes(store.current)) {
      console.log(`Marking ${contentType} ${store.current} as seen`);
      store.seen.push(store.current);
      this._saveState(contentType, userId);
    }
  }

  /**
   * Get statistics about content rotation
   * @param {string} contentType - 'words', 'verbs', or 'sentences'
   * @returns {Object} Statistics about content rotation
   */
  getStats(contentType) {
    const store = this.contentStore[contentType];
    return {
      seen: store.seen.length,
      unseen: store.unseen.length,
      total: store.seen.length + store.unseen.length + (store.current ? 1 : 0)
    };
  }

  /**
   * Reset content rotation for a specific type
   * @param {string} contentType - 'words', 'verbs', or 'sentences'
   * @param {Array} allContent - All available content of this type 
   * @param {string} userId - User identifier
   */
  resetContent(contentType, allContent, userId = 'guest') {
    console.log(`Resetting ${contentType} rotation`);
    
    this.contentStore[contentType] = {
      seen: [],
      unseen: [...allContent],
      current: null
    };
    
    this._saveState(contentType, userId);
  }

  /**
   * Save the current state to localStorage
   * @private
   * @param {string} contentType - 'words', 'verbs', or 'sentences'
   * @param {string} userId - User identifier
   */
  _saveState(contentType, userId) {
    const userKey = `${this.storageKey}_${userId}_${contentType}`;
    const store = this.contentStore[contentType];
    
    try {
      // Only save the IDs of seen items and the current item to save space
      const stateToSave = {
        seen: store.seen,
        current: store.current
      };
      
      localStorage.setItem(userKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.error(`Error saving ${contentType} rotation state:`, error);
    }
  }
}

export default ContentRotationService;