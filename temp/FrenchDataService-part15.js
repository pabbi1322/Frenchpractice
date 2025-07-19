  /**
   * Mark an item as seen by the user
   * @param {string} type - Type of content ('words', 'verbs', 'sentences', 'numbers')
   * @param {string} itemId - ID of the item
   * @param {string} userId - User ID
   */
  static markItemAsSeen(type, itemId, userId = 'guest') {
    if (!itemId) {
      console.error('FrenchDataService: Cannot mark item as seen, no itemId provided');
      return;
    }
    
    try {
      let seenKey = '';
      
      // Get the appropriate seen key based on type
      switch (type) {
        case 'words':
          seenKey = WORDS_SEEN_KEY;
          break;
        case 'verbs':
          seenKey = VERBS_SEEN_KEY;
          break;
        case 'sentences':
          seenKey = SENTENCES_SEEN_KEY;
          break;
        case 'numbers':
          seenKey = NUMBERS_SEEN_KEY;
          break;
        default:
          console.error(`FrenchDataService: Unknown item type for marking as seen: ${type}`);
          return;
      }
      
      // Get seen items from localStorage
      const userSeenKey = `${seenKey}-${userId}`;
      const seenItemsStr = localStorage.getItem(userSeenKey) || '{}';
      let seenItems;
      
      try {
        seenItems = JSON.parse(seenItemsStr);
      } catch (error) {
        console.error('Error parsing seen items, resetting:', error);
        seenItems = {};
      }
      
      // Mark the item as seen with the current timestamp
      seenItems[itemId] = Date.now();
      
      // Save back to localStorage
      localStorage.setItem(userSeenKey, JSON.stringify(seenItems));
      
      console.log(`FrenchDataService: Marked ${type} item ${itemId} as seen by user ${userId}`);
    } catch (error) {
      console.error(`FrenchDataService: Error marking item as seen:`, error);
    }
  }