// runCategoryMigration.js
// A utility function to run the category migration once
import migrateCategories from '../scripts/migrate-categories';

// Key used to track if migration has been run
const MIGRATION_COMPLETED_KEY = 'category_migration_v1_completed';

/**
 * Checks if the migration has been run and runs it if needed
 * Returns a promise that resolves when the migration is complete
 */
export async function runCategoryMigrationIfNeeded() {
  // Check if migration has already been run
  const migrationCompleted = localStorage.getItem(MIGRATION_COMPLETED_KEY) === 'true';
  
  if (migrationCompleted) {
    console.log('Category migration already completed. Skipping.');
    return { alreadyRun: true };
  }
  
  console.log('Running category migration...');
  try {
    // Run the migration
    const result = await migrateCategories();
    
    if (result.success) {
      // Mark migration as complete
      localStorage.setItem(MIGRATION_COMPLETED_KEY, 'true');
      console.log(`Category migration completed successfully. Updated ${result.updatedCount} words.`);
      return { success: true, newlyRun: true, ...result };
    } else {
      console.error('Category migration failed:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error running category migration:', error);
    return { success: false, error: error.message };
  }
}