// CategoryFilter.jsx
// Component for filtering words by category during practice
import React, { useState, useEffect } from 'react';
import CategoryService from '../services/CategoryService';

// This component displays checkboxes for each category to allow filtering
const CategoryFilter = ({ onFilterChange, selectedCategories }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all available categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const allCategories = await CategoryService.getAllCategories();
        setCategories(allCategories);
      } catch (error) {
        console.error('Error loading categories for filter:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Toggle a category selection
  const toggleCategory = (categoryId) => {
    let newSelectedCategories;
    
    if (selectedCategories.includes(categoryId)) {
      // Remove category if already selected
      newSelectedCategories = selectedCategories.filter(id => id !== categoryId);
    } else {
      // Add category if not selected
      newSelectedCategories = [...selectedCategories, categoryId];
    }
    
    // Call the parent component's callback with the updated selection
    onFilterChange(newSelectedCategories);
  };

  // Select all categories
  const selectAllCategories = () => {
    const allCategoryIds = categories.map(category => category.id);
    onFilterChange(allCategoryIds);
  };

  // Deselect all categories
  const deselectAllCategories = () => {
    onFilterChange([]);
  };

  if (loading) {
    return <div className="py-2 text-gray-500">Loading categories...</div>;
  }

  return (
    <div className="border border-gray-700 rounded-lg p-4 mb-4 bg-gray-800">
      <div className="flex justify-between items-center mb-3">
        <label className="text-sm font-medium text-gray-300">Filter by category:</label>
        <div className="flex space-x-2">
          <button 
            onClick={selectAllCategories}
            className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded"
          >
            Select All
          </button>
          <button 
            onClick={deselectAllCategories}
            className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded"
          >
            Deselect All
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {categories.map(category => {
          const isSelected = selectedCategories.includes(category.id);
          // Use neutral colors instead of colorful ones
          const baseClass = "flex items-center border rounded-md px-3 py-1 cursor-pointer transition-colors";
          
          return (
            <div
              key={category.id}
              className={`${baseClass} ${isSelected ? 'bg-gray-600 text-white' : 'bg-gray-700 bg-opacity-50 text-gray-300'}`}
              onClick={() => toggleCategory(category.id)}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}} // Handled by parent div onClick
                className="mr-2"
              />
              <span>{category.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilter;