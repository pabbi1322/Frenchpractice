// DuplicateDetectionService.js
// A service that finds duplicate content in our French learning database

import FrenchDataService from './FrenchDataService';

class DuplicateDetectionService {
  /**
   * Find duplicate entries based on french or english content
   * @param {Array} items - The array of content items to check for duplicates
   * @param {boolean} checkFrench - Whether to check French content for duplicates
   * @param {boolean} checkEnglish - Whether to check English content for duplicates
   * @returns {Array} - Array of duplicate groups, each containing the duplicated items
   */
  static findDuplicates(items, checkFrench = true, checkEnglish = true) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return [];
    }
    
    // Map to store grouped items by their content
    const frenchMap = new Map();
    const englishMap = new Map();
    
    // Group items by their content
    items.forEach(item => {
      try {
        // Process French content (handle both array and string formats)
        if (checkFrench) {
          let frenchKey = null;
          
          if (Array.isArray(item.french)) {
            // For arrays, sort and join to create a consistent key
            frenchKey = [...item.french].sort().join('|').toLowerCase();
          } else if (typeof item.french === 'string') {
            frenchKey = item.french.toLowerCase();
          }
          
          if (frenchKey && frenchKey.trim() !== '') {
            if (!frenchMap.has(frenchKey)) {
              frenchMap.set(frenchKey, []);
            }
            frenchMap.get(frenchKey).push(item);
          }
        }
        
        // Process English content
        if (checkEnglish && item.english && typeof item.english === 'string') {
          const englishKey = item.english.toLowerCase();
          
          if (englishKey.trim() !== '') {
            if (!englishMap.has(englishKey)) {
              englishMap.set(englishKey, []);
            }
            englishMap.get(englishKey).push(item);
          }
        }
      } catch (error) {
        console.error("Error processing item for duplicate detection:", error, item);
      }
    });
    
    // Find groups with more than one item (duplicates)
    const frenchDuplicates = Array.from(frenchMap.values())
      .filter(group => group.length > 1);
      
    const englishDuplicates = Array.from(englishMap.values())
      .filter(group => group.length > 1);
      
    // Combine and deduplicate the results
    // We'll use item IDs to avoid including the same item in multiple duplicate groups
    const allDuplicates = [];
    const processedIds = new Set();
    
    // Process French duplicates first
    frenchDuplicates.forEach(group => {
      // Create a new group with items not already processed
      const newGroup = group.filter(item => !processedIds.has(item.id));
      
      // If we still have duplicates, add the group
      if (newGroup.length > 1) {
        allDuplicates.push({
          type: 'french',
          key: Array.isArray(newGroup[0].french) 
            ? newGroup[0].french.join(', ')
            : newGroup[0].french,
          items: newGroup
        });
        
        // Mark these IDs as processed
        newGroup.forEach(item => processedIds.add(item.id));
      }
    });
    
    // Then process English duplicates
    englishDuplicates.forEach(group => {
      // Create a new group with items not already processed
      const newGroup = group.filter(item => !processedIds.has(item.id));
      
      // If we still have duplicates, add the group
      if (newGroup.length > 1) {
        allDuplicates.push({
          type: 'english',
          key: newGroup[0].english,
          items: newGroup
        });
        
        // Mark these IDs as processed
        newGroup.forEach(item => processedIds.add(item.id));
      }
    });
    
    return allDuplicates;
  }
  
  /**
   * Find duplicate words
   * @returns {Promise<Array>} - Array of duplicate word groups
   */
  static async findDuplicateWords() {
    const words = await FrenchDataService.getAllWords();
    return this.findDuplicates(words);
  }
  
  /**
   * Find duplicate verbs
   * @returns {Promise<Array>} - Array of duplicate verb groups
   */
  static async findDuplicateVerbs() {
    const verbs = await FrenchDataService.getAllVerbs();
    
    // For verbs, check both english and infinitive (french version)
    const duplicates = this.findDuplicates(verbs, false, true); // Skip french array check
    
    // Also check for duplicates based on infinitive
    const infinitiveMap = new Map();
    
    verbs.forEach(verb => {
      if (verb.infinitive && typeof verb.infinitive === 'string') {
        const key = verb.infinitive.toLowerCase();
        
        if (!infinitiveMap.has(key)) {
          infinitiveMap.set(key, []);
        }
        infinitiveMap.get(key).push(verb);
      }
    });
    
    const infinitiveDuplicates = Array.from(infinitiveMap.values())
      .filter(group => group.length > 1);
      
    // Add infinitive duplicates to our results
    const processedIds = new Set(duplicates.flatMap(group => 
      group.items.map(item => item.id)));
      
    infinitiveDuplicates.forEach(group => {
      const newGroup = group.filter(item => !processedIds.has(item.id));
      
      if (newGroup.length > 1) {
        duplicates.push({
          type: 'infinitive',
          key: newGroup[0].infinitive,
          items: newGroup
        });
      }
    });
    
    return duplicates;
  }
  
  /**
   * Find duplicate sentences
   * @returns {Promise<Array>} - Array of duplicate sentence groups
   */
  static async findDuplicateSentences() {
    const sentences = await FrenchDataService.getAllSentences();
    return this.findDuplicates(sentences);
  }
  
  /**
   * Find duplicate numbers
   * @returns {Promise<Array>} - Array of duplicate number groups
   */
  static async findDuplicateNumbers() {
    const numbers = await FrenchDataService.getAllNumbers();
    return this.findDuplicates(numbers);
  }
  
  /**
   * Find all duplicates across all content types
   * @returns {Promise<Object>} - Object with duplicates by content type
   */
  static async findAllDuplicates() {
    const [wordDuplicates, verbDuplicates, sentenceDuplicates, numberDuplicates] = 
      await Promise.all([
        this.findDuplicateWords(),
        this.findDuplicateVerbs(),
        this.findDuplicateSentences(),
        this.findDuplicateNumbers()
      ]);
      
    return {
      words: wordDuplicates,
      verbs: verbDuplicates,
      sentences: sentenceDuplicates,
      numbers: numberDuplicates,
      // Summary counts
      counts: {
        words: wordDuplicates.length,
        verbs: verbDuplicates.length, 
        sentences: sentenceDuplicates.length,
        numbers: numberDuplicates.length,
        total: wordDuplicates.length + verbDuplicates.length + 
               sentenceDuplicates.length + numberDuplicates.length
      }
    };
  }
}

export default DuplicateDetectionService;