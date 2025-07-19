/**
 * Service to track user progress with seen words, verbs, and sentences
 * Stores data in localStorage to persist user progress
 */
class UserProgressService {
  static STORAGE_KEYS = {
    SEEN_WORDS: 'french_learning_seen_words',
    SEEN_VERBS: 'french_learning_seen_verbs',
    SEEN_SENTENCES: 'french_learning_seen_sentences',
  };

  /**
   * Get all seen words IDs from localStorage
   * @returns {string[]} Array of seen word IDs
   */
  static getSeenWords() {
    try {
      const seenWordsJSON = localStorage.getItem(this.STORAGE_KEYS.SEEN_WORDS);
      return seenWordsJSON ? JSON.parse(seenWordsJSON) : [];
    } catch (error) {
      console.error('Error getting seen words:', error);
      return [];
    }
  }

  /**
   * Get all seen verbs IDs from localStorage
   * @returns {string[]} Array of seen verb IDs
   */
  static getSeenVerbs() {
    try {
      const seenVerbsJSON = localStorage.getItem(this.STORAGE_KEYS.SEEN_VERBS);
      return seenVerbsJSON ? JSON.parse(seenVerbsJSON) : [];
    } catch (error) {
      console.error('Error getting seen verbs:', error);
      return [];
    }
  }

  /**
   * Get all seen sentences IDs from localStorage
   * @returns {string[]} Array of seen sentence IDs
   */
  static getSeenSentences() {
    try {
      const seenSentencesJSON = localStorage.getItem(this.STORAGE_KEYS.SEEN_SENTENCES);
      return seenSentencesJSON ? JSON.parse(seenSentencesJSON) : [];
    } catch (error) {
      console.error('Error getting seen sentences:', error);
      return [];
    }
  }

  /**
   * Mark a word as seen by the user
   * @param {string} wordId - The word ID (english text)
   */
  static markWordAsSeen(wordId) {
    try {
      if (!wordId) return;
      
      const seenWords = this.getSeenWords();
      if (!seenWords.includes(wordId)) {
        seenWords.push(wordId);
        localStorage.setItem(this.STORAGE_KEYS.SEEN_WORDS, JSON.stringify(seenWords));
      }
    } catch (error) {
      console.error('Error marking word as seen:', error);
    }
  }

  /**
   * Mark a verb as seen by the user
   * @param {string} verbId - The verb ID (infinitive form)
   */
  static markVerbAsSeen(verbId) {
    try {
      if (!verbId) return;
      
      const seenVerbs = this.getSeenVerbs();
      if (!seenVerbs.includes(verbId)) {
        seenVerbs.push(verbId);
        localStorage.setItem(this.STORAGE_KEYS.SEEN_VERBS, JSON.stringify(seenVerbs));
      }
    } catch (error) {
      console.error('Error marking verb as seen:', error);
    }
  }

  /**
   * Mark a sentence as seen by the user
   * @param {string} sentenceId - The sentence ID (english text)
   */
  static markSentenceAsSeen(sentenceId) {
    try {
      if (!sentenceId) return;
      
      const seenSentences = this.getSeenSentences();
      if (!seenSentences.includes(sentenceId)) {
        seenSentences.push(sentenceId);
        localStorage.setItem(this.STORAGE_KEYS.SEEN_SENTENCES, JSON.stringify(seenSentences));
      }
    } catch (error) {
      console.error('Error marking sentence as seen:', error);
    }
  }

  /**
   * Get an unseen word from the provided array of words
   * @param {Array} allWords - Array of all available words
   * @returns {Object|null} An unseen word or null if all have been seen
   */
  static getUnseenWord(allWords) {
    if (!allWords || allWords.length === 0) return null;
    
    const seenWords = this.getSeenWords();
    const unseenWords = allWords.filter(word => !seenWords.includes(word.english));
    
    if (unseenWords.length === 0) return null;
    
    // Return a random unseen word
    const randomIndex = Math.floor(Math.random() * unseenWords.length);
    return unseenWords[randomIndex];
  }

  /**
   * Get an unseen verb from the provided array of verbs
   * @param {Array} allVerbs - Array of all available verbs
   * @returns {Object|null} An unseen verb or null if all have been seen
   */
  static getUnseenVerb(allVerbs) {
    if (!allVerbs || allVerbs.length === 0) return null;
    
    const seenVerbs = this.getSeenVerbs();
    const unseenVerbs = allVerbs.filter(verb => !seenVerbs.includes(verb.infinitive));
    
    if (unseenVerbs.length === 0) return null;
    
    // Return a random unseen verb
    const randomIndex = Math.floor(Math.random() * unseenVerbs.length);
    return unseenVerbs[randomIndex];
  }

  /**
   * Get an unseen sentence from the provided array of sentences
   * @param {Array} allSentences - Array of all available sentences
   * @returns {Object|null} An unseen sentence or null if all have been seen
   */
  static getUnseenSentence(allSentences) {
    if (!allSentences || allSentences.length === 0) return null;
    
    const seenSentences = this.getSeenSentences();
    const unseenSentences = allSentences.filter(sentence => !seenSentences.includes(sentence.english));
    
    if (unseenSentences.length === 0) return null;
    
    // Return a random unseen sentence
    const randomIndex = Math.floor(Math.random() * unseenSentences.length);
    return unseenSentences[randomIndex];
  }

  /**
   * Get progress statistics for words, verbs, and sentences
   * @param {Array} allWords - Array of all available words
   * @param {Array} allVerbs - Array of all available verbs
   * @param {Array} allSentences - Array of all available sentences
   * @returns {Object} Progress statistics
   */
  static getProgressStats(allWords, allVerbs, allSentences) {
    const seenWords = this.getSeenWords();
    const seenVerbs = this.getSeenVerbs();
    const seenSentences = this.getSeenSentences();

    return {
      words: {
        seen: seenWords.length,
        total: allWords?.length || 0
      },
      verbs: {
        seen: seenVerbs.length,
        total: allVerbs?.length || 0
      },
      sentences: {
        seen: seenSentences.length,
        total: allSentences?.length || 0
      }
    };
  }

  /**
   * Reset all progress tracking data
   */
  static resetAllProgress() {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.SEEN_WORDS);
      localStorage.removeItem(this.STORAGE_KEYS.SEEN_VERBS);
      localStorage.removeItem(this.STORAGE_KEYS.SEEN_SENTENCES);
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  }
}

export default UserProgressService;