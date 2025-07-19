import FrenchDataService from '../services/FrenchDataService';
import ContentTrackingService from '../services/ContentTrackingService';
import UserContentService from '../services/UserContentService';

class VerbDatabase {
  constructor(userId = null) {
    this.userId = userId;  // Track which user is accessing the database
    
    // Initialize the FrenchDataService if not already initialized
    FrenchDataService.initialize(userId);
    console.log('VerbDatabase: FrenchDataService debug status:', FrenchDataService.debugGetCacheStatus());
    
    // For backwards compatibility, we'll keep a reference to base verbs
    this.baseVerbs = [
      {
        id: "base-v1",
        infinitive: 'être',
        english: 'to be',
        tense: 'present',
        conjugations: {
          je: ['suis'],
          tu: ['es'],
          il: ['est'],
          nous: ['sommes'],
          vous: ['êtes'],
          ils: ['sont']
        }
      },
      {
        id: "base-v2",
        infinitive: 'avoir',
        english: 'to have',
        tense: 'present',
        conjugations: {
          je: ['ai'],
          tu: ['as'],
          il: ['a'],
          nous: ['avons'],
          vous: ['avez'],
          ils: ['ont']
        }
      },
      {
        id: "base-v3",
        infinitive: 'aller',
        english: 'to go',
        tense: 'present',
        conjugations: {
          je: ['vais'],
          tu: ['vas'],
          il: ['va'],
          nous: ['allons'],
          vous: ['allez'],
          ils: ['vont']
        }
      }
    ];
    
    // Get all verbs from FrenchDataService that are not in baseVerbs
    const allVerbs = FrenchDataService.getAllVerbs();
    
    // For backwards compatibility, maintain these arrays
    this.extendedVerbs = [];
    this.additionalVerbs = allVerbs.filter(verb => 
      !this.baseVerbs.some(baseVerb => baseVerb.id === verb.id)
    );
    
    console.log(`VerbDatabase initialized with ${this.baseVerbs.length} base verbs, ${this.additionalVerbs.length} additional verbs, and ${this.extendedVerbs.length} extended verbs`);
  }

  getRandomVerb() {
    // If user ID is provided, get unseen verb if possible
    if (this.userId) {
      return this.getRandomUnseenVerb();
    }
    
    // Otherwise fall back to original behavior
    const allVerbs = this.getAllVerbs();
    const randomIndex = Math.floor(Math.random() * allVerbs.length);
    return allVerbs[randomIndex];
  }
  
  getRandomUnseenVerb() {
    // Use ContentTrackingService to get an unseen verb
    const allVerbs = this.getAllVerbs();
    console.log(`Getting random unseen verb from ${allVerbs.length} total verbs`);
    
    // First try using FrenchDataService's method
    const verb = FrenchDataService.getNextItem('verbs', this.userId);
    
    if (verb) {
      return verb;
    }
    
    // Fall back to ContentTrackingService
    return ContentTrackingService.getNextUnseenContent(
      this.userId, 
      ContentTrackingService.VERBS_SEEN_KEY, 
      allVerbs
    );
  }

  getAllVerbs() {
    // Get all verbs from FrenchDataService
    const allServiceVerbs = FrenchDataService.getAllVerbs();
    
    // Also get user verbs from UserContentService for backwards compatibility
    const userVerbs = UserContentService.getUserVerbs() || [];
    
    // Combine and deduplicate by ID
    const combinedVerbs = [...allServiceVerbs, ...userVerbs];
    const uniqueVerbs = Array.from(
      new Map(combinedVerbs.map(verb => [verb.id || verb.infinitive, verb])).values()
    );
    
    console.log(`VerbDatabase.getAllVerbs(): Retrieved ${uniqueVerbs.length} verbs total`);
    return uniqueVerbs;
  }
  
  markVerbAsSeen(verbId) {
    if (this.userId) {
      // Use FrenchDataService to mark as seen
      FrenchDataService.markItemAsSeen('verbs', verbId, this.userId);
      
      // Also use ContentTrackingService for backwards compatibility
      ContentTrackingService.markContentAsSeen(
        this.userId,
        ContentTrackingService.VERBS_SEEN_KEY,
        verbId
      );
    }
  }
  
  resetUserProgress() {
    if (this.userId) {
      // Use FrenchDataService to reset progress
      FrenchDataService.resetProgress('verbs', this.userId);
      
      // Also use ContentTrackingService for backwards compatibility
      ContentTrackingService.resetUserProgress(
        this.userId,
        ContentTrackingService.VERBS_SEEN_KEY
      );
    }
  }
}

export default VerbDatabase;