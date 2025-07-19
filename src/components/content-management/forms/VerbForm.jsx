// VerbForm.jsx
// Form for adding and editing verb entries
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const VerbForm = ({ onSubmit, onCancel, initialData = null }) => {
  // Default form state
  const defaultFormState = {
    frenchInfinitive: '',
    englishInfinitive: '',
    group: '1',
    presentTense: {
      je: '',
      tu: '',
      il: '',
      nous: '',
      vous: '',
      ils: ''
    }
  };

  // Initialize state with provided data or defaults
  const [formData, setFormData] = useState(initialData || defaultFormState);
  const [errors, setErrors] = useState({});

  // Create refs for form inputs to facilitate auto-focus
  const frenchInfinitiveRef = useRef(null);
  const englishInfinitiveRef = useRef(null);
  const groupRef = useRef(null);
  const jeRef = useRef(null);
  const tuRef = useRef(null);
  const ilRef = useRef(null);
  const nousRef = useRef(null);
  const vousRef = useRef(null);
  const ilsRef = useRef(null);
  const submitButtonRef = useRef(null);

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle conjugation input changes
  const handleConjugationChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      presentTense: {
        ...formData.presentTense,
        [name]: value
      }
    });
  };
  
  // Handle keyboard navigation between fields
  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      } else if (e.target.name === 'ils') {
        // If we're on the last field, submit the form
        handleSubmit(e);
      }
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.frenchInfinitive.trim()) {
      newErrors.frenchInfinitive = 'French infinitive is required';
    }
    
    if (!formData.englishInfinitive.trim()) {
      newErrors.englishInfinitive = 'English translation is required';
    } else if (!formData.englishInfinitive.trim().startsWith('to ')) {
      newErrors.englishInfinitive = 'English infinitive should start with "to"';
    }
    
    // Check if at least some conjugations are provided
    const conjugationsProvided = Object.values(formData.presentTense).some(val => val.trim() !== '');
    
    if (!conjugationsProvided) {
      newErrors.conjugations = 'At least one conjugation is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Transform data to match the API format
      const verbData = {
        infinitive: formData.frenchInfinitive,
        english: formData.englishInfinitive,
        group: formData.group,
        conjugations: {
          je: formData.presentTense.je ? [formData.presentTense.je] : [],
          tu: formData.presentTense.tu ? [formData.presentTense.tu] : [],
          il: formData.presentTense.il ? [formData.presentTense.il] : [],
          nous: formData.presentTense.nous ? [formData.presentTense.nous] : [],
          vous: formData.presentTense.vous ? [formData.presentTense.vous] : [],
          ils: formData.presentTense.ils ? [formData.presentTense.ils] : []
        },
        tense: "present"
      };
      
      onSubmit(verbData);
      
      // Reset form if not editing
      if (!initialData) {
        setFormData(defaultFormState);
        
        // Focus back on the first field after a short delay
        setTimeout(() => {
          if (frenchInfinitiveRef.current) {
            frenchInfinitiveRef.current.focus();
          }
        }, 50);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* French Infinitive */}
        <div>
          <label htmlFor="frenchInfinitive" className="block mb-1 text-gray-300">
            French Infinitive
          </label>
          <input
            type="text"
            id="frenchInfinitive"
            name="frenchInfinitive"
            ref={frenchInfinitiveRef}
            value={formData.frenchInfinitive}
            onChange={handleInputChange}
            onKeyDown={(e) => handleKeyDown(e, englishInfinitiveRef)}
            className={`w-full p-2 rounded bg-gray-700 text-white border ${
              errors.frenchInfinitive ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="e.g., parler"
            autoFocus
          />
          {errors.frenchInfinitive && (
            <p className="text-red-500 text-sm mt-1">{errors.frenchInfinitive}</p>
          )}
        </div>

        {/* English Translation */}
        <div>
          <label htmlFor="englishInfinitive" className="block mb-1 text-gray-300">
            English Translation
          </label>
          <input
            type="text"
            id="englishInfinitive"
            name="englishInfinitive"
            ref={englishInfinitiveRef}
            value={formData.englishInfinitive}
            onChange={handleInputChange}
            onKeyDown={(e) => handleKeyDown(e, groupRef)}
            className={`w-full p-2 rounded bg-gray-700 text-white border ${
              errors.englishInfinitive ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="e.g., to speak"
          />
          {errors.englishInfinitive && (
            <p className="text-red-500 text-sm mt-1">{errors.englishInfinitive}</p>
          )}
        </div>

        {/* Verb Group */}
        <div>
          <label htmlFor="group" className="block mb-1 text-gray-300">
            Verb Group
          </label>
          <select
            id="group"
            name="group"
            ref={groupRef}
            value={formData.group}
            onChange={handleInputChange}
            onKeyDown={(e) => handleKeyDown(e, jeRef)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
          >
            <option value="1">1st Group (-er)</option>
            <option value="2">2nd Group (-ir)</option>
            <option value="3">3rd Group (-re)</option>
            <option value="4">Irregular</option>
          </select>
        </div>


      </div>

      {/* Present Tense Conjugations */}
      <div className="mt-6">
        <h4 className="text-lg font-medium text-gray-300 mb-2">Present Tense Conjugations</h4>
        
        {errors.conjugations && (
          <p className="text-red-500 text-sm mb-2">{errors.conjugations}</p>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label htmlFor="je" className="block mb-1 text-gray-300">
              je
            </label>
            <input
              type="text"
              id="je"
              name="je"
              ref={jeRef}
              value={formData.presentTense.je}
              onChange={handleConjugationChange}
              onKeyDown={(e) => handleKeyDown(e, tuRef)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="e.g., parle"
            />
          </div>
          
          <div>
            <label htmlFor="tu" className="block mb-1 text-gray-300">
              tu
            </label>
            <input
              type="text"
              id="tu"
              name="tu"
              ref={tuRef}
              value={formData.presentTense.tu}
              onChange={handleConjugationChange}
              onKeyDown={(e) => handleKeyDown(e, ilRef)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="e.g., parles"
            />
          </div>
          
          <div>
            <label htmlFor="il" className="block mb-1 text-gray-300">
              il/elle/on
            </label>
            <input
              type="text"
              id="il"
              name="il"
              ref={ilRef}
              value={formData.presentTense.il}
              onChange={handleConjugationChange}
              onKeyDown={(e) => handleKeyDown(e, nousRef)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="e.g., parle"
            />
          </div>
          
          <div>
            <label htmlFor="nous" className="block mb-1 text-gray-300">
              nous
            </label>
            <input
              type="text"
              id="nous"
              name="nous"
              ref={nousRef}
              value={formData.presentTense.nous}
              onChange={handleConjugationChange}
              onKeyDown={(e) => handleKeyDown(e, vousRef)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="e.g., parlons"
            />
          </div>
          
          <div>
            <label htmlFor="vous" className="block mb-1 text-gray-300">
              vous
            </label>
            <input
              type="text"
              id="vous"
              name="vous"
              ref={vousRef}
              value={formData.presentTense.vous}
              onChange={handleConjugationChange}
              onKeyDown={(e) => handleKeyDown(e, ilsRef)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="e.g., parlez"
            />
          </div>
          
          <div>
            <label htmlFor="ils" className="block mb-1 text-gray-300">
              ils/elles
            </label>
            <input
              type="text"
              id="ils"
              name="ils"
              ref={ilsRef}
              value={formData.presentTense.ils}
              onChange={handleConjugationChange}
              onKeyDown={(e) => handleKeyDown(e, submitButtonRef)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="e.g., parlent"
            />
          </div>
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
          {initialData ? 'Update Verb' : 'Add Verb'}
        </button>
      </div>
    </form>
  );
};

VerbForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialData: PropTypes.shape({
    frenchInfinitive: PropTypes.string,
    englishInfinitive: PropTypes.string,
    group: PropTypes.string,
    presentTense: PropTypes.shape({
      je: PropTypes.string,
      tu: PropTypes.string,
      il: PropTypes.string,
      nous: PropTypes.string,
      vous: PropTypes.string,
      ils: PropTypes.string
    })
  })
};

export default VerbForm;