// ContentTrackingService.js
class ContentTrackingService {
  // Storage keys
  static WORDS_SEEN_KEY = 'french-learning-words-seen';
  static VERBS_SEEN_KEY = 'french-learning-verbs-seen';
  static SENTENCES_SEEN_KEY = 'french-learning-sentences-seen';
  
  /**
   * Generate a localStorage key specific to user and content type
   */
  static getUserKey(userId, contentType) {
    return `user_${userId}_${contentType}_seen`;
  }
  
  /**
   * Mark content as seen by a specific user
   */
  static markContentAsSeen(userId, contentType, contentId) {
    const key = this.getUserKey(userId, contentType);
    try {
      let seenContent = localStorage.getItem(key);
      seenContent = seenContent ? JSON.parse(seenContent) : [];
      if (!seenContent.includes(contentId)) {
        seenContent.push(contentId);
        localStorage.setItem(key, JSON.stringify(seenContent));
      }
      return true;
    } catch (error) {
      console.error('Error marking content as seen:', error);
      return false;
    }
  }
  
  /**
   * Check if a user has seen specific content
   */
  static hasUserSeenContent(userId, contentType, contentId) {
    const key = this.getUserKey(userId, contentType);
    try {
      const seenContent = localStorage.getItem(key);
      return seenContent ? JSON.parse(seenContent).includes(contentId) : false;
    } catch (error) {
      console.error('Error checking seen content:', error);
      return false;
    }
  }
  
  /**
   * Reset user's progress for a specific content type
   */
  static resetUserProgress(userId, contentType) {
    const key = this.getUserKey(userId, contentType);
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error resetting user progress:', error);
      return false;
    }
  }
  
  /**
   * Get next unseen content for the user, or random content if all have been seen
   */
  static getNextUnseenContent(userId, contentType, allContent) {
    try {
      const key = this.getUserKey(userId, contentType);
      const seenContent = localStorage.getItem(key);
      const seenIds = seenContent ? JSON.parse(seenContent) : [];
      
      // Filter out seen content
      const unseenContent = allContent.filter(item => !seenIds.includes(item.id));
      
      // If all content has been seen, return random content from all
      if (unseenContent.length === 0) {
        return allContent[Math.floor(Math.random() * allContent.length)];
      }
      
      // Return random content from unseen items
      return unseenContent[Math.floor(Math.random() * unseenContent.length)];
    } catch (error) {
      console.error('Error getting unseen content:', error);
      // Fallback to random content
      return allContent[Math.floor(Math.random() * allContent.length)];
    }
  }
}

export default ContentTrackingService;
