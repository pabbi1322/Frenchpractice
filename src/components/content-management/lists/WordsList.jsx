// WordsList.jsx
// Component for displaying the list of words
import React from 'react';
import PropTypes from 'prop-types';
import CategoryService from '../../../services/CategoryService';

const WordsList = ({ words, onEdit, onDelete, readonly = false }) => {
  const categoryClasses = {
    general: 'bg-gray-700 text-gray-200',
    vocabulary: 'bg-purple-700 text-purple-200'
  };

  const getCategoryBadge = (categoryId) => {
    // Use CategoryService to get proper styling 
    // This will provide consistent styling across the app
    const badgeClass = CategoryService.getCategoryColorClass(categoryId);
    
    // Get category name from the service if possible
    let categoryName = categoryId;
    // Capitalize first letter if it's just an ID
    if (categoryId) {
      categoryName = categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
    } else {
      categoryName = 'General';
    }
    
    return (
      <span className={`${badgeClass} text-xs font-medium px-2 py-1 rounded-full`}>
        {categoryName}
      </span>
    );
  };
  
  const renderCategory = (word) => {
    // Now we only render a single category
    // Use the word.category field, defaulting to "general" if not available
    const categoryId = word.category || "general";
    return getCategoryBadge(categoryId);
  };

  const getPartOfSpeechBadge = (pos) => {
    const posClasses = {
      noun: 'bg-blue-800 text-blue-200',
      verb: 'bg-green-800 text-green-200',
      adjective: 'bg-purple-800 text-purple-200',
      adverb: 'bg-yellow-800 text-yellow-200',
      pronoun: 'bg-red-800 text-red-200',
      preposition: 'bg-indigo-800 text-indigo-200',
      conjunction: 'bg-pink-800 text-pink-200',
      interjection: 'bg-orange-800 text-orange-200'
    };
    
    return (
      <span className={`${posClasses[pos] || 'bg-gray-800 text-gray-200'} text-xs font-medium px-2 py-1 rounded-full`}>
        {pos ? pos.charAt(0).toUpperCase() + pos.slice(1) : 'Noun'}
      </span>
    );
  };

  if (words.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No words available in this category.
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              French
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              English
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Categories
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-800 divide-y divide-gray-700">
          {words.map((word) => (
            <tr key={word.id} className="hover:bg-gray-750">
              <td className="px-6 py-4 text-sm font-medium text-white">
                {Array.isArray(word.french) ? word.french[0] : word.french}
              </td>
              <td className="px-6 py-4 text-sm text-gray-300">
                {word.english}
              </td>
              <td className="px-6 py-4 text-sm text-gray-300">
                {renderCategory(word)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => onEdit(word)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(word.id, word.isPredefined)}
                    className="text-red-400 hover:text-red-300 transition-colors ml-4"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

WordsList.propTypes = {
  words: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      french: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
      ]).isRequired,
      english: PropTypes.string.isRequired,
      category: PropTypes.string,
      categories: PropTypes.arrayOf(PropTypes.string),
      partOfSpeech: PropTypes.string,
      isPredefined: PropTypes.bool
    })
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  readonly: PropTypes.bool
};

export default WordsList;