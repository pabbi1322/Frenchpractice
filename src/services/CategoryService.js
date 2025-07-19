// CategoryService.js
// A service for managing word categories
import indexedDBService from './IndexedDBService';

const STORE_WORD_CATEGORIES = 'wordCategories';

// Default categories that will always be available
const DEFAULT_CATEGORIES = [
  { id: 'general', name: 'General', color: 'bg-gray-700' },
  { id: 'vocabulary', name: 'Vocabulary', color: 'bg-purple-700' }
];

class CategoryServiceImpl {
  constructor() {
    this.categories = null;
    this.initialized = false;
  }

  // Initialize the service and load categories
  async initialize() {
    console.log('CategoryService: Initializing');
    if (this.initialized) {
      console.log('CategoryService: Already initialized');
      return;
    }

    try {
      await indexedDBService.initialize();
      
      // Get categories from database
      let dbCategories = await indexedDBService.getAllData(STORE_WORD_CATEGORIES);
      
      // If no categories in the database, initialize with defaults
      if (!dbCategories || dbCategories.length === 0) {
        console.log('CategoryService: No categories found, adding defaults');
        // Add default categories to database
        await this.addDefaultCategories();
        dbCategories = await indexedDBService.getAllData(STORE_WORD_CATEGORIES);
      }
      
      // Combine default categories with any custom ones from DB
      this.categories = this.ensureDefaultCategories(dbCategories);
      
      this.initialized = true;
      console.log(`CategoryService: Initialized with ${this.categories.length} categories`);
    } catch (error) {
      console.error('CategoryService: Error initializing', error);
      // Fallback to default categories
      this.categories = [...DEFAULT_CATEGORIES];
    }
    
    return this.categories;
  }

  // Ensure all default categories are present
  ensureDefaultCategories(dbCategories) {
    // Start with a copy of existing categories
    const allCategories = [...dbCategories];
    
    // Add any default categories that are missing
    DEFAULT_CATEGORIES.forEach(defaultCat => {
      if (!allCategories.some(cat => cat.id === defaultCat.id)) {
        allCategories.push(defaultCat);
      }
    });
    
    return allCategories;
  }

  // Add default categories to the database
  async addDefaultCategories() {
    try {
      console.log('CategoryService: Adding default categories to database');
      for (const category of DEFAULT_CATEGORIES) {
        await indexedDBService.addData(STORE_WORD_CATEGORIES, category);
      }
      console.log('CategoryService: Default categories added');
    } catch (error) {
      console.error('CategoryService: Error adding default categories', error);
    }
  }

  // Get all categories
  async getAllCategories() {
    if (!this.initialized) {
      await this.initialize();
    }
    return [...this.categories];
  }

  // Add a new custom category
  async addCategory(category) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Validate category
      if (!category.id || !category.name) {
        throw new Error('Category must have an id and name');
      }
      
      // Check if category already exists
      if (this.categories.some(c => c.id === category.id)) {
        throw new Error(`Category with id ${category.id} already exists`);
      }
      
      // Add default color if not provided
      if (!category.color) {
        category.color = 'bg-gray-700';
      }
      
      // Add to database
      const result = await indexedDBService.addData(STORE_WORD_CATEGORIES, category);
      
      if (result) {
        // Add to in-memory cache
        this.categories.push(category);
        console.log(`CategoryService: Added category ${category.name}`);
      }
      
      return result;
    } catch (error) {
      console.error('CategoryService: Error adding category', error);
      return false;
    }
  }

  // Update an existing category
  async updateCategory(category) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Validate category
      if (!category.id || !category.name) {
        throw new Error('Category must have an id and name');
      }
      
      // Check if it's a default category (can't update those)
      const isDefault = DEFAULT_CATEGORIES.some(c => c.id === category.id);
      if (isDefault) {
        throw new Error('Cannot update default categories');
      }
      
      // Update in database
      const result = await indexedDBService.updateData(STORE_WORD_CATEGORIES, category);
      
      if (result) {
        // Update in-memory cache
        const index = this.categories.findIndex(c => c.id === category.id);
        if (index !== -1) {
          this.categories[index] = category;
        }
        console.log(`CategoryService: Updated category ${category.name}`);
      }
      
      return result;
    } catch (error) {
      console.error('CategoryService: Error updating category', error);
      return false;
    }
  }

  // Delete a category
  async deleteCategory(categoryId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Check if it's a default category (can't delete those)
      const isDefault = DEFAULT_CATEGORIES.some(c => c.id === categoryId);
      if (isDefault) {
        throw new Error('Cannot delete default categories');
      }
      
      // Delete from database
      const result = await indexedDBService.deleteData(STORE_WORD_CATEGORIES, categoryId);
      
      if (result) {
        // Remove from in-memory cache
        this.categories = this.categories.filter(c => c.id !== categoryId);
        console.log(`CategoryService: Deleted category ${categoryId}`);
      }
      
      return result;
    } catch (error) {
      console.error('CategoryService: Error deleting category', error);
      return false;
    }
  }

  // Get a category by id
  async getCategoryById(categoryId) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    return this.categories.find(c => c.id === categoryId) || null;
  }

  // Get category color class
  getCategoryColorClass(categoryId) {
    if (!this.initialized || !this.categories) {
      // Return default if not initialized
      return 'bg-gray-700 text-gray-200';
    }
    
    const category = this.categories.find(c => c.id === categoryId);
    
    if (category && category.color) {
      return `${category.color} ${this.getTextColorForBg(category.color)}`;
    }
    
    return 'bg-gray-700 text-gray-200';
  }

  // Helper to determine text color based on background color
  getTextColorForBg(bgColor) {
    // Extract color name from bg class
    const colorName = bgColor.split('-')[1];
    return `text-${colorName}-200`;
  }
}

// Create singleton instance
const CategoryService = new CategoryServiceImpl();

export default CategoryService;