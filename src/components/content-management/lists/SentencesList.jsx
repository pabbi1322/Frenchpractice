// SentencesList.jsx
// Component for displaying the list of sentences
import React from 'react';
import PropTypes from 'prop-types';

const SentencesList = ({ sentences, onEdit, onDelete, readonly = false }) => {




  if (sentences.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No sentences available in this category.
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
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-800 divide-y divide-gray-700">
          {sentences.map((sentence) => (
            <tr key={sentence.id} className="hover:bg-gray-750">
              <td className="px-6 py-4 text-sm font-medium text-white">
                {Array.isArray(sentence.french) ? sentence.french[0] : sentence.french}
              </td>
              <td className="px-6 py-4 text-sm text-gray-300">
                {sentence.english}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => onEdit(sentence)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(sentence.id, sentence.isPredefined)}
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

SentencesList.propTypes = {
  sentences: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      french: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
      ]).isRequired,
      english: PropTypes.string.isRequired,
      isPredefined: PropTypes.bool
    })
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  readonly: PropTypes.bool
};

export default SentencesList;