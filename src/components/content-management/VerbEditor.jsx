// VerbEditor.jsx
// A completely new verb editor component that bypasses the problematic chains
// and connects directly to IndexedDB for reliable verb updates
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as DirectVerbService from '../../services/DirectVerbService';

const VerbEditor = ({ verbId, onSuccess, onCancel }) => {
  // State for form data
  const [formData, setFormData] = useState({
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
  });

  // State for loading, error, and success messages
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  // Load verb data when verbId changes
  useEffect(() => {
    const loadVerbData = async () => {
      if (!verbId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Load verb directly from IndexedDB
        const verb = await DirectVerbService.getVerbById(verbId);
        
        if (!verb) {
          setError(`Verb with ID ${verbId} not found`);
          setLoading(false);
          return;
        }
        
        // Set debug info
        setDebugInfo({
          original: verb,
          id: verb.id,
          createdAt: verb.createdAt,
          updatedAt: verb.updatedAt
        });
        
        // Transform verb data to form format
        setFormData({
          frenchInfinitive: verb.infinitive || '',
          englishInfinitive: verb.english || '',
          group: verb.group || '1',
          presentTense: {
            je: verb.conjugations?.je?.[0] || '',
            tu: verb.conjugations?.tu?.[0] || '',
            il: verb.conjugations?.il?.[0] || '',
            nous: verb.conjugations?.nous?.[0] || '',
            vous: verb.conjugations?.vous?.[0] || '',
            ils: verb.conjugations?.ils?.[0] || ''
          }
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading verb data:', error);
        setError(`Failed to load verb data: ${error.message || 'Unknown error'}`);
        setLoading(false);
      }
    };
    
    loadVerbData();
  }, [verbId]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('presentTense.')) {
      const subject = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        presentTense: {
          ...prev.presentTense,
          [subject]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Use our direct verb service to update the verb
      const result = await DirectVerbService.updateVerb(verbId, formData);
      
      // Update debug info with result
      setDebugInfo(prev => ({
        ...prev,
        result,
        formData: { ...formData }
      }));
      
      if (result.success) {
        setSuccessMessage('Verb updated successfully!');
        
        // Notify parent of success
        if (onSuccess) {
          onSuccess(result.verb);
        }
      } else {
        setError(`Failed to update verb: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating verb:', error);
      setError(`Failed to update verb: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // If loading, show spinner
  if (loading) {
    return (
      <div className="p-4 bg-gray-800 rounded-md">
        <div className="flex justify-center items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse delay-75"></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse delay-150"></div>
        </div>
        <p className="text-center text-sm text-gray-400 mt-2">Loading verb data...</p>
      </div>
    );
  }

  // If error and no form data, show error
  if (error && !formData.frenchInfinitive) {
    return (
      <div className="p-4 bg-red-900/30 border border-red-700 rounded-md">
        <h3 className="text-red-400 font-semibold">Error</h3>
        <p className="text-white">{error}</p>
        <button
          onClick={onCancel}
          className="mt-3 bg-gray-700 hover:bg-gray-600 text-white px-4 py-1 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-md border border-gray-700">
      {/* Success message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-md">
          <p className="text-green-400">{successMessage}</p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-md">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* French Infinitive */}
        <div>
          <label className="block text-gray-300 mb-1" htmlFor="frenchInfinitive">
            French Infinitive
          </label>
          <input
            type="text"
            id="frenchInfinitive"
            name="frenchInfinitive"
            value={formData.frenchInfinitive}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            required
          />
        </div>
        
        {/* English Infinitive */}
        <div>
          <label className="block text-gray-300 mb-1" htmlFor="englishInfinitive">
            English Infinitive
          </label>
          <input
            type="text"
            id="englishInfinitive"
            name="englishInfinitive"
            value={formData.englishInfinitive}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            required
          />
        </div>
        
        {/* Group */}
        <div>
          <label className="block text-gray-300 mb-1" htmlFor="group">
            Verb Group
          </label>
          <select
            id="group"
            name="group"
            value={formData.group}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
          >
            <option value="1">1st Group (-er)</option>
            <option value="2">2nd Group (-ir)</option>
            <option value="3">3rd Group (-re)</option>
            <option value="4">Irregular Verbs</option>
          </select>
        </div>
        
        {/* Present Tense Conjugations */}
        <div>
          <h3 className="text-lg text-gray-300 font-medium mb-2">Present Tense Conjugations</h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Je */}
            <div>
              <label className="block text-gray-400 mb-1 text-sm" htmlFor="presentTense.je">
                Je
              </label>
              <input
                type="text"
                id="presentTense.je"
                name="presentTense.je"
                value={formData.presentTense.je}
                onChange={handleChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            
            {/* Tu */}
            <div>
              <label className="block text-gray-400 mb-1 text-sm" htmlFor="presentTense.tu">
                Tu
              </label>
              <input
                type="text"
                id="presentTense.tu"
                name="presentTense.tu"
                value={formData.presentTense.tu}
                onChange={handleChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            
            {/* Il/Elle */}
            <div>
              <label className="block text-gray-400 mb-1 text-sm" htmlFor="presentTense.il">
                Il/Elle
              </label>
              <input
                type="text"
                id="presentTense.il"
                name="presentTense.il"
                value={formData.presentTense.il}
                onChange={handleChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            
            {/* Nous */}
            <div>
              <label className="block text-gray-400 mb-1 text-sm" htmlFor="presentTense.nous">
                Nous
              </label>
              <input
                type="text"
                id="presentTense.nous"
                name="presentTense.nous"
                value={formData.presentTense.nous}
                onChange={handleChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            
            {/* Vous */}
            <div>
              <label className="block text-gray-400 mb-1 text-sm" htmlFor="presentTense.vous">
                Vous
              </label>
              <input
                type="text"
                id="presentTense.vous"
                name="presentTense.vous"
                value={formData.presentTense.vous}
                onChange={handleChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            
            {/* Ils/Elles */}
            <div>
              <label className="block text-gray-400 mb-1 text-sm" htmlFor="presentTense.ils">
                Ils/Elles
              </label>
              <input
                type="text"
                id="presentTense.ils"
                name="presentTense.ils"
                value={formData.presentTense.ils}
                onChange={handleChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={() => setShowDebug(!showDebug)}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded text-sm"
          >
            {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
          </button>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
      
      {/* Debug Information Panel */}
      {showDebug && debugInfo && (
        <div className="mt-6 p-3 bg-gray-900 rounded-md border border-gray-700">
          <h3 className="text-sm text-gray-400 font-semibold mb-2">Debug Information</h3>
          <div className="text-xs font-mono overflow-x-auto whitespace-pre text-gray-300">
            {JSON.stringify(debugInfo, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
};

VerbEditor.propTypes = {
  verbId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func
};

export default VerbEditor;