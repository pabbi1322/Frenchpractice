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
      
      // Find an item the user hasn't seen or hasn't seen in a while
      const now = Date.now();
      const unseenItems = items.filter(item => !seenItems[item.id]);
      
      // If there are unseen items, pick a random one
      if (unseenItems.length > 0) {
        const randomIndex = Math.floor(Math.random() * unseenItems.length);
        return unseenItems[randomIndex];
      }
      
      // Otherwise, pick the least recently seen item
      let oldestSeenTime = now;
      let oldestSeenItem = items[0];
      
      items.forEach(item => {
        const lastSeen = seenItems[item.id] || 0;
        if (lastSeen < oldestSeenTime) {
          oldestSeenTime = lastSeen;
          oldestSeenItem = item;
        }
      });
      
      return oldestSeenItem;
    } catch (error) {
      console.error(`FrenchDataService: Error getting next item for ${type}:`, error);
      // Fallback: return a random item from cache
      let items = [];
      switch (type) {
        case 'words':
          items = dataCache.words || [];
          break;
        case 'verbs':
          items = dataCache.verbs || [];
          break;
        case 'sentences':
          items = dataCache.sentences || [];
          break;
        case 'numbers':
          items = dataCache.numbers || [];
          break;
      }
      
      if (items.length === 0) return null;
      
      const randomIndex = Math.floor(Math.random() * items.length);
      return items[randomIndex];
    }
  }