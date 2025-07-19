// SentenceForm.jsx
// Form for adding and editing sentence entries
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const SentenceForm = ({ onSubmit, onCancel, initialData = null }) => {
  // Default form state
  const defaultFormState = {
    english: '',
    french: ''
  };

  // Initialize state with provided data or defaults
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      // Transform the API format to form format
      return {
        english: initialData.english || '',
        french: Array.isArray(initialData.french) ? initialData.french[0] : initialData.french || ''
      };
    }
    return defaultFormState;
  });
  
  const [errors, setErrors] = useState({});

  // Create references for form inputs to facilitate keyboard navigation
  const englishInputRef = useRef(null);
  const frenchInputRef = useRef(null);
  const submitButtonRef = useRef(null);

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        english: initialData.english || '',
        french: Array.isArray(initialData.french) ? initialData.french[0] : initialData.french || ''
      });
    }
  }, [initialData]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

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

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.english.trim()) {
      newErrors.english = 'English sentence is required';
    }
    
    if (!formData.french.trim()) {
      newErrors.french = 'French sentence is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Transform data to match the API format
      const sentenceData = {
        english: formData.english,
        french: [formData.french] // API expects an array
      };
      
      onSubmit(sentenceData);
      
      // Reset form if not editing
      if (!initialData) {
        setFormData(defaultFormState);
        
        // Focus on the English input field after a short delay to ensure DOM update
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
        {/* English Sentence */}
        <div className="md:col-span-2">
          <label htmlFor="english" className="block mb-1 text-gray-300">
            English Sentence
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
            placeholder="e.g., How are you?"
            ref={englishInputRef}
            autoFocus
          />
          {errors.english && (
            <p className="text-red-500 text-sm mt-1">{errors.english}</p>
          )}
        </div>

        {/* French Sentence */}
        <div className="md:col-span-2">
          <label htmlFor="french" className="block mb-1 text-gray-300">
            French Sentence
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
            placeholder="e.g., Comment allez-vous?"
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
          {initialData ? 'Update Sentence' : 'Add Sentence'}
        </button>
      </div>
    </form>
  );
};

SentenceForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialData: PropTypes.shape({
    english: PropTypes.string,
    french: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]),
    level: PropTypes.string
  })
};

export default SentenceForm;