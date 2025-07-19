  /**
   * Load all content from data files and user storage
   */
  static async loadAllContent() {
    try {
      console.log("FrenchDataService: Starting content loading...");
      
      // 1. Load words from all sources with safe handling
      const baseWords = frenchWords || [];
      let additionalWords = [];
      let additionalNumbers = [];
      let userWords = [];
      
      try {
        additionalWords = additionalFrenchWords || [];
        console.log(`Loaded ${additionalWords.length} additional words`);
      } catch (e) {
        console.error("Failed to load additionalFrenchWords:", e);
        additionalWords = [];
      }
      
      try {
        additionalNumbers = additionalFrenchNumbers || [];
        console.log(`Loaded ${additionalNumbers.length} additional numbers`);
      } catch (e) {
        console.error("Failed to load additionalFrenchNumbers:", e);
        additionalNumbers = [];
      }
      
      try {
        // Try to get user words from IndexedDB first
        userWords = await this.getUserContent(STORE_WORDS);
        console.log(`Loaded ${userWords.length} user words from IndexedDB`);
      } catch (e) {
        console.error("Failed to load user words:", e);
        userWords = [];
      }
      
      // 2. Load verbs from all sources with safe handling
      const baseVerbs = frenchVerbs || [];
      
      // MODIFIED: Skip loading additionalFrenchVerbs as requested by user
      // Use empty array instead of additionalFrenchVerbs to prevent loading predefined verbs
      let additionalVerbs = [];
      console.log('Skipping loading predefined verbs as requested by user');
      
      let userVerbs = [];
      
      try {
        // Try to get user verbs from IndexedDB
        userVerbs = await this.getUserContent(STORE_VERBS);
        console.log(`Loaded ${userVerbs.length} user verbs from IndexedDB`);
      } catch (e) {
        console.error("Failed to load user verbs:", e);
        userVerbs = [];
      }
      
      // 3. Load sentences from all sources with safe handling
      const baseSentences = frenchSentences || [];
      let additionalSentences = [];
      let userSentences = [];
      
      try {
        additionalSentences = additionalFrenchSentences || [];
        console.log(`Loaded ${additionalSentences.length} additional sentences`);
      } catch (e) {
        console.error("Failed to load additionalFrenchSentences:", e);
        additionalSentences = [];
      }
      
      try {
        // Try to get user sentences from IndexedDB
        userSentences = await this.getUserContent(STORE_SENTENCES);
        console.log(`Loaded ${userSentences.length} user sentences from IndexedDB`);
      } catch (e) {
        console.error("Failed to load user sentences:", e);
        userSentences = [];
      }
      
      // Process number items to mark them as predefined and with category "number"
      const processedNumbers = additionalNumbers.map((number, index) => ({
        ...number,
        id: number.id || `number-${index}`, // Ensure each number has an ID
        isPredefined: true,
        category: 'number'
      }));
      
      // Check if numbers exist in IndexedDB, if not add them
      const existingNumbers = await this.getUserContent(STORE_NUMBERS);
      if (existingNumbers.length === 0 && processedNumbers.length > 0) {
        console.log(`Storing ${processedNumbers.length} numbers in IndexedDB`);
        await indexedDBService.bulkAddData(STORE_NUMBERS, processedNumbers);
      }
      
      // Store merged content in cache
      dataCache.words = this.combineAndValidateData([...baseWords, ...additionalWords, ...userWords], 'word');
      
      const verbsBeforeValidation = [...baseVerbs, ...additionalVerbs, ...userVerbs];
      console.log(`Before validation: ${verbsBeforeValidation.length} verbs total (${baseVerbs.length} base, ${additionalVerbs.length} additional, ${userVerbs.length} user)`);
      
      dataCache.verbs = this.combineAndValidateData(verbsBeforeValidation, 'verb');
      console.log(`After validation: ${dataCache.verbs.length} verbs in dataCache`);
      
      dataCache.sentences = this.combineAndValidateData([...baseSentences, ...additionalSentences, ...userSentences], 'sentence');
      
      // Get numbers from IndexedDB or use processed numbers - but avoid duplicating them
      // Only get from DB if we added them to the DB earlier, otherwise use processed numbers directly
      const numbersFromDB = existingNumbers.length > 0 ? existingNumbers : await this.getUserContent(STORE_NUMBERS);
      
      // If we have numbers in DB, use those, otherwise use our processed numbers
      dataCache.numbers = this.combineAndValidateData(
        numbersFromDB.length > 0 ? numbersFromDB : processedNumbers, 
        'number'
      );
      
      console.log(`FrenchDataService: Content loading complete. 
        Words: ${dataCache.words?.length || 0} 
        Verbs: ${dataCache.verbs?.length || 0} 
        Sentences: ${dataCache.sentences?.length || 0}
        Numbers: ${dataCache.numbers?.length || 0}`);
    } catch (e) {
      console.error("Critical error in loadAllContent:", e);
      // In case of critical failure, load fallback content
      this.loadFallbackContent();
    }
  }