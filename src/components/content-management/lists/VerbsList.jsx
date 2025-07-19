// VerbsList.jsx
// Component for displaying the list of verbs
import React from 'react';
import PropTypes from 'prop-types';

const VerbsList = ({ verbs, onEdit, onDelete, readonly = false }) => {


  const getGroupBadge = (group) => {
    const groupClasses = {
      '1': 'bg-blue-700 text-blue-200',
      '2': 'bg-purple-700 text-purple-200',
      '3': 'bg-orange-700 text-orange-200',
      '4': 'bg-red-700 text-red-200'
    };
    
    const groupLabels = {
      '1': '1st Group (-er)',
      '2': '2nd Group (-ir)',
      '3': '3rd Group (-re)',
      '4': 'Irregular'
    };
    
    return (
      <span className={`${groupClasses[group] || 'bg-gray-700 text-gray-200'} text-xs font-medium px-2 py-1 rounded-full`}>
        {groupLabels[group] || `Group ${group}`}
      </span>
    );
  };

  if (verbs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No verbs available.
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              French Infinitive
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              English Translation
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Group
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Present Tense
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-800 divide-y divide-gray-700">
          {verbs.map((verb) => (
            <tr key={verb.id} className="hover:bg-gray-750">
              <td className="px-6 py-4 text-sm font-medium text-white">
                <strong>{verb.infinitive || "[Missing infinitive]"}</strong>
                {console.log("Rendering verb.infinitive:", verb.infinitive)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-300">
                <strong>{verb.english || "[Missing English]"}</strong>
                {console.log("Rendering verb.english:", verb.english)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-300">
                {getGroupBadge(verb.group)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-300">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {verb.conjugations && (
                    <>
                      <div>
                        <span className="text-gray-500">je:</span>{' '}
                        <span className="text-white">{verb.conjugations.je && verb.conjugations.je[0]}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">tu:</span>{' '}
                        <span className="text-white">{verb.conjugations.tu && verb.conjugations.tu[0]}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">il/elle/on:</span>{' '}
                        <span className="text-white">{verb.conjugations.il && verb.conjugations.il[0]}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">nous:</span>{' '}
                        <span className="text-white">{verb.conjugations.nous && verb.conjugations.nous[0]}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">vous:</span>{' '}
                        <span className="text-white">{verb.conjugations.vous && verb.conjugations.vous[0]}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">ils/elles:</span>{' '}
                        <span className="text-white">{verb.conjugations.ils && verb.conjugations.ils[0]}</span>
                      </div>
                    </>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => onEdit(verb)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(verb.id, verb.isPredefined)}
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

VerbsList.propTypes = {
  verbs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      infinitive: PropTypes.string.isRequired,
      english: PropTypes.string.isRequired,
      group: PropTypes.string,

      conjugations: PropTypes.shape({
        je: PropTypes.arrayOf(PropTypes.string),
        tu: PropTypes.arrayOf(PropTypes.string),
        il: PropTypes.arrayOf(PropTypes.string),
        nous: PropTypes.arrayOf(PropTypes.string),
        vous: PropTypes.arrayOf(PropTypes.string),
        ils: PropTypes.arrayOf(PropTypes.string)
      }),
      isPredefined: PropTypes.bool
    })
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  readonly: PropTypes.bool
};

export default VerbsList;