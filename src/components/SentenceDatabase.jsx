import FrenchDataService from '../services/FrenchDataService';
import ContentTrackingService from '../services/ContentTrackingService';

class SentenceDatabase {
  constructor(userId = null) {
    this.userId = userId;  // Track which user is accessing the database
    
    // Initialize the FrenchDataService if not already initialized
    FrenchDataService.initialize(userId);
    
    // Get sentences from FrenchDataService
    this.sentences = this.getAllSentences();
    
    console.log(`SentenceDatabase: Loaded ${this.sentences.length} sentences`);
  }

  getRandomSentence() {
    // If user ID is provided, get unseen sentence if possible
    if (this.userId) {
      return this.getRandomUnseenSentence();
    }
    
    // Otherwise fall back to original behavior
    const allSentences = this.getAllSentences();
    const randomIndex = Math.floor(Math.random() * allSentences.length);
    return allSentences[randomIndex];
  }
  
  getRandomUnseenSentence() {
    // Use ContentTrackingService to get an unseen sentence
    const allSentences = this.getAllSentences();
    const sentence = ContentTrackingService.getNextUnseenContent(
      this.userId, 
      ContentTrackingService.SENTENCES_SEEN_KEY, 
      allSentences
    );
    
    // Now we explicitly mark the item as seen in FrenchPracticePage
    // instead of marking it here to avoid timing issues
    return sentence;
  }

  getAllSentences() {
    // Get all sentences from FrenchDataService which now handles combining from all sources
    return FrenchDataService.getAllSentences();
  }
  
  markSentenceAsSeen(sentenceId) {
    if (this.userId) {
      // Use FrenchDataService to mark as seen when possible
      FrenchDataService.markItemAsSeen('sentences', sentenceId, this.userId);
      
      // Also use the legacy service for compatibility
      ContentTrackingService.markContentAsSeen(
        this.userId,
        ContentTrackingService.SENTENCES_SEEN_KEY,
        sentenceId
      );
    }
  }
  
  resetUserProgress() {
    if (this.userId) {
      // Use FrenchDataService to reset progress when possible
      FrenchDataService.resetProgress('sentences', this.userId);
      
      // Also use the legacy service for compatibility
      ContentTrackingService.resetUserProgress(
        this.userId,
        ContentTrackingService.SENTENCES_SEEN_KEY
      );
    }
  }
}

export default SentenceDatabase;