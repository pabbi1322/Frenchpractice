// CategoryMultiSelect.jsx
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import CategoryService from '../../services/CategoryService';

const CategoryMultiSelect = ({ selectedCategories = [], onChange }) => {
  const [categories, setCategories] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      const allCategories = await CategoryService.getAllCategories();
      setCategories(allCategories || []);
    };
    
    loadCategories();
  }, []);
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Toggle category selection
  const toggleCategory = (categoryId) => {
    const isSelected = selectedCategories.includes(categoryId);
    const newSelectedCategories = isSelected
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    onChange(newSelectedCategories);
  };
  
  // Toggle all categories
  const toggleAll = () => {
    if (selectedCategories.length === categories.length) {
      // If all are selected, deselect all
      onChange([]);
    } else {
      // Otherwise select all
      onChange(categories.map(category => category.id));
    }
  };
  
  // Get badge for a category
  const getCategoryBadge = (category) => {
    const colorClass = category.color ? 
      `${category.color} ${category.color.replace('bg-', 'text-').replace('700', '200')}` : 
      'bg-gray-700 text-gray-200';
    
    return (
      <span 
        key={category.id} 
        className={`${colorClass} text-xs font-medium mr-1 px-2 py-1 rounded-full`}
      >
        {category.name}
      </span>
    );
  };
  
  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Selected categories display */}
      <div 
        className="flex flex-wrap gap-1 p-2 bg-gray-800 border border-gray-700 rounded-md cursor-pointer min-h-10"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedCategories.length === 0 ? (
          <span className="text-gray-400">All categories selected</span>
        ) : (
          selectedCategories.map(catId => {
            const category = categories.find(c => c.id === catId);
            return category ? getCategoryBadge(category) : null;
          })
        )}
        <div className="ml-auto">
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
               fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>
      
      {/* Dropdown options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* Toggle all option */}
          <div 
            className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-700 border-b border-gray-700"
            onClick={toggleAll}
          >
            <input 
              type="checkbox"
              className="mr-2"
              checked={selectedCategories.length === categories.length}
              readOnly
            />
            <span className="text-white font-medium">
              {selectedCategories.length === categories.length ? 'Deselect All' : 'Select All'}
            </span>
          </div>
          
          {/* Individual categories */}
          {categories.map(category => (
            <div 
              key={category.id}
              className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-700"
              onClick={() => toggleCategory(category.id)}
            >
              <input 
                type="checkbox"
                className="mr-2"
                checked={selectedCategories.includes(category.id)}
                readOnly
              />
              <span className="flex-1">{getCategoryBadge(category)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

CategoryMultiSelect.propTypes = {
  selectedCategories: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired
};

export default CategoryMultiSelect;