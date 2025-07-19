import FrenchDataService from '../services/FrenchDataService';
import ContentTrackingService from '../services/ContentTrackingService';
import UserContentService from '../services/UserContentService';

class WordDatabase {
  static debugLogData() {
    const allWords = FrenchDataService.getAllWords();
    console.log('Debug words:', allWords);
  }

  constructor(userId = null) {
    this.userId = userId;  // Track which user is accessing the database
    
    // Initialize the FrenchDataService if not already initialized
    FrenchDataService.initialize(userId);
    
    // For backwards compatibility, we'll keep a reference to base words
    // but these will come from FrenchDataService now
    this.baseWords = [
      {
        id: "base-w1",
        english: "house",
        french: ["maison"],
        hint: "A place where people live",
        explanation: "The French word 'maison' is feminine, so it uses 'la maison'. Don't confuse it with 'chez' which means 'at someone's house'."
      },
      {
        id: "base-w2",
        english: "car",
        french: ["voiture"],
        hint: "A vehicle with four wheels",
        explanation: "The French word 'voiture' is feminine, so it uses 'la voiture'."
      },
      {
        id: "base-w3",
        english: "book",
        french: ["livre"],
        hint: "Something you read",
        explanation: "The French word 'livre' is masculine, so it uses 'le livre'."
      },
      {
        id: "base-w4",
        english: "computer",
        french: ["ordinateur"],
        hint: "Electronic device for processing information",
        explanation: "The French word 'ordinateur' is masculine, so it uses 'l'ordinateur'."
      },
      {
        id: "base-w5",
        english: "friend",
        french: ["ami", "amie"],
        hint: "A person you like and trust",
        explanation: "'Ami' is masculine, 'amie' is feminine. Use 'mon ami' (male) or 'mon amie' (female)."
      }
    ];
    
    // Initialize empty extended words array for backwards compatibility
    this.extendedWords = [];
    
    // Get all words from FrenchDataService that are not in baseWords
    const allWords = FrenchDataService.getAllWords();
    this.additionalWords = allWords.filter(word => 
      !this.baseWords.some(baseWord => baseWord.id === word.id)
    );
    
    console.log(`WordDatabase initialized with ${this.baseWords.length} base words, ${this.additionalWords.length} additional words, and ${this.extendedWords.length} extended words`);
  }

  getRandomWord() {
    // If user ID is provided, get unseen word if possible
    if (this.userId) {
      return this.getRandomUnseenWord();
    }
    
    // Otherwise fall back to original behavior
    const allWords = this.getAllWords();
    const randomIndex = Math.floor(Math.random() * allWords.length);
    return allWords[randomIndex];
  }
  
  getRandomUnseenWord() {
    // Use ContentTrackingService to get an unseen word
    const allWords = this.getAllWords();
    console.log(`Getting random unseen word from ${allWords.length} total words`);
    
    // First try using FrenchDataService's method
    const word = FrenchDataService.getNextItem('words', this.userId);
    
    if (word) {
      return word;
    }
    
    // Fall back to ContentTrackingService
    return ContentTrackingService.getNextUnseenContent(
      this.userId, 
      ContentTrackingService.WORDS_SEEN_KEY, 
      allWords
    );
  }

  getAllWords() {
    // Get all words from FrenchDataService
    const allServiceWords = FrenchDataService.getAllWords();
    
    // Also get user words from UserContentService for backwards compatibility
    const userWords = UserContentService.getUserWords() || [];
    
    // Combine and deduplicate by ID
    const combinedWords = [...allServiceWords, ...userWords];
    const uniqueWords = Array.from(
      new Map(combinedWords.map(word => [word.id || word.english, word])).values()
    );
    
    console.log(`WordDatabase.getAllWords(): Retrieved ${uniqueWords.length} words total`);
    return uniqueWords;
  }
  
  getWordByEnglish(englishWord) {
    const allWords = this.getAllWords();
    return allWords.find(word => word.english.toLowerCase() === englishWord.toLowerCase());
  }
  
  markWordAsSeen(wordId) {
    if (this.userId) {
      // Use FrenchDataService to mark as seen
      FrenchDataService.markItemAsSeen('words', wordId, this.userId);
      
      // Also use ContentTrackingService for backwards compatibility
      ContentTrackingService.markContentAsSeen(
        this.userId,
        ContentTrackingService.WORDS_SEEN_KEY,
        wordId
      );
    }
  }
  
  resetUserProgress() {
    if (this.userId) {
      // Use FrenchDataService to reset progress
      FrenchDataService.resetProgress('words', this.userId);
      
      // Also use ContentTrackingService for backwards compatibility
      ContentTrackingService.resetUserProgress(
        this.userId,
        ContentTrackingService.WORDS_SEEN_KEY
      );
    }
  }
}

export default WordDatabase;