// LocalStorageService.js
// A service for handling local storage operations

class LocalStorageService {
  static getItem(key, defaultValue = []) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error retrieving ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  static setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error storing ${key} in localStorage:`, error);
      return false;
    }
  }
}

export default LocalStorageService;