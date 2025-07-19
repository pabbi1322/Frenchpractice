// src/utils/DataLoaderUtil.js
import FrenchDataService from '../services/FrenchDataService';
import indexedDBService from '../services/IndexedDBService';
import additionalFrenchWords from '../data/additionalFrenchWords';
import additionalFrenchVerbs from '../data/additionalFrenchVerbs';
import additionalFrenchSentences from '../data/additionalFrenchSentences';
import additionalFrenchNumbers from '../data/additionalFrenchNumbers';

/**
 * Force load all data into IndexedDB
 * This utility ensures all data from data files is loaded into the database
 */
export const forceLoadAllData = async () => {
  console.log('Force loading all data into IndexedDB...');
  
  try {
    // First, make sure IndexedDB is initialized
    await indexedDBService.init();
    console.log('IndexedDB initialized');
    
    // Force reinitialize the FrenchDataService to clear cache
    await FrenchDataService.initialize();
    
    // Get current counts to check if data already exists
    const wordCount = await indexedDBService.getAll('words').then(items => items.length);
    const verbCount = await indexedDBService.getAll('verbs').then(items => items.length);
    const sentenceCount = await indexedDBService.getAll('sentences').then(items => items.length);
    const numberCount = await indexedDBService.getAll('numbers').then(items => items.length);
    
    console.log(`Current counts - Words: ${wordCount}, Verbs: ${verbCount}, Sentences: ${sentenceCount}, Numbers: ${numberCount}`);
    
    // If counts are low, force load all data
    const results = {
      wordsAdded: 0,
      verbsAdded: 0,
      sentencesAdded: 0,
      numbersAdded: 0,
      errors: []
    };
    
    // Process and add words if needed
    if (wordCount < additionalFrenchWords.length) {
      console.log(`Loading ${additionalFrenchWords.length} words...`);
      
      try {
        // Process words to ensure they have all required fields
        const processedWords = additionalFrenchWords.map((word, index) => ({
          id: `word-${index}`,
          english: word.english,
          french: word.french,
          hint: word.hint || "",
          explanation: word.explanation || "",
          category: word.category || "vocabulary",
          isPredefined: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        
        // Add all words
        for (const word of processedWords) {
          try {
            await indexedDBService.add('words', word);
            results.wordsAdded++;
          } catch (err) {
            console.error(`Failed to add word ${word.id}:`, err);
            results.errors.push(`Word ${word.id}: ${err.message}`);
          }
        }
      } catch (error) {
        console.error('Error processing words:', error);
        results.errors.push(`Words processing: ${error.message}`);
      }
    }
    
    // Process and add verbs if needed
    if (verbCount < additionalFrenchVerbs.length) {
      console.log(`Loading ${additionalFrenchVerbs.length} verbs...`);
      
      try {
        // Process verbs to ensure they have all required fields
        const processedVerbs = additionalFrenchVerbs.map((verb, index) => {
          const processedVerb = { ...verb };
          
          // Ensure required fields
          if (!processedVerb.id) processedVerb.id = `verb-${index}`;
          if (!processedVerb.english || !processedVerb.english.startsWith('to ')) {
            processedVerb.english = `to ${processedVerb.infinitive || `verb_${index}`}`;
          }
          if (!processedVerb.conjugations) {
            processedVerb.conjugations = {
              je: [""],
              tu: [""],
              il: [""],
              nous: [""],
              vous: [""],
              ils: [""]
            };
          }
          
          processedVerb.isPredefined = true;
          processedVerb.createdAt = new Date().toISOString();
          processedVerb.updatedAt = new Date().toISOString();
          
          return processedVerb;
        });
        
        // Add all verbs
        for (const verb of processedVerbs) {
          try {
            await indexedDBService.add('verbs', verb);
            results.verbsAdded++;
          } catch (err) {
            console.error(`Failed to add verb ${verb.id}:`, err);
            results.errors.push(`Verb ${verb.id}: ${err.message}`);
          }
        }
      } catch (error) {
        console.error('Error processing verbs:', error);
        results.errors.push(`Verbs processing: ${error.message}`);
      }
    }
    
    // Process and add sentences if needed
    if (sentenceCount < additionalFrenchSentences.length) {
      console.log(`Loading ${additionalFrenchSentences.length} sentences...`);
      
      try {
        // Process sentences to ensure they have all required fields
        const processedSentences = additionalFrenchSentences.map((sentence, index) => ({
          id: `sentence-${index}`,
          english: sentence.english,
          french: sentence.french,
          explanation: sentence.explanation || "",
          category: sentence.category || "general",
          difficulty: sentence.difficulty || "beginner",
          isPredefined: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        
        // Add all sentences
        for (const sentence of processedSentences) {
          try {
            await indexedDBService.add('sentences', sentence);
            results.sentencesAdded++;
          } catch (err) {
            console.error(`Failed to add sentence ${sentence.id}:`, err);
            results.errors.push(`Sentence ${sentence.id}: ${err.message}`);
          }
        }
      } catch (error) {
        console.error('Error processing sentences:', error);
        results.errors.push(`Sentences processing: ${error.message}`);
      }
    }
    
    // Process and add numbers if needed
    if (numberCount < additionalFrenchNumbers.length) {
      console.log(`Loading ${additionalFrenchNumbers.length} numbers...`);
      
      try {
        // Process numbers to ensure they have all required fields
        const processedNumbers = additionalFrenchNumbers.map((number, index) => ({
          id: `number-${index}`,
          english: number.english,
          french: number.french,
          number: number.number || number.english,
          category: "number",
          isPredefined: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        
        // Add all numbers
        for (const number of processedNumbers) {
          try {
            await indexedDBService.add('numbers', number);
            results.numbersAdded++;
          } catch (err) {
            console.error(`Failed to add number ${number.id}:`, err);
            results.errors.push(`Number ${number.id}: ${err.message}`);
          }
        }
      } catch (error) {
        console.error('Error processing numbers:', error);
        results.errors.push(`Numbers processing: ${error.message}`);
      }
    }
    
    // Force refresh the FrenchDataService to update cache with new data
    await FrenchDataService.forceRefresh();
    
    console.log('Data loading complete. Results:', results);
    
    return {
      success: true,
      message: `Data loading complete. Added ${results.wordsAdded} words, ${results.verbsAdded} verbs, ${results.sentencesAdded} sentences, ${results.numbersAdded} numbers.`,
      results
    };
  } catch (error) {
    console.error('Failed to force load data:', error);
    return { 
      success: false, 
      error: error.message
    };
  }
};

/**
 * Get complete database statistics
 * More detailed than the basic stats in DatabaseStatsUtils
 */
export const getDetailedDatabaseStats = async () => {
  try {
    const stats = {
      timestamp: new Date().toISOString(),
      stores: {},
      dataFiles: {
        wordsInFile: additionalFrenchWords?.length || 0,
        verbsInFile: additionalFrenchVerbs?.length || 0,
        sentencesInFile: additionalFrenchSentences?.length || 0,
        numbersInFile: additionalFrenchNumbers?.length || 0
      },
      frenchServiceCache: FrenchDataService.debugGetCacheStatus()
    };
    
    // Get counts for each store
    const stores = ['words', 'verbs', 'sentences', 'numbers', 'users'];
    
    for (const store of stores) {
      try {
        const items = await indexedDBService.getAll(store);
        stats.stores[store] = {
          count: items?.length || 0,
          exists: true,
          sampleItems: items?.slice(0, 3) || []
        };
      } catch (error) {
        console.error(`Failed to get stats for store ${store}:`, error);
        stats.stores[store] = {
          count: 0,
          exists: false,
          error: error.message
        };
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Failed to get detailed database statistics:', error);
    return { error: error.message };
  }
};