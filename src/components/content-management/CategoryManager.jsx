// CategoryManager.jsx
// A production-ready component for managing word categories
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import CategoryService from '../../services/CategoryService';

// Default categories that cannot be deleted
const DEFAULT_CATEGORIES = ['general', 'vocabulary'];

const CategoryManager = ({ onCategoryChange }) => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);

  // Memoize loadCategories to prevent unnecessary recreations
  const loadCategories = useCallback(async () => {
    try {
      const allCategories = await CategoryService.getAllCategories();
      // Sort alphabetically by name
      const sortedCategories = [...allCategories].sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      setCategories(sortedCategories);
      
      // Notify parent component if needed
      if (onCategoryChange) {
        onCategoryChange(sortedCategories);
      }
    } catch (error) {
      setError('Unable to load categories. Please try again.');
    }
  }, [onCategoryChange]);

  // Load categories on mount and set up refresh interval
  useEffect(() => {
    loadCategories();
    
    // Set up refresh interval to check for new categories
    const refreshInterval = setInterval(() => {
      loadCategories();
    }, 3000); // Check every 3 seconds
    
    return () => clearInterval(refreshInterval);
  }, [loadCategories]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000); // Auto-dismiss after 3 seconds
  };

  const handleInputChange = (e) => {
    setNewCategory(e.target.value);
    if (error) setError('');
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    const trimmedCategory = newCategory.trim();
    if (!trimmedCategory) {
      setError('Category name is required');
      return;
    }
    
    try {
      // Generate ID from name
      const id = trimmedCategory.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Check if category already exists
      if (categories.some(cat => 
        cat.id === id || cat.name.toLowerCase() === trimmedCategory.toLowerCase())
      ) {
        setError('A category with this name already exists');
        return;
      }
      
      const categoryData = {
        id,
        name: trimmedCategory,
        color: 'bg-gray-700' // Default color
      };
      
      const result = await CategoryService.addCategory(categoryData);
      
      if (result) {
        showNotification('success', `Category "${trimmedCategory}" added successfully`);
        setNewCategory('');
        await loadCategories(); // Refresh the categories list
      } else {
        setError('Failed to add category');
      }
    } catch (error) {
      setError(error.message || 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    // Don't allow deleting default categories
    if (DEFAULT_CATEGORIES.includes(categoryId)) {
      showNotification('error', 'Cannot delete default categories');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete this category?`)) {
      try {
        const result = await CategoryService.deleteCategory(categoryId);
        
        if (result) {
          showNotification('success', 'Category deleted successfully');
          await loadCategories(); // Refresh the list
        } else {
          showNotification('error', 'Failed to delete category');
        }
      } catch (error) {
        showNotification('error', error.message || 'Failed to delete category');
      }
    }
  };

  return (
    <div className="bg-gray-800 rounded-md p-4 mb-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Category Management</h3>
      
      {notification && (
        <div className={`mb-4 p-3 rounded text-sm ${notification.type === 'success' ? 'bg-green-800/50 text-green-100 border border-green-700' : 'bg-red-800/50 text-red-100 border border-red-700'}`} role="alert" aria-live="polite">
          {notification.message}
        </div>
      )}
      
      {/* New category form */}
      <div className="mb-4">
        <form onSubmit={handleAddCategory} className="flex items-end gap-2">
          <div className="flex-grow">
            <label htmlFor="new-category" className="block text-sm text-gray-400 mb-1">
              Add New Category
            </label>
            <input
              type="text"
              id="new-category"
              value={newCategory}
              onChange={handleInputChange}
              placeholder="e.g., Transportation"
              maxLength={50}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              aria-describedby={error ? "category-error" : undefined}
              aria-invalid={!!error}
            />
            {error && (
              <p id="category-error" className="text-red-400 text-xs mt-1" role="alert">{error}</p>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
            disabled={!newCategory.trim()}
          >
            Add
          </button>
        </form>
      </div>
      
      {/* Categories list */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">Existing Categories</h4>
        {categories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <div
                key={category.id}
                className={`${category.color} flex items-center rounded-full px-3 py-1`}
              >
                <span className="text-sm">{category.name}</span>
                {/* Don't show delete button for default categories */}
                {!DEFAULT_CATEGORIES.includes(category.id) && (
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="ml-2 text-gray-300 hover:text-white focus:outline-none focus:ring-1 focus:ring-white/50 rounded-full"
                    aria-label={`Delete ${category.name} category`}
                    title={`Delete ${category.name}`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No custom categories available. Add one above.</p>
        )}
      </div>
    </div>
  );
};

CategoryManager.propTypes = {
  onCategoryChange: PropTypes.func
};

CategoryManager.defaultProps = {
  onCategoryChange: null
};

export default CategoryManager;