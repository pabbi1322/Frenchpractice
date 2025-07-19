import React from 'react';
import PropTypes from 'prop-types';

/**
 * ProgressTracker component that displays user learning progress
 * Shows visualization of progress and statistics for different content types
 */
const ProgressTracker = ({ progressData, contentType }) => {
  // If no progress data is available
  if (!progressData) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 dark:text-gray-400">
          No progress data available
        </p>
      </div>
    );
  }

  const { words = {}, verbs = {}, sentences = {} } = progressData;
  
  // Determine which content data to show based on contentType prop
  let currentData;
  let contentTitle;
  
  switch (contentType) {
    case 'words':
      currentData = words;
      contentTitle = 'French Words';
      break;
    case 'verbs':
      currentData = verbs;
      contentTitle = 'French Verbs';
      break;
    case 'sentences':
      currentData = sentences;
      contentTitle = 'French Sentences';
      break;
    default:
      // If no specific content type is specified, show all content types
      currentData = null;
      contentTitle = 'All Content';
  }

  const calculatePercentage = (seen, total) => {
    if (total === 0) return 0;
    return Math.round((seen / total) * 100);
  };

  // Display specific content type stats if specified
  if (currentData) {
    const { seen = 0, total = 0 } = currentData;
    const percentage = calculatePercentage(seen, total);
    
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{contentTitle}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {seen} / {total} ({percentage}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div 
            className="bg-blue-600 dark:bg-blue-500 h-4 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${percentage}%` }}
          >
          </div>
        </div>
        <div className="mt-4">
          {percentage === 100 ? (
            <div className="text-center bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-2 rounded-lg">
              <span className="font-semibold">Congratulations!</span> You've learned all {contentTitle.toLowerCase()}!
            </div>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {total - seen} {contentTitle.toLowerCase()} remaining to be learned
            </div>
          )}
        </div>
      </div>
    );
  }

  // Display all content types if no specific type is specified
  return (
    <div className="w-full space-y-6">
      {/* Words Progress */}
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">French Words</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {words.seen || 0} / {words.total || 0} ({calculatePercentage(words.seen || 0, words.total || 0)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div 
            className="bg-blue-600 dark:bg-blue-500 h-4 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${calculatePercentage(words.seen || 0, words.total || 0)}%` }}
          >
          </div>
        </div>
      </div>

      {/* Verbs Progress */}
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">French Verbs</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {verbs.seen || 0} / {verbs.total || 0} ({calculatePercentage(verbs.seen || 0, verbs.total || 0)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div 
            className="bg-purple-600 dark:bg-purple-500 h-4 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${calculatePercentage(verbs.seen || 0, verbs.total || 0)}%` }}
          >
          </div>
        </div>
      </div>

      {/* Sentences Progress */}
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">French Sentences</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {sentences.seen || 0} / {sentences.total || 0} ({calculatePercentage(sentences.seen || 0, sentences.total || 0)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div 
            className="bg-green-600 dark:bg-green-500 h-4 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${calculatePercentage(sentences.seen || 0, sentences.total || 0)}%` }}
          >
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="w-full pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-gray-800 dark:text-white">Overall Progress</span>
          <span className="font-medium text-gray-800 dark:text-white">
            {(words.seen || 0) + (verbs.seen || 0) + (sentences.seen || 0)} / {(words.total || 0) + (verbs.total || 0) + (sentences.total || 0)}
          </span>
        </div>
        <div className="text-center mt-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Keep practicing to improve your French language skills!
          </span>
        </div>
      </div>
    </div>
  );
};

ProgressTracker.propTypes = {
  progressData: PropTypes.shape({
    words: PropTypes.shape({
      seen: PropTypes.number,
      total: PropTypes.number
    }),
    verbs: PropTypes.shape({
      seen: PropTypes.number,
      total: PropTypes.number
    }),
    sentences: PropTypes.shape({
      seen: PropTypes.number,
      total: PropTypes.number
    })
  }),
  contentType: PropTypes.oneOf(['words', 'verbs', 'sentences'])
};

export default ProgressTracker;