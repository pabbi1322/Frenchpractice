import UserProgressService from './UserProgressService';
import UserContentService from './UserContentService';
import FrenchDataService from './FrenchDataService';

class FrenchContentManager {
  constructor() {
    // Initialize the content by combining default content and user-added content
    this.initializeContent();
  }

  /**
   * Initialize the content by merging default content with user-generated content
   */
  initializeContent() {
    try {
      console.log('Initializing FrenchContentManager with FrenchDataService');

      // Get default content from FrenchDataService
      this.defaultWords = FrenchDataService.getWords() || [];
      this.defaultVerbs = FrenchDataService.getVerbs() || [];
      this.defaultSentences = FrenchDataService.getSentences() || [];

      console.log('Loaded default content:', { 
        words: this.defaultWords.length, 
        verbs: this.defaultVerbs.length, 
        sentences: this.defaultSentences.length 
      });

      // Get user-added content
      this.userWords = UserContentService.getAllUserWords() || [];
      this.userVerbs = UserContentService.getAllUserVerbs() || [];
      this.userSentences = UserContentService.getAllUserSentences() || [];

      console.log('Loaded user content:', { 
        words: this.userWords.length, 
        verbs: this.userVerbs.length, 
        sentences: this.userSentences.length 
      });

      // Combine default and user content
      this.allWords = [...this.defaultWords, ...this.userWords];
      this.allVerbs = [...this.defaultVerbs, ...this.userVerbs];
      this.allSentences = [...this.defaultSentences, ...this.userSentences];

      // Add fallback items if arrays are empty
      if (this.allWords.length === 0) {
        console.warn('No words found, adding fallback word');
        this.allWords = [{
          id: "fallback-w1",
          english: "hello",
          french: ["bonjour"],
          hint: "Basic greeting",
          explanation: "The most common French greeting"
        }];
      }

      if (this.allVerbs.length === 0) {
        console.warn('No verbs found, adding fallback verb');
        this.allVerbs = [{
          id: "fallback-v1",
          infinitive: "être",
          english: "to be",
          tense: "present",
          conjugations: {
            je: ["suis"],
            tu: ["es"],
            il: ["est"],
            nous: ["sommes"],
            vous: ["êtes"],
            ils: ["sont"]
          }
        }];
      }

      if (this.allSentences.length === 0) {
        console.warn('No sentences found, adding fallback sentence');
        this.allSentences = [{
          id: "fallback-s1",
          english: "Hello, how are you?",
          french: ["Bonjour, comment allez-vous?"],
          explanation: "A common greeting in French"
        }];
      }
    } catch (error) {
      console.error('Error initializing content:', error);
      // Fallback to basic items if there's an error
      console.warn('Adding fallback content due to error');
      this.allWords = [{
        id: "error-w1",
        english: "hello",
        french: ["bonjour"],
        hint: "Basic greeting",
        explanation: "The most common French greeting"
      }];
      this.allVerbs = [{
        id: "error-v1",
        infinitive: "être",
        english: "to be",
        tense: "present",
        conjugations: {
          je: ["suis"],
          tu: ["es"],
          il: ["est"],
          nous: ["sommes"],
          vous: ["êtes"],
          ils: ["sont"]
        }
      }];
      this.allSentences = [{
        id: "error-s1",
        english: "Hello, how are you?",
        french: ["Bonjour, comment allez-vous?"],
        explanation: "A common greeting in French"
      }];
    }
  }

  /**
   * Get all available words (default + user-added)
   * @returns {Array} All words
   */
  getAllWords() {
    return this.allWords;
  }

  /**
   * Get all available verbs (default + user-added)
   * @returns {Array} All verbs
   */
  getAllVerbs() {
    return this.allVerbs;
  }

  /**
   * Get all available sentences (default + user-added)
   * @returns {Array} All sentences
   */
  getAllSentences() {
    return this.allSentences;
  }

  /**
   * Mark a word as seen by the user
   * @param {string} wordId - The word identifier (typically English text)
   */
  markWordAsSeen(wordId) {
    UserProgressService.markWordAsSeen(wordId);
  }

  /**
   * Mark a verb as seen by the user
   * @param {string} verbId - The verb identifier (typically infinitive form)
   */
  markVerbAsSeen(verbId) {
    UserProgressService.markVerbAsSeen(verbId);
  }

  /**
   * Mark a sentence as seen by the user
   * @param {string} sentenceId - The sentence identifier (typically English text)
   */
  markSentenceAsSeen(sentenceId) {
    UserProgressService.markSentenceAsSeen(sentenceId);
  }

  /**
   * Get a word for practice, prioritizing unseen words
   * @returns {Object} A word object for practice
   */
  getNextWord() {
    // Try to get an unseen word first
    const unseenWord = UserProgressService.getUnseenWord(this.allWords);
    
    if (unseenWord) {
      return unseenWord;
    }
    
    // If all words have been seen, return a random word
    return this.getRandomWord();
  }

  /**
   * Get a verb for practice, prioritizing unseen verbs
   * @returns {Object} A verb object for practice
   */
  getNextVerb() {
    // Try to get an unseen verb first
    const unseenVerb = UserProgressService.getUnseenVerb(this.allVerbs);
    
    if (unseenVerb) {
      return unseenVerb;
    }
    
    // If all verbs have been seen, return a random verb
    return this.getRandomVerb();
  }

  /**
   * Get a sentence for practice, prioritizing unseen sentences
   * @returns {Object} A sentence object for practice
   */
  getNextSentence() {
    // Try to get an unseen sentence first
    const unseenSentence = UserProgressService.getUnseenSentence(this.allSentences);
    
    if (unseenSentence) {
      return unseenSentence;
    }
    
    // If all sentences have been seen, return a random sentence
    return this.getRandomSentence();
  }

  /**
   * Get a random word from the available words
   * @returns {Object} A random word object
   */
  getRandomWord() {
    if (this.allWords.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * this.allWords.length);
    return this.allWords[randomIndex];
  }

  /**
   * Get a random verb from the available verbs
   * @returns {Object} A random verb object
   */
  getRandomVerb() {
    if (this.allVerbs.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * this.allVerbs.length);
    return this.allVerbs[randomIndex];
  }

  /**
   * Get a random sentence from the available sentences
   * @returns {Object} A random sentence object
   */
  getRandomSentence() {
    if (this.allSentences.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * this.allSentences.length);
    return this.allSentences[randomIndex];
  }

  /**
   * Get user progress statistics
   * @returns {Object} Progress statistics for words, verbs, and sentences
   */
  getUserProgress() {
    return UserProgressService.getProgressStats(
      this.allWords,
      this.allVerbs,
      this.allSentences
    );
  }

  /**
   * Reset user progress for all content
   */
  resetUserProgress() {
    UserProgressService.resetAllProgress();
  }

  /**
   * Refresh content by re-fetching user-added content
   * Call this after adding/deleting user content
   */
  refreshContent() {
    this.initializeContent();
  }
}

export default FrenchContentManager;