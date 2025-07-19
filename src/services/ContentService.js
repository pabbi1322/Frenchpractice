// src/services/ContentService.js
// Responsible for managing content JSON files
import indexedDBService from './IndexedDBService';

// Store names in IndexedDB
const STORE_WORDS = 'words';
const STORE_VERBS = 'verbs';
const STORE_SENTENCES = 'sentences';
const STORE_NUMBERS = 'numbers';

class ContentService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      // Make sure IndexedDB is initialized
      if (!indexedDBService.isInitialized) {
        await indexedDBService.initialize();
      }
      this.initialized = true;
    }
    return this.initialized;
  }

  // Export content to JSON file
  async exportContent(contentType) {
    try {
      await this.initialize();
      
      let storeName;
      switch (contentType.toLowerCase()) {
        case 'words':
          storeName = STORE_WORDS;
          break;
        case 'verbs':
          storeName = STORE_VERBS;
          break;
        case 'sentences':
          storeName = STORE_SENTENCES;
          break;
        case 'numbers':
          storeName = STORE_NUMBERS;
          break;
        default:
          throw new Error(`Unknown content type: ${contentType}`);
      }
      
      const content = await indexedDBService.getAllData(storeName);
      
      return {
        success: true,
        data: content,
        message: `Exported ${content.length} ${contentType} items`
      };
    } catch (error) {
      console.error(`Error exporting ${contentType}:`, error);
      return {
        success: false,
        data: [],
        message: `Failed to export ${contentType}: ${error.message}`
      };
    }
  }

  // Export all content types
  async exportAllContent() {
    try {
      await this.initialize();
      
      const words = await indexedDBService.getAllData(STORE_WORDS);
      const verbs = await indexedDBService.getAllData(STORE_VERBS);
      const sentences = await indexedDBService.getAllData(STORE_SENTENCES);
      const numbers = await indexedDBService.getAllData(STORE_NUMBERS);
      
      const allContent = {
        words,
        verbs,
        sentences,
        numbers,
        exportDate: new Date().toISOString()
      };
      
      return {
        success: true,
        data: allContent,
        message: `Exported all content: ${words.length} words, ${verbs.length} verbs, ${sentences.length} sentences, ${numbers.length} numbers`
      };
    } catch (error) {
      console.error(`Error exporting all content:`, error);
      return {
        success: false,
        data: {},
        message: `Failed to export all content: ${error.message}`
      };
    }
  }

  // Import content from JSON
  async importContent(contentType, jsonContent) {
    try {
      await this.initialize();
      
      if (!Array.isArray(jsonContent)) {
        throw new Error('Content must be an array');
      }
      
      let storeName;
      switch (contentType.toLowerCase()) {
        case 'words':
          storeName = STORE_WORDS;
          break;
        case 'verbs':
          storeName = STORE_VERBS;
          break;
        case 'sentences':
          storeName = STORE_SENTENCES;
          break;
        case 'numbers':
          storeName = STORE_NUMBERS;
          break;
        default:
          throw new Error(`Unknown content type: ${contentType}`);
      }
      
      // First clear existing content
      await indexedDBService.clearStore(storeName);
      
      // Then add new content
      const result = await indexedDBService.bulkAddData(storeName, jsonContent);
      
      return {
        success: result,
        message: result 
          ? `Successfully imported ${jsonContent.length} ${contentType} items` 
          : `Failed to import ${contentType}`
      };
    } catch (error) {
      console.error(`Error importing ${contentType}:`, error);
      return {
        success: false,
        message: `Failed to import ${contentType}: ${error.message}`
      };
    }
  }

  // Import all content from a backup
  async importAllContent(jsonBackup) {
    try {
      await this.initialize();
      
      if (!jsonBackup || typeof jsonBackup !== 'object') {
        throw new Error('Invalid backup format');
      }
      
      const { words, verbs, sentences, numbers } = jsonBackup;
      
      let results = {
        words: { success: false, count: 0 },
        verbs: { success: false, count: 0 },
        sentences: { success: false, count: 0 },
        numbers: { success: false, count: 0 }
      };
      
      // Import words if available
      if (Array.isArray(words)) {
        await indexedDBService.clearStore(STORE_WORDS);
        results.words.success = await indexedDBService.bulkAddData(STORE_WORDS, words);
        results.words.count = words.length;
      }
      
      // Import verbs if available
      if (Array.isArray(verbs)) {
        await indexedDBService.clearStore(STORE_VERBS);
        results.verbs.success = await indexedDBService.bulkAddData(STORE_VERBS, verbs);
        results.verbs.count = verbs.length;
      }
      
      // Import sentences if available
      if (Array.isArray(sentences)) {
        await indexedDBService.clearStore(STORE_SENTENCES);
        results.sentences.success = await indexedDBService.bulkAddData(STORE_SENTENCES, sentences);
        results.sentences.count = sentences.length;
      }
      
      // Import numbers if available
      if (Array.isArray(numbers)) {
        await indexedDBService.clearStore(STORE_NUMBERS);
        results.numbers.success = await indexedDBService.bulkAddData(STORE_NUMBERS, numbers);
        results.numbers.count = numbers.length;
      }
      
      // Check if any of the imports succeeded
      const anySuccess = Object.values(results).some(r => r.success);
      
      return {
        success: anySuccess,
        results,
        message: anySuccess
          ? `Successfully imported content: ${results.words.count} words, ${results.verbs.count} verbs, ${results.sentences.count} sentences, ${results.numbers.count} numbers`
          : 'Failed to import content'
      };
    } catch (error) {
      console.error('Error importing all content:', error);
      return {
        success: false,
        results: {},
        message: `Failed to import content: ${error.message}`
      };
    }
  }

  // Save exported content to a file in the content directory
  async saveContentFile(contentType, content) {
    try {
      const jsonContent = JSON.stringify(content, null, 2);
      
      // In a real environment, we would write to a file here
      // However, in the browser environment we can't directly write to files
      
      // Instead, we'll provide a downloadable JSON
      return {
        success: true,
        jsonContent,
        message: `Content prepared for ${contentType}.json`
      };
    } catch (error) {
      console.error(`Error saving content file for ${contentType}:`, error);
      return {
        success: false,
        message: `Failed to save content file: ${error.message}`
      };
    }
  }

  // Utility methods to validate specific content types
  validateWord(word) {
    return !!(word && word.english && word.french && Array.isArray(word.french));
  }
  
  validateVerb(verb) {
    return !!(verb && verb.infinitive && verb.english && verb.conjugations);
  }
  
  validateSentence(sentence) {
    return !!(sentence && sentence.english && sentence.french && Array.isArray(sentence.french));
  }
  
  validateNumber(number) {
    return !!(number && number.english && number.french && Array.isArray(number.french));
  }
  
  // Validate an entire content set
  validateContent(contentType, content) {
    if (!Array.isArray(content)) {
      return {
        valid: false,
        message: 'Content must be an array'
      };
    }
    
    let invalidItems = [];
    let validMethod;
    
    switch (contentType.toLowerCase()) {
      case 'words':
        validMethod = this.validateWord;
        break;
      case 'verbs':
        validMethod = this.validateVerb;
        break;
      case 'sentences':
        validMethod = this.validateSentence;
        break;
      case 'numbers':
        validMethod = this.validateNumber;
        break;
      default:
        return {
          valid: false,
          message: `Unknown content type: ${contentType}`
        };
    }
    
    content.forEach((item, index) => {
      if (!validMethod(item)) {
        invalidItems.push({ index, item });
      }
    });
    
    return {
      valid: invalidItems.length === 0,
      invalidItems,
      message: invalidItems.length === 0 
        ? `All ${content.length} ${contentType} items are valid` 
        : `Found ${invalidItems.length} invalid ${contentType} items`
    };
  }
}

// Create singleton
const contentService = new ContentService();
export default contentService;