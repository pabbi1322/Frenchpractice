// migrate-categories.js
// A utility script to migrate existing word categories to the new system
import indexedDBService from '../services/IndexedDBService';

const STORE_WORDS = 'words';
const STORE_WORD_CATEGORIES = 'wordCategories';

/**
 * Migrates existing words to use the new category system
 * Words with old categories will keep them, but new words will use either "general" or "vocabulary"
 */
async function migrateCategories() {
  console.log('Starting category migration...');
  
  try {
    // Initialize IndexedDB
    await indexedDBService.initialize();
    
    // Get all existing words
    const words = await indexedDBService.getAllData(STORE_WORDS);
    console.log(`Found ${words.length} words to check for migration`);
    
    // Get all existing categories from the database
    const existingCategories = await indexedDBService.getAllData(STORE_WORD_CATEGORIES);
    console.log(`Found ${existingCategories.length} categories`);
    
    // Set of existing category IDs to check against
    const existingCategoryIds = new Set(existingCategories.map(cat => cat.id));
    
    // Check if we have our new required categories
    const hasGeneral = existingCategoryIds.has('general');
    const hasVocabulary = existingCategoryIds.has('vocabulary');
    
    // Add missing required categories
    const categoriesToAdd = [];
    if (!hasGeneral) {
      categoriesToAdd.push({ id: 'general', name: 'General', color: 'bg-gray-700' });
    }
    if (!hasVocabulary) {
      categoriesToAdd.push({ id: 'vocabulary', name: 'Vocabulary', color: 'bg-purple-700' });
    }
    
    // Add any missing categories
    for (const category of categoriesToAdd) {
      await indexedDBService.addData(STORE_WORD_CATEGORIES, category);
      console.log(`Added missing category: ${category.name}`);
    }
    
    // Update words that need migration
    let updatedCount = 0;
    for (const word of words) {
      let needsUpdate = false;
      
      // Convert old multi-category array to single category if needed
      if (Array.isArray(word.categories) && word.categories.length > 0 && !word.category) {
        // Take the first category from the array as the primary one
        word.category = word.categories[0];
        needsUpdate = true;
      }
      
      // If the word has no category at all, assign "general" as default
      if (!word.category && !word.categories) {
        word.category = 'general';
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await indexedDBService.updateData(STORE_WORDS, word);
        updatedCount++;
      }
    }
    
    console.log(`Migration complete! Updated ${updatedCount} words`);
    return { success: true, updatedCount };
    
  } catch (error) {
    console.error('Error during category migration:', error);
    return { success: false, error: error.message };
  }
}

export default migrateCategories;