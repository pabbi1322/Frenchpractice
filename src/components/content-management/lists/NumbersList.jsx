// NumbersList.jsx
// Component for displaying the list of numbers
import React from 'react';
import PropTypes from 'prop-types';

const NumbersList = ({ numbers, onEdit, onDelete, readonly = false }) => {
  if (numbers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No numbers available.
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Number
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              French
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-800 divide-y divide-gray-700">
          {numbers.map((number) => (
            <tr key={number.id} className="hover:bg-gray-750">
              <td className="px-6 py-4 text-sm font-medium text-white">
                {number.english}
              </td>
              <td className="px-6 py-4 text-sm text-gray-300">
                {Array.isArray(number.french) ? number.french.join(' / ') : number.french}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => onEdit(number)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(number.id, number.isPredefined)}
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

NumbersList.propTypes = {
  numbers: PropTypes.arrayOf(
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

export default NumbersList;