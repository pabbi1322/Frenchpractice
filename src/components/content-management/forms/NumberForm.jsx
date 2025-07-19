// NumberForm.jsx
// Form for adding and editing number entries
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const defaultFormState = {
  english: '',
  french: '',
};

const NumberForm = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState(defaultFormState);
  const [errors, setErrors] = useState({});
  
  // References for form inputs to facilitate keyboard navigation
  const englishInputRef = useRef(null);
  const frenchInputRef = useRef(null);
  const submitButtonRef = useRef(null);
  
  // Handle keyboard navigation between fields
  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      } else if (e.target.name === 'french') {
        // If we're on the last field, submit the form
        handleSubmit(e);
      }
    }
  };

  // Initialize form with data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        english: initialData.english || '',
        french: Array.isArray(initialData.french) 
          ? initialData.french[0] || '' 
          : initialData.french || '',
      });
    } else {
      setFormData(defaultFormState);
    }
  }, [initialData]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {};
    
    // Validate number (must be a valid number)
    if (!formData.english.trim()) {
      newErrors.english = 'Number is required';
    } else if (isNaN(Number(formData.english))) {
      newErrors.english = 'Must be a valid number';
    }
    
    if (!formData.french.trim()) {
      newErrors.french = 'French word is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Transform data to match the API format
      const numberData = {
        english: formData.english,
        french: [formData.french], // API expects an array
        category: 'number' // Always set category to 'number'
      };
      
      onSubmit(numberData);
      
      // Reset form if not editing
      if (!initialData) {
        setFormData(defaultFormState);
        
        // Focus back on the first input field after a short delay
        setTimeout(() => {
          if (englishInputRef.current) {
            englishInputRef.current.focus();
          }
        }, 50);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Number */}
        <div>
          <label htmlFor="english" className="block mb-1 text-gray-300">
            Number
          </label>
          <input
            type="text"
            id="english"
            name="english"
            value={formData.english}
            onChange={handleInputChange}
            onKeyDown={(e) => handleKeyDown(e, frenchInputRef)}
            className={`w-full p-2 rounded bg-gray-700 text-white border ${
              errors.english ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="e.g., 42"
            ref={englishInputRef}
            autoFocus
          />
          {errors.english && (
            <p className="text-red-500 text-sm mt-1">{errors.english}</p>
          )}
        </div>

        {/* French Word */}
        <div>
          <label htmlFor="french" className="block mb-1 text-gray-300">
            French Word
          </label>
          <input
            type="text"
            id="french"
            name="french"
            value={formData.french}
            onChange={handleInputChange}
            onKeyDown={(e) => handleKeyDown(e, submitButtonRef)}
            className={`w-full p-2 rounded bg-gray-700 text-white border ${
              errors.french ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="e.g., quarante-deux"
            ref={frenchInputRef}
          />
          {errors.french && (
            <p className="text-red-500 text-sm mt-1">{errors.french}</p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          ref={submitButtonRef}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {initialData ? 'Update Number' : 'Add Number'}
        </button>
      </div>
    </form>
  );
};

NumberForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialData: PropTypes.shape({
    id: PropTypes.string,
    english: PropTypes.string,
    french: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ])
  })
};

export default NumberForm;