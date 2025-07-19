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
const NUMBERS_SEEN_KEY = 'french-learning-numbers-seen';