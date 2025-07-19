// purge-categories.js
// Script to remove all categories except 'general' and 'vocabulary'
// and migrate all words to use only these categories
import indexedDBService from '../services/IndexedDBService';

// Store names
const STORE_WORD_CATEGORIES = 'wordCategories';
const STORE_WORDS = 'words';

// Allowed categories
const ALLOWED_CATEGORIES = ['general', 'vocabulary'];

/**
 * Purge all categories except the allowed ones
 */
async function purgeCategories() {
  try {
    console.log('Purging categories...');
    
    // Initialize IndexedDB
    await indexedDBService.initialize();
    
    // Get all categories
    const categories = await indexedDBService.getAllData(STORE_WORD_CATEGORIES);
    console.log(`Found ${categories.length} categories in database`);
    
    // Filter out categories to keep
    const categoriesToRemove = categories.filter(cat => 
      !ALLOWED_CATEGORIES.includes(cat.id) && cat.id !== 'general' && cat.id !== 'vocabulary'
    );
    
    console.log(`Will remove ${categoriesToRemove.length} categories`);
    
    // Delete categories
    let deletedCount = 0;
    for (const category of categoriesToRemove) {
      try {
        await indexedDBService.deleteData(STORE_WORD_CATEGORIES, category.id);
        deletedCount++;
        console.log(`Deleted category: ${category.id} (${category.name})`);
      } catch (err) {
        console.error(`Failed to delete category ${category.id}:`, err);
      }
    }
    
    console.log(`Successfully deleted ${deletedCount} categories`);
    
    // Now update all words to use only allowed categories
    const words = await indexedDBService.getAllData(STORE_WORDS);
    console.log(`Found ${words.length} words in database`);
    
    let updatedCount = 0;
    for (const word of words) {
      let needsUpdate = false;
      
      // Handle string category (old format)
      if (typeof word.category === 'string' && !ALLOWED_CATEGORIES.includes(word.category)) {
        word.category = 'general';
        needsUpdate = true;
      }
      
      // Handle array of categories (new format)
      if (Array.isArray(word.categories)) {
        // If no allowed categories are present, set to general
        if (!word.categories.some(cat => ALLOWED_CATEGORIES.includes(cat))) {
          word.categories = ['general'];
          needsUpdate = true;
        }
        // Otherwise filter to keep only allowed categories
        else if (word.categories.some(cat => !ALLOWED_CATEGORIES.includes(cat))) {
          word.categories = word.categories.filter(cat => ALLOWED_CATEGORIES.includes(cat));
          needsUpdate = true;
        }
      } else if (word.categories === undefined || word.categories === null) {
        // If no categories field at all, add it
        word.categories = ['general'];
        needsUpdate = true;
      }
      
      // Update word if needed
      if (needsUpdate) {
        try {
          await indexedDBService.updateData(STORE_WORDS, word);
          updatedCount++;
        } catch (err) {
          console.error(`Failed to update word ${word.id}:`, err);
        }
      }
    }
    
    console.log(`Updated ${updatedCount} words to use allowed categories`);
    
    return {
      success: true,
      deletedCategoriesCount: deletedCount,
      updatedWordsCount: updatedCount
    };
  } catch (error) {
    console.error('Error during category purge:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export the function
export default purgeCategories;