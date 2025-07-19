  /**
   * Load emergency fallback content if regular loading fails
   */
  static loadFallbackContent() {
    console.warn('FrenchDataService: Loading fallback content');
    
    dataCache.words = [
      {
        id: "fallback-w1",
        english: "hello",
        french: ["bonjour"],
        hint: "Greeting",
        explanation: "Basic greeting in French"
      },
      {
        id: "fallback-w2",
        english: "thank you",
        french: ["merci"],
        hint: "Expressing gratitude",
        explanation: "Basic way to say thanks"
      },
      {
        id: "fallback-w3",
        english: "yes",
        french: ["oui"],
        hint: "Affirmative",
        explanation: "Basic affirmation"
      }
    ];
    
    // MODIFIED: Remove predefined verbs from fallback content
    dataCache.verbs = [];
    
    dataCache.sentences = [
      {
        id: "fallback-s1",
        english: "How are you?",
        french: ["Comment allez-vous?"],
        explanation: "Formal way to ask how someone is doing"
      },
      {
        id: "fallback-s2", 
        english: "I am fine",
        french: ["Je vais bien"],
        explanation: "Simple response to how are you"
      }
    ];
    
    dataCache.numbers = [
      {
        id: "fallback-n1",
        english: "1",
        french: ["un"],
        category: "number",
        isPredefined: true
      },
      {
        id: "fallback-n2",
        english: "2",
        french: ["deux"],
        category: "number",
        isPredefined: true
      }
    ];
    
    dataCache.initialized = true;
  }