  /**
   * Ensure all data items have required properties and unique IDs
   */
  static combineAndValidateData(data, type) {
    // Add unique IDs to items without IDs and ensure data integrity
    const result = data.map((item, index) => {
      if (!item.id) {
        // Create ID based on type and index if missing
        item.id = `${type}-${index}`;
      }
      return item;
    }).filter(item => {
      // Filter out invalid items based on type
      switch (type) {
        case 'word':
          return item.english && item.french;
        case 'verb':
          // Modified to be more flexible - only require infinitive for verbs
          if (!(item.infinitive && item.english && item.conjugations)) {
            console.log(`Filtering out verb with incomplete data: ${JSON.stringify({
              id: item.id,
              infinitive: item.infinitive || '(missing)',
              english: item.english || '(missing)',
              hasConjugations: !!item.conjugations
            })}`);
          }
          return item.infinitive && item.english && item.conjugations;
        case 'sentence':
          return item.english && item.french;
        default:
          return true;
      }
    });
    
    if (type === 'verb') {
      console.log(`Verb validation: ${data.length} verbs before filtering, ${result.length} after filtering`);
    }
    
    return result;
  }