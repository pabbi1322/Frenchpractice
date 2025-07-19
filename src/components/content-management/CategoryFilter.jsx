// CategoryFilter.jsx
// Component for filtering words by category
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import CategoryService from '../../services/CategoryService';

const CategoryFilter = ({ onFilterChange }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' is a special value for all categories
  
  // Load categories function to be called initially and when refreshing
  const loadCategories = async () => {
    try {
      const allCategories = await CategoryService.getAllCategories();
      // Sort categories alphabetically by name
      const sortedCategories = [...allCategories].sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      setCategories(sortedCategories || []);
    } catch (error) {
      console.error('Error loading categories for filter:', error);
    }
  };
  
  // Load categories on mount and set up interval to check for changes
  useEffect(() => {
    // Initial load
    loadCategories();
    
    // Set up refresh interval to detect new categories
    const refreshInterval = setInterval(() => {
      loadCategories();
    }, 5000); // Check every 5 seconds
    
    // Clean up interval on unmount
    return () => clearInterval(refreshInterval);
  }, []);
  
  // Handle category selection
  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setSelectedCategory(newCategory);
    onFilterChange(newCategory);
  };
  
  return (
    <div className="flex items-center space-x-2 mb-4">
      <label htmlFor="category-filter" className="text-sm font-medium text-gray-300">
        Filter by category:
      </label>
      <select
        id="category-filter"
        value={selectedCategory}
        onChange={handleCategoryChange}
        className="bg-gray-700 text-white border border-gray-600 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All Categories</option>
        {categories.map(category => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
};

CategoryFilter.propTypes = {
  onFilterChange: PropTypes.func.isRequired
};

export default CategoryFilter;