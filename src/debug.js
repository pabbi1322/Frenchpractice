// Debug utility for tracing data loading issues
import FrenchDataService from './services/FrenchDataService';

console.log("Starting debug script...");

// Function to check the data loading process
export const checkDataLoading = () => {
  console.log("=== Data Loading Debug ===");
  
  // Check if data is already initialized
  const initialStatus = FrenchDataService.debugGetCacheStatus();
  console.log("Initial cache status:", initialStatus);
  
  // Force reload data
  console.log("Forcing data refresh...");
  const refreshedStatus = FrenchDataService.forceRefresh();
  console.log("After refresh:", refreshedStatus);
  
  // Get specific data counts
  try {
    const words = FrenchDataService.getAllWords();
    const verbs = FrenchDataService.getAllVerbs();
    const sentences = FrenchDataService.getAllSentences();
    const numbers = FrenchDataService.getAllNumbers();
    
    console.log(`Data counts after direct calls:
      Words: ${words.length}
      Verbs: ${verbs.length}
      Sentences: ${sentences.length}
      Numbers: ${numbers.length}
    `);
  } catch (error) {
    console.error("Error getting data counts:", error);
  }
  
  return "Debug complete";
};

// Export default for module compatibility
export default { checkDataLoading };