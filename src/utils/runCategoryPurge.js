// runCategoryPurge.js
// A utility function to run the category purge once
import purgeCategories from '../scripts/purge-categories.js';

// Key used to track if purge has been run
const CATEGORY_PURGE_COMPLETED_KEY = 'category_purge_v1_completed';

/**
 * Checks if the category purge has been run and runs it if needed
 * Returns a promise that resolves when the purge is complete
 */
export async function runCategoryPurgeIfNeeded() {
  // Check if purge has already been run
  const purgeCompleted = localStorage.getItem(CATEGORY_PURGE_COMPLETED_KEY) === 'true';
  
  if (purgeCompleted) {
    console.log('Category purge already completed. Skipping.');
    return { alreadyRun: true };
  }
  
  console.log('Running category purge...');
  try {
    // Run the purge
    const result = await purgeCategories();
    
    if (result.success) {
      // Mark purge as complete
      localStorage.setItem(CATEGORY_PURGE_COMPLETED_KEY, 'true');
      console.log(`Category purge completed successfully. Removed ${result.deletedCategoriesCount} categories and updated ${result.updatedWordsCount} words.`);
      return { success: true, newlyRun: true, ...result };
    } else {
      console.error('Category purge failed:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error running category purge:', error);
    return { success: false, error: error.message };
  }
}