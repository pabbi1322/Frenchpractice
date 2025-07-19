/**
 * Service to handle user-created content (words, sentences, verbs)
 * using localStorage for persistence
 */
class UserContentService {
  // Local storage keys
  static WORDS_KEY = 'french-learning-user-words';
  static SENTENCES_KEY = 'french-learning-user-sentences';
  static VERBS_KEY = 'french-learning-user-verbs';

  /**
   * Get all user-added words
   * @returns {Array} Array of user word objects
   */
  static getUserWords() {
    try {
      const words = localStorage.getItem(this.WORDS_KEY);
      return words ? JSON.parse(words) : [];
    } catch (error) {
      console.error('Error retrieving user words:', error);
      return [];
    }
  }

  /**
   * Add a new word to user's collection
   * @param {Object} word - The word object to add 
   * @returns {Boolean} Success status
   */
  static addUserWord(word) {
    try {
      if (!word || !word.english || !word.french) {
        return false;
      }

      const words = this.getUserWords();
      
      // Check if word already exists (by English word)
      const exists = words.some(w => w.english.toLowerCase() === word.english.toLowerCase());
      if (exists) {
        return false;
      }

      // Add the new word
      words.push(word);
      localStorage.setItem(this.WORDS_KEY, JSON.stringify(words));
      return true;
    } catch (error) {
      console.error('Error adding user word:', error);
      return false;
    }
  }

  /**
   * Delete a user word by its English term
   * @param {String} english - The English word to delete
   * @returns {Boolean} Success status
   */
  static deleteUserWord(english) {
    try {
      let words = this.getUserWords();
      const initialLength = words.length;
      
      words = words.filter(w => w.english.toLowerCase() !== english.toLowerCase());
      
      if (words.length !== initialLength) {
        localStorage.setItem(this.WORDS_KEY, JSON.stringify(words));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting user word:', error);
      return false;
    }
  }

  /**
   * Update an existing user word
   * @param {String} originalEnglish - The original English word to identify the entry
   * @param {Object} updatedWord - The updated word data
   * @returns {Boolean} Success status
   */
  static updateUserWord(originalEnglish, updatedWord) {
    try {
      const words = this.getUserWords();
      const index = words.findIndex(w => 
        w.english.toLowerCase() === originalEnglish.toLowerCase()
      );
      
      if (index !== -1) {
        words[index] = updatedWord;
        localStorage.setItem(this.WORDS_KEY, JSON.stringify(words));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating user word:', error);
      return false;
    }
  }

  /**
   * Get all user-added sentences
   * @returns {Array} Array of user sentence objects
   */
  static getUserSentences() {
    try {
      const sentences = localStorage.getItem(this.SENTENCES_KEY);
      return sentences ? JSON.parse(sentences) : [];
    } catch (error) {
      console.error('Error retrieving user sentences:', error);
      return [];
    }
  }

  /**
   * Add a new sentence to user's collection
   * @param {Object} sentence - The sentence object to add
   * @returns {Boolean} Success status
   */
  static addUserSentence(sentence) {
    try {
      if (!sentence || !sentence.english || !sentence.french) {
        return false;
      }

      const sentences = this.getUserSentences();
      
      // Check if sentence already exists
      const exists = sentences.some(s => s.english.toLowerCase() === sentence.english.toLowerCase());
      if (exists) {
        return false;
      }

      sentences.push(sentence);
      localStorage.setItem(this.SENTENCES_KEY, JSON.stringify(sentences));
      return true;
    } catch (error) {
      console.error('Error adding user sentence:', error);
      return false;
    }
  }

  /**
   * Delete a user sentence by its English text
   * @param {String} english - The English sentence to delete
   * @returns {Boolean} Success status
   */
  static deleteUserSentence(english) {
    try {
      let sentences = this.getUserSentences();
      const initialLength = sentences.length;
      
      sentences = sentences.filter(s => s.english.toLowerCase() !== english.toLowerCase());
      
      if (sentences.length !== initialLength) {
        localStorage.setItem(this.SENTENCES_KEY, JSON.stringify(sentences));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting user sentence:', error);
      return false;
    }
  }

  /**
   * Update an existing user sentence
   * @param {String} originalEnglish - The original English sentence to identify the entry
   * @param {Object} updatedSentence - The updated sentence data
   * @returns {Boolean} Success status
   */
  static updateUserSentence(originalEnglish, updatedSentence) {
    try {
      const sentences = this.getUserSentences();
      const index = sentences.findIndex(s => 
        s.english.toLowerCase() === originalEnglish.toLowerCase()
      );
      
      if (index !== -1) {
        sentences[index] = updatedSentence;
        localStorage.setItem(this.SENTENCES_KEY, JSON.stringify(sentences));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating user sentence:', error);
      return false;
    }
  }

  /**
   * Get all user-added verbs
   * @returns {Array} Array of user verb objects
   */
  static getUserVerbs() {
    try {
      const verbs = localStorage.getItem(this.VERBS_KEY);
      return verbs ? JSON.parse(verbs) : [];
    } catch (error) {
      console.error('Error retrieving user verbs:', error);
      return [];
    }
  }

  /**
   * Add a new verb to user's collection
   * @param {Object} verb - The verb object to add
   * @returns {Boolean} Success status
   */
  static addUserVerb(verb) {
    try {
      if (!verb || !verb.infinitive || !verb.english || !verb.conjugations) {
        return false;
      }

      const verbs = this.getUserVerbs();
      
      // Check if verb already exists
      const exists = verbs.some(v => v.infinitive.toLowerCase() === verb.infinitive.toLowerCase());
      if (exists) {
        return false;
      }

      verbs.push(verb);
      localStorage.setItem(this.VERBS_KEY, JSON.stringify(verbs));
      return true;
    } catch (error) {
      console.error('Error adding user verb:', error);
      return false;
    }
  }

  /**
   * Delete a user verb by its infinitive form
   * @param {String} infinitive - The verb infinitive to delete
   * @returns {Boolean} Success status
   */
  static deleteUserVerb(infinitive) {
    try {
      let verbs = this.getUserVerbs();
      const initialLength = verbs.length;
      
      verbs = verbs.filter(v => v.infinitive.toLowerCase() !== infinitive.toLowerCase());
      
      if (verbs.length !== initialLength) {
        localStorage.setItem(this.VERBS_KEY, JSON.stringify(verbs));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting user verb:', error);
      return false;
    }
  }

  /**
   * Update an existing user verb
   * @param {String} originalInfinitive - The original verb infinitive to identify the entry
   * @param {Object} updatedVerb - The updated verb data
   * @returns {Boolean} Success status
   */
  static updateUserVerb(originalInfinitive, updatedVerb) {
    try {
      const verbs = this.getUserVerbs();
      const index = verbs.findIndex(v => 
        v.infinitive.toLowerCase() === originalInfinitive.toLowerCase()
      );
      
      if (index !== -1) {
        verbs[index] = updatedVerb;
        localStorage.setItem(this.VERBS_KEY, JSON.stringify(verbs));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating user verb:', error);
      return false;
    }
  }
  /**
   * Get counts of all user content types
   * @returns {Object} Object with counts of words, sentences, verbs and total
   */
  static getTotalCount() {
    const words = this.getUserWords().length;
    const sentences = this.getUserSentences().length;
    const verbs = this.getUserVerbs().length;
    const total = words + sentences + verbs;
    
    return { words, sentences, verbs, total };
  }

  /**
   * Export all user content as JSON string
   * @returns {String} JSON string of all user content
   */
  static exportUserContent() {
    const data = {
      words: this.getUserWords(),
      sentences: this.getUserSentences(),
      verbs: this.getUserVerbs()
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import content from JSON string
   * @param {String} jsonString - JSON string with content to import
   * @returns {Boolean} Success status
   */
  static importUserContent(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      
      // Validate data structure
      if (!data.words || !Array.isArray(data.words) ||
          !data.sentences || !Array.isArray(data.sentences) ||
          !data.verbs || !Array.isArray(data.verbs)) {
        return false;
      }
      
      // Import data
      localStorage.setItem(this.WORDS_KEY, JSON.stringify(data.words));
      localStorage.setItem(this.SENTENCES_KEY, JSON.stringify(data.sentences));
      localStorage.setItem(this.VERBS_KEY, JSON.stringify(data.verbs));
      
      return true;
    } catch (error) {
      console.error('Error importing content:', error);
      return false;
    }
  }
}

export default UserContentService;