  /**
   * Get user-created content from IndexedDB with localStorage fallback
   */
  static async getUserContent(storeName) {
    try {
      // If IndexedDB is initialized, get data from there
      if (indexedDBService.isInitialized) {
        const data = await indexedDBService.getAllData(storeName);
        
        // MODIFIED: Filter out any predefined verbs that might still be in the database
        if (storeName === STORE_VERBS) {
          const filteredData = data.filter(verb => {
            // Filter out verbs with ID pattern "verb-N" which are the predefined verbs
            const isPredefined = verb.id && typeof verb.id === 'string' && 
                               (verb.id.startsWith('verb-') || verb.isPredefined === true);
            if (isPredefined) {
              console.log(`Filtering out predefined verb: ${verb.id} - ${verb.infinitive}`);
            }
            return !isPredefined;
          });
          console.log(`Filtered verbs: ${data.length} before, ${filteredData.length} after`);
          return filteredData || [];
        }
        
        return data || [];
      } else {
        // Fallback to localStorage for backward compatibility
        let key;
        
        switch(storeName) {
          case STORE_WORDS:
            key = USER_WORDS_KEY;
            break;
          case STORE_VERBS:
            key = USER_VERBS_KEY;
            break;
          case STORE_SENTENCES:
            key = USER_SENTENCES_KEY;
            break;
          default:
            key = `frenchmaster_${storeName}`;
        }
        
        const content = localStorage.getItem(key);
        let parsedContent = content ? JSON.parse(content) : [];
        
        // Also filter predefined verbs from localStorage if needed
        if (storeName === STORE_VERBS && Array.isArray(parsedContent)) {
          parsedContent = parsedContent.filter(verb => {
            const isPredefined = verb.id && typeof verb.id === 'string' && 
                              (verb.id.startsWith('verb-') || verb.isPredefined === true);
            return !isPredefined;
          });
        }
        
        return parsedContent;
      }
    } catch (error) {
      console.error(`FrenchDataService: Error retrieving user content for ${storeName}`, error);
      return [];
    }
  }