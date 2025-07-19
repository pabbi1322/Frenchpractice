// CategoryDropdown.jsx
// A dropdown for selecting a single category with option to add new ones
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import CategoryService from '../../services/CategoryService';

const CategoryDropdown = ({ selectedCategory = 'general', onChange }) => {
  const [categories, setCategories] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', id: '' });
  const [error, setError] = useState('');
  const dropdownRef = useRef(null);
  const newCategoryInputRef = useRef(null);
  
  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const allCategories = await CategoryService.getAllCategories();
        // Sort alphabetically by name
        const sortedCategories = [...allCategories].sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        setCategories(sortedCategories || []);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    
    loadCategories();
  }, []);
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsAddingNew(false);
        setError('');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-focus on the new category input when adding
  useEffect(() => {
    if (isAddingNew && newCategoryInputRef.current) {
      newCategoryInputRef.current.focus();
    }
  }, [isAddingNew]);
  
  // Select a category
  const selectCategory = (categoryId) => {
    onChange(categoryId);
    setIsOpen(false);
  };
  
  // Show the add new category form
  const showAddNewForm = () => {
    setIsAddingNew(true);
    setNewCategory({ name: '', id: '' });
    setError('');
  };
  
  // Handle input change for new category
  const handleNewCategoryChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'name') {
      // Auto-generate an ID from the name (lowercase, replace spaces with hyphens)
      const id = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setNewCategory({ ...newCategory, name: value, id });
    } else {
      setNewCategory({ ...newCategory, [name]: value });
    }
    
    // Clear any errors when typing
    if (error) setError('');
  };
  
  // Add a new category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategory.name.trim()) {
      setError('Category name is required');
      return;
    }
    
    try {
      // Check if the category already exists
      if (categories.some(cat => cat.id === newCategory.id)) {
        setError('A category with this name already exists');
        return;
      }
      
      // Add default color
      const categoryToAdd = { 
        ...newCategory, 
        color: 'bg-gray-700' // Default color
      };
      
      const result = await CategoryService.addCategory(categoryToAdd);
      
      if (result) {
        // Add to local state and sort alphabetically
        const updatedCategories = [...categories, categoryToAdd].sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        setCategories(updatedCategories);
        
        // Select the new category
        onChange(newCategory.id);
        
        // Reset and close forms
        setNewCategory({ name: '', id: '' });
        setIsAddingNew(false);
        setIsOpen(false);
      } else {
        setError('Failed to add category');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      setError(error.message || 'Failed to add category');
    }
  };
  
  // Cancel adding new category
  const cancelAddCategory = () => {
    setIsAddingNew(false);
    setNewCategory({ name: '', id: '' });
    setError('');
  };
  
  // Get badge for a category
  const getCategoryBadge = (category) => {
    const colorClass = category.color || 'bg-gray-700 text-gray-200';
    
    return (
      <span 
        className={`${colorClass} text-xs font-medium px-2 py-1 rounded-full`}
      >
        {category.name}
      </span>
    );
  };
  
  // Find selected category object
  const selectedCategoryObj = categories.find(c => c.id === selectedCategory) || 
    { id: 'general', name: 'General', color: 'bg-gray-700' };
  
  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Selected category display */}
      <div 
        className="flex items-center p-2 bg-gray-800 border border-gray-700 rounded-md cursor-pointer min-h-10"
        onClick={() => !isAddingNew && setIsOpen(!isOpen)}
      >
        {getCategoryBadge(selectedCategoryObj)}
        <div className="ml-auto">
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
               fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>
      
      {/* Dropdown options */}
      {isOpen && !isAddingNew && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* Categories list */}
          {categories.map(category => (
            <div 
              key={category.id}
              className={`flex items-center px-4 py-2 cursor-pointer hover:bg-gray-700 ${
                selectedCategory === category.id ? 'bg-gray-700' : ''
              }`}
              onClick={() => selectCategory(category.id)}
            >
              {getCategoryBadge(category)}
            </div>
          ))}
          
          {/* Add New Category option */}
          <div 
            className="flex items-center px-4 py-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium mt-2"
            onClick={showAddNewForm}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Add New Category
          </div>
        </div>
      )}
      
      {/* Add New Category Form */}
      {isAddingNew && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Add New Category</h3>
          
          {error && (
            <div className="mb-3 p-2 bg-red-800/50 border border-red-700 rounded text-red-200 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleAddCategory}>
            <div className="mb-3">
              <label htmlFor="name" className="block text-xs text-gray-400 mb-1">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newCategory.name}
                onChange={handleNewCategoryChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                placeholder="e.g., Transportation"
                ref={newCategoryInputRef}
                required
              />
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <button
                type="button"
                onClick={cancelAddCategory}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Add Category
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

CategoryDropdown.propTypes = {
  selectedCategory: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

export default CategoryDropdown;