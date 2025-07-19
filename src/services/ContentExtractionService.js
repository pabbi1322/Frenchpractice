// ContentExtractionService.js
// A service for extracting content from various sources including DOM, IndexedDB, and localStorage

import FrenchDataService from './FrenchDataService';
import UserContentService from './UserContentService';

/**
 * Service for extracting content from various sources
 */
class ContentExtractionService {
  /**
   * Export all content from all available sources
   * @param {Object} options - Export options
   * @param {Boolean} options.includePredefined - Whether to include predefined content
   * @param {Boolean} options.includeUserContent - Whether to include user content
   * @param {Array} options.contentTypes - Array of content types to export (words, verbs, sentences, numbers)
   * @param {Boolean} options.includeDomContent - Whether to extract content from DOM that might be missing from storage
   * @returns {Promise<Object>} - The exported data
   */
  async exportAllContent(options = {}) {
    const defaultOptions = {
      includePredefined: true,
      includeUserContent: true,
      contentTypes: ['words', 'verbs', 'sentences', 'numbers'],
      includeDomContent: true,
      format: 'json'
    };
    
    // Merge with default options
    const exportOptions = { ...defaultOptions, ...options };
    console.log('ContentExtractionService: Exporting content with options:', exportOptions);
    
    // Initialize data stores
    const allData = {
      words: [],
      verbs: [],
      sentences: [],
      numbers: []
    };
    
    const contentCounts = {
      words: 0,
      verbs: 0,
      sentences: 0,
      numbers: 0
    };
    
    try {
      // Create a merged collection from all data sources
      // 1. First collect from IndexedDB
      // 2. Then supplement with localStorage data
      // 3. Finally extract from DOM if enabled and running in browser
      
      // Process words if included
      if (exportOptions.contentTypes.includes('words')) {
        await this._extractWords(allData, contentCounts, exportOptions);
      }
      
      // Process verbs if included
      if (exportOptions.contentTypes.includes('verbs')) {
        await this._extractVerbs(allData, contentCounts, exportOptions);
      }
      
      // Process sentences if included
      if (exportOptions.contentTypes.includes('sentences')) {
        await this._extractSentences(allData, contentCounts, exportOptions);
      }
      
      // Process numbers if included
      if (exportOptions.contentTypes.includes('numbers')) {
        await this._extractNumbers(allData, contentCounts, exportOptions);
      }
      
      // Extract visible content from DOM if enabled
      if (exportOptions.includeDomContent && typeof window !== 'undefined') {
        await this._extractContentFromDOM(allData, contentCounts);
      }
      
      // Create the final backup object with enhanced metadata
      const totalItems = 
        contentCounts.words + 
        contentCounts.verbs + 
        contentCounts.sentences + 
        contentCounts.numbers;
      
      const backupData = {
        metadata: {
          exportDate: new Date().toISOString(),
          contentCounts: contentCounts,
          totalItems: totalItems,
          exportFormat: exportOptions.format,
          version: '1.1',
          exportOptions: {
            includePredefined: exportOptions.includePredefined,
            includeUserContent: exportOptions.includeUserContent,
            contentTypes: exportOptions.contentTypes,
            includeDomContent: exportOptions.includeDomContent
          }
        },
        data: allData
      };
      
      console.log('ContentExtractionService: Export complete, total items:', totalItems);
      return backupData;
      
    } catch (error) {
      console.error('ContentExtractionService: Error during content export:', error);
      throw new Error(`Failed to export content: ${error.message}`);
    }
  }
  
  /**
   * Extract words from all sources
   * @private
   */
  async _extractWords(allData, contentCounts, exportOptions) {
    const indexedDBWords = await FrenchDataService.getAllWords() || [];
    const localStorageWords = UserContentService.getUserWords() || [];
    
    // Create a map to track unique items by ID or content
    const uniqueWordsMap = new Map();
    
    // Process IndexedDB words
    for (const word of indexedDBWords) {
      const isPredefined = word.isPredefined || false;
      if ((exportOptions.includePredefined && isPredefined) || (exportOptions.includeUserContent && !isPredefined)) {
        // Use ID as the key, or generate a composite key if ID doesn't exist
        const key = word.id || `${Array.isArray(word.french) ? word.french[0] : word.french}-${word.english}`;
        uniqueWordsMap.set(key, this._normalizeWordStructure(word));
      }
    }
    
    // Process localStorage words that might be missing
    for (const word of localStorageWords) {
      const isPredefined = word.isPredefined || false;
      
      // Skip predefined content if option is off
      if (isPredefined && !exportOptions.includePredefined) continue;
      
      // Skip user content if option is off
      if (!isPredefined && !exportOptions.includeUserContent) continue;
      
      // Create a unique key for this word
      const key = word.id || `${Array.isArray(word.french) ? word.french[0] : word.french}-${word.english}`;
      
      // Only add if not already in the map
      if (!uniqueWordsMap.has(key)) {
        uniqueWordsMap.set(key, this._normalizeWordStructure(word));
      }
    }
    
    // Convert map values to array
    allData.words = Array.from(uniqueWordsMap.values());
    contentCounts.words = allData.words.length;
  }
  
  /**
   * Extract verbs from all sources
   * @private
   */
  async _extractVerbs(allData, contentCounts, exportOptions) {
    const indexedDBVerbs = await FrenchDataService.getAllVerbs() || [];
    const localStorageVerbs = UserContentService.getUserVerbs() || [];
    
    const uniqueVerbsMap = new Map();
    
    // Process IndexedDB verbs
    for (const verb of indexedDBVerbs) {
      const isPredefined = verb.isPredefined || false;
      if ((exportOptions.includePredefined && isPredefined) || (exportOptions.includeUserContent && !isPredefined)) {
        const key = verb.id || `${verb.infinitive}-${verb.english}`;
        uniqueVerbsMap.set(key, this._normalizeVerbStructure(verb));
      }
    }
    
    // Process localStorage verbs
    for (const verb of localStorageVerbs) {
      const isPredefined = verb.isPredefined || false;
      
      if (isPredefined && !exportOptions.includePredefined) continue;
      if (!isPredefined && !exportOptions.includeUserContent) continue;
      
      const key = verb.id || `${verb.infinitive}-${verb.english}`;
      
      if (!uniqueVerbsMap.has(key)) {
        uniqueVerbsMap.set(key, this._normalizeVerbStructure(verb));
      }
    }
    
    allData.verbs = Array.from(uniqueVerbsMap.values());
    contentCounts.verbs = allData.verbs.length;
  }
  
  /**
   * Extract sentences from all sources
   * @private
   */
  async _extractSentences(allData, contentCounts, exportOptions) {
    const indexedDBSentences = await FrenchDataService.getAllSentences() || [];
    const localStorageSentences = UserContentService.getUserSentences() || [];
    
    const uniqueSentencesMap = new Map();
    
    // Process IndexedDB sentences
    for (const sentence of indexedDBSentences) {
      const isPredefined = sentence.isPredefined || false;
      if ((exportOptions.includePredefined && isPredefined) || (exportOptions.includeUserContent && !isPredefined)) {
        // Handle arrays for French content
        const frenchStr = Array.isArray(sentence.french) ? sentence.french[0] : sentence.french;
        const key = sentence.id || `${frenchStr}-${sentence.english}`;
        uniqueSentencesMap.set(key, this._normalizeSentenceStructure(sentence));
      }
    }
    
    // Process localStorage sentences
    for (const sentence of localStorageSentences) {
      const isPredefined = sentence.isPredefined || false;
      
      if (isPredefined && !exportOptions.includePredefined) continue;
      if (!isPredefined && !exportOptions.includeUserContent) continue;
      
      // Handle arrays for French content
      const frenchStr = Array.isArray(sentence.french) ? sentence.french[0] : sentence.french;
      const key = sentence.id || `${frenchStr}-${sentence.english}`;
      
      if (!uniqueSentencesMap.has(key)) {
        uniqueSentencesMap.set(key, this._normalizeSentenceStructure(sentence));
      }
    }
    
    allData.sentences = Array.from(uniqueSentencesMap.values());
    contentCounts.sentences = allData.sentences.length;
  }
  
  /**
   * Extract numbers from all sources
   * @private
   */
  async _extractNumbers(allData, contentCounts, exportOptions) {
    const indexedDBNumbers = await FrenchDataService.getAllNumbers() || [];
    const localStorageNumbers = UserContentService.getUserNumbers() || [];
    
    const uniqueNumbersMap = new Map();
    
    // Process IndexedDB numbers
    for (const number of indexedDBNumbers) {
      const isPredefined = number.isPredefined || false;
      if ((exportOptions.includePredefined && isPredefined) || (exportOptions.includeUserContent && !isPredefined)) {
        // Use value as key if no ID exists
        const key = number.id || `${number.value || number.english}-${Array.isArray(number.french) ? number.french[0] : number.french}`;
        uniqueNumbersMap.set(key, this._normalizeNumberStructure(number));
      }
    }
    
    // Process localStorage numbers
    for (const number of localStorageNumbers) {
      const isPredefined = number.isPredefined || false;
      
      if (isPredefined && !exportOptions.includePredefined) continue;
      if (!isPredefined && !exportOptions.includeUserContent) continue;
      
      const key = number.id || `${number.value || number.english}-${Array.isArray(number.french) ? number.french[0] : number.french}`;
      
      if (!uniqueNumbersMap.has(key)) {
        uniqueNumbersMap.set(key, this._normalizeNumberStructure(number));
      }
    }
    
    allData.numbers = Array.from(uniqueNumbersMap.values());
    contentCounts.numbers = allData.numbers.length;
  }
  
  /**
   * Extract content directly from DOM elements
   * This is crucial for capturing content that is visible on the page but might be missing from storage
   * @private
   */
  async _extractContentFromDOM(allData, contentCounts) {
    if (typeof document === 'undefined') {
      console.log('ContentExtractionService: DOM extraction skipped - not running in browser');
      return;
    }
    
    try {
      console.log('ContentExtractionService: Extracting content from DOM');
      
      // 1. Extract words from DOM
      await this._extractWordsFromDOM(allData, contentCounts);
      
      // 2. Extract verbs from DOM
      await this._extractVerbsFromDOM(allData, contentCounts);
      
      // 3. Extract sentences from DOM
      await this._extractSentencesFromDOM(allData, contentCounts);
      
      // 4. Extract numbers from DOM
      await this._extractNumbersFromDOM(allData, contentCounts);
      
    } catch (error) {
      console.warn('ContentExtractionService: Error extracting content from DOM:', error);
    }
  }
  
  /**
   * Extract words from DOM
   * @private
   */
  async _extractWordsFromDOM(allData, contentCounts) {
    try {
      // Get all word elements from the page
      // This targets multiple possible selectors to catch different UI components
      const wordElements = document.querySelectorAll(
        '.word-item, .vocabulary-item, .word-row, [data-type="word"], tr[data-content-type="word"]'
      );
      
      console.log(`ContentExtractionService: Found ${wordElements.length} word elements in DOM`);
      
      for (const element of wordElements) {
        // Extract French and English text using various possible selectors
        let frenchText = '';
        let englishText = '';
        let categoryText = '';
        
        // Try different possible selectors for French text
        const frenchSelectors = [
          '.french-text', 
          '.french', 
          '[data-field="french"]',
          'td:first-child'
        ];
        
        // Try different possible selectors for English text
        const englishSelectors = [
          '.english-text', 
          '.english', 
          '[data-field="english"]',
          'td:nth-child(2)'
        ];
        
        // Try different possible selectors for category
        const categorySelectors = [
          '.category-badge', 
          '.category', 
          '[data-field="category"]',
          'td:nth-child(3)'
        ];
        
        // Find French text
        for (const selector of frenchSelectors) {
          const el = element.querySelector(selector);
          if (el && el.textContent) {
            frenchText = el.textContent.trim();
            break;
          }
        }
        
        // Find English text
        for (const selector of englishSelectors) {
          const el = element.querySelector(selector);
          if (el && el.textContent) {
            englishText = el.textContent.trim();
            break;
          }
        }
        
        // Find category
        for (const selector of categorySelectors) {
          const el = element.querySelector(selector);
          if (el && el.textContent) {
            categoryText = el.textContent.trim().toLowerCase();
            break;
          }
        }
        
        // If both French and English are found
        if (frenchText && englishText) {
          // Check if this word exists in our data already
          const exists = allData.words.some(word => {
            const frenchArray = Array.isArray(word.french) ? word.french : [word.french];
            return frenchArray.includes(frenchText) && word.english === englishText;
          });
          
          if (!exists) {
            // Add missing word from DOM
            console.log(`ContentExtractionService: Found and adding missing word from DOM: ${frenchText} → ${englishText} (${categoryText || 'general'})`);
            
            const newWord = {
              english: englishText,
              french: [frenchText],
              category: categoryText || "general",
              partOfSpeech: "noun",
              id: `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              createdBy: "anonymous",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isPredefined: false,
              categories: [categoryText || "general"]
            };
            
            allData.words.push(newWord);
            contentCounts.words++;
          }
        }
      }
    } catch (error) {
      console.warn('ContentExtractionService: Error extracting words from DOM:', error);
    }
  }
  
  /**
   * Extract verbs from DOM
   * @private
   */
  async _extractVerbsFromDOM(allData, contentCounts) {
    try {
      // Get all verb elements from the page
      const verbElements = document.querySelectorAll(
        '.verb-item, .verb-row, [data-type="verb"], tr[data-content-type="verb"]'
      );
      
      console.log(`ContentExtractionService: Found ${verbElements.length} verb elements in DOM`);
      
      for (const element of verbElements) {
        // Extract French infinitive and English text
        let infinitive = '';
        let englishText = '';
        let group = '';
        
        // Try different possible selectors for infinitive
        const infinitiveSelectors = [
          '.infinitive', 
          '[data-field="infinitive"]',
          'td:first-child'
        ];
        
        // Try different possible selectors for English text
        const englishSelectors = [
          '.english-text', 
          '.english', 
          '[data-field="english"]',
          'td:nth-child(2)'
        ];
        
        // Try different possible selectors for group
        const groupSelectors = [
          '.group', 
          '[data-field="group"]',
          'td:nth-child(3)'
        ];
        
        // Find infinitive
        for (const selector of infinitiveSelectors) {
          const el = element.querySelector(selector);
          if (el && el.textContent) {
            infinitive = el.textContent.trim();
            break;
          }
        }
        
        // Find English text
        for (const selector of englishSelectors) {
          const el = element.querySelector(selector);
          if (el && el.textContent) {
            englishText = el.textContent.trim();
            break;
          }
        }
        
        // Find group
        for (const selector of groupSelectors) {
          const el = element.querySelector(selector);
          if (el && el.textContent) {
            group = el.textContent.trim();
            break;
          }
        }
        
        // If both infinitive and English are found
        if (infinitive && englishText) {
          // Check if this verb exists in our data already
          const exists = allData.verbs.some(verb => 
            verb.infinitive === infinitive && verb.english === englishText
          );
          
          if (!exists) {
            // Add missing verb from DOM
            console.log(`ContentExtractionService: Found and adding missing verb from DOM: ${infinitive} → ${englishText} (group: ${group || '1'})`);
            
            const newVerb = {
              infinitive: infinitive,
              english: englishText,
              group: group || "1",
              conjugations: {
                je: [],
                tu: [],
                il: [],
                nous: [],
                vous: [],
                ils: []
              },
              tense: "present",
              id: `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              createdBy: "anonymous",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isPredefined: false
            };
            
            allData.verbs.push(newVerb);
            contentCounts.verbs++;
          }
        }
      }
    } catch (error) {
      console.warn('ContentExtractionService: Error extracting verbs from DOM:', error);
    }
  }
  
  /**
   * Extract sentences from DOM
   * @private
   */
  async _extractSentencesFromDOM(allData, contentCounts) {
    try {
      // Get all sentence elements from the page
      const sentenceElements = document.querySelectorAll(
        '.sentence-item, .sentence-row, [data-type="sentence"], tr[data-content-type="sentence"]'
      );
      
      console.log(`ContentExtractionService: Found ${sentenceElements.length} sentence elements in DOM`);
      
      for (const element of sentenceElements) {
        // Extract French and English text
        let frenchText = '';
        let englishText = '';
        
        // Try different possible selectors for French text
        const frenchSelectors = [
          '.french-text', 
          '.french', 
          '[data-field="french"]',
          'td:first-child'
        ];
        
        // Try different possible selectors for English text
        const englishSelectors = [
          '.english-text', 
          '.english', 
          '[data-field="english"]',
          'td:nth-child(2)'
        ];
        
        // Find French text
        for (const selector of frenchSelectors) {
          const el = element.querySelector(selector);
          if (el && el.textContent) {
            frenchText = el.textContent.trim();
            break;
          }
        }
        
        // Find English text
        for (const selector of englishSelectors) {
          const el = element.querySelector(selector);
          if (el && el.textContent) {
            englishText = el.textContent.trim();
            break;
          }
        }
        
        // If both French and English are found
        if (frenchText && englishText) {
          // Check if this sentence exists in our data already
          const exists = allData.sentences.some(sentence => {
            const frenchArray = Array.isArray(sentence.french) ? sentence.french : [sentence.french];
            return frenchArray.includes(frenchText) && sentence.english === englishText;
          });
          
          if (!exists) {
            // Add missing sentence from DOM
            console.log(`ContentExtractionService: Found and adding missing sentence from DOM: ${frenchText} → ${englishText}`);
            
            const newSentence = {
              english: englishText,
              french: [frenchText],
              id: `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              createdBy: "anonymous",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isPredefined: false
            };
            
            allData.sentences.push(newSentence);
            contentCounts.sentences++;
          }
        }
      }
    } catch (error) {
      console.warn('ContentExtractionService: Error extracting sentences from DOM:', error);
    }
  }
  
  /**
   * Extract numbers from DOM
   * @private
   */
  async _extractNumbersFromDOM(allData, contentCounts) {
    try {
      // Get all number elements from the page
      const numberElements = document.querySelectorAll(
        '.number-item, .number-row, [data-type="number"], tr[data-content-type="number"]'
      );
      
      console.log(`ContentExtractionService: Found ${numberElements.length} number elements in DOM`);
      
      for (const element of numberElements) {
        // Extract value and French text
        let valueText = '';
        let frenchText = '';
        
        // Try different possible selectors for value
        const valueSelectors = [
          '.value', 
          '.english', 
          '[data-field="value"]',
          '[data-field="english"]',
          'td:first-child'
        ];
        
        // Try different possible selectors for French text
        const frenchSelectors = [
          '.french-text', 
          '.french', 
          '[data-field="french"]',
          'td:nth-child(2)'
        ];
        
        // Find value text
        for (const selector of valueSelectors) {
          const el = element.querySelector(selector);
          if (el && el.textContent) {
            valueText = el.textContent.trim();
            break;
          }
        }
        
        // Find French text
        for (const selector of frenchSelectors) {
          const el = element.querySelector(selector);
          if (el && el.textContent) {
            frenchText = el.textContent.trim();
            break;
          }
        }
        
        // If both value and French are found
        if (valueText && frenchText) {
          // Check if this number exists in our data already
          const exists = allData.numbers.some(number => {
            const frenchArray = Array.isArray(number.french) ? number.french : [number.french];
            return frenchArray.includes(frenchText) && 
                  (number.value === valueText || number.english === valueText);
          });
          
          if (!exists) {
            // Add missing number from DOM
            console.log(`ContentExtractionService: Found and adding missing number from DOM: ${valueText} → ${frenchText}`);
            
            const newNumber = {
              english: valueText,
              french: [frenchText],
              category: "number",
              id: `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              createdBy: "anonymous",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isPredefined: false
            };
            
            allData.numbers.push(newNumber);
            contentCounts.numbers++;
          }
        }
      }
    } catch (error) {
      console.warn('ContentExtractionService: Error extracting numbers from DOM:', error);
    }
  }
  
  /**
   * Normalize word structure to ensure consistent format
   * @private
   */
  _normalizeWordStructure(word) {
    const normalizedWord = {
      ...word,
      id: word.id || `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: word.createdAt || new Date().toISOString(),
      updatedAt: word.updatedAt || new Date().toISOString(),
      isPredefined: word.isPredefined || false,
      createdBy: word.createdBy || 'anonymous',
      partOfSpeech: word.partOfSpeech || 'noun'
    };
    
    // Make sure french is always an array
    if (!Array.isArray(normalizedWord.french)) {
      normalizedWord.french = [normalizedWord.french];
    }
    
    // Ensure categories is an array if provided
    if (normalizedWord.category && !normalizedWord.categories) {
      normalizedWord.categories = [normalizedWord.category];
    } else if (!normalizedWord.categories) {
      normalizedWord.categories = ['general'];
    }
    
    return normalizedWord;
  }
  
  /**
   * Normalize verb structure to ensure consistent format
   * @private
   */
  _normalizeVerbStructure(verb) {
    return {
      ...verb,
      id: verb.id || `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: verb.createdAt || new Date().toISOString(),
      updatedAt: verb.updatedAt || new Date().toISOString(),
      isPredefined: verb.isPredefined || false,
      createdBy: verb.createdBy || 'anonymous',
      // Ensure conjugations structure exists
      conjugations: verb.conjugations || {
        je: [], tu: [], il: [], nous: [], vous: [], ils: []
      },
      tense: verb.tense || 'present',
      group: verb.group || '1'
    };
  }
  
  /**
   * Normalize sentence structure to ensure consistent format
   * @private
   */
  _normalizeSentenceStructure(sentence) {
    const normalizedSentence = {
      ...sentence,
      id: sentence.id || `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: sentence.createdAt || new Date().toISOString(),
      updatedAt: sentence.updatedAt || new Date().toISOString(),
      isPredefined: sentence.isPredefined || false,
      createdBy: sentence.createdBy || 'anonymous'
    };
    
    // Make sure french is always an array
    if (!Array.isArray(normalizedSentence.french)) {
      normalizedSentence.french = [normalizedSentence.french];
    }
    
    return normalizedSentence;
  }
  
  /**
   * Normalize number structure to ensure consistent format
   * @private
   */
  _normalizeNumberStructure(number) {
    const normalizedNumber = {
      ...number,
      id: number.id || `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: number.createdAt || new Date().toISOString(),
      updatedAt: number.updatedAt || new Date().toISOString(),
      isPredefined: number.isPredefined || false,
      createdBy: number.createdBy || 'anonymous',
      category: number.category || 'number'
    };
    
    // Make sure french is always an array
    if (!Array.isArray(normalizedNumber.french)) {
      normalizedNumber.french = [normalizedNumber.french];
    }
    
    return normalizedNumber;
  }
}

// Create and export a singleton instance
const contentExtractionService = new ContentExtractionService();
export default contentExtractionService;