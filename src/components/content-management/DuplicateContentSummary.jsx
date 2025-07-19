// DuplicateContentSummary.jsx
// Component for showing a summary of duplicate content across all content types
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DuplicateDetectionService from '../../services/DuplicateDetectionService';

const DuplicateContentSummary = ({ onTabChange }) => {
  const [duplicateCounts, setDuplicateCounts] = useState({
    words: 0,
    numbers: 0,
    sentences: 0,
    verbs: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDuplicateCounts = async () => {
      setIsLoading(true);
      try {
        const duplicateWords = await DuplicateDetectionService.findDuplicateContent('words');
        const duplicateNumbers = await DuplicateDetectionService.findDuplicateContent('numbers');
        const duplicateSentences = await DuplicateDetectionService.findDuplicateContent('sentences');
        const duplicateVerbs = await DuplicateDetectionService.findDuplicateContent('verbs');

        const counts = {
          words: duplicateWords.length,
          numbers: duplicateNumbers.length,
          sentences: duplicateSentences.length,
          verbs: duplicateVerbs.length
        };
        
        counts.total = counts.words + counts.numbers + counts.sentences + counts.verbs;
        
        setDuplicateCounts(counts);
      } catch (error) {
        console.error('Error fetching duplicate counts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDuplicateCounts();
  }, []);

  if (isLoading) {
    return <div className="text-gray-400 text-sm">Loading duplicate content statistics...</div>;
  }

  // Don't display anything if there are no duplicates
  if (duplicateCounts.total === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-800 text-yellow-100 p-3 rounded-lg mb-6 text-sm">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">⚠️ Duplicate Content Detected</h3>
        <span className="font-bold">{duplicateCounts.total} total issues</span>
      </div>
      
      <div className="mt-2 flex flex-wrap gap-2">
        {duplicateCounts.words > 0 && (
          <button
            onClick={() => onTabChange('words')}
            className="bg-yellow-700 hover:bg-yellow-600 px-3 py-1 rounded-full text-xs font-medium transition-colors"
          >
            Words: {duplicateCounts.words}
          </button>
        )}
        
        {duplicateCounts.numbers > 0 && (
          <button
            onClick={() => onTabChange('numbers')}
            className="bg-yellow-700 hover:bg-yellow-600 px-3 py-1 rounded-full text-xs font-medium transition-colors"
          >
            Numbers: {duplicateCounts.numbers}
          </button>
        )}
        
        {duplicateCounts.sentences > 0 && (
          <button
            onClick={() => onTabChange('sentences')}
            className="bg-yellow-700 hover:bg-yellow-600 px-3 py-1 rounded-full text-xs font-medium transition-colors"
          >
            Sentences: {duplicateCounts.sentences}
          </button>
        )}
        
        {duplicateCounts.verbs > 0 && (
          <button
            onClick={() => onTabChange('verbs')}
            className="bg-yellow-700 hover:bg-yellow-600 px-3 py-1 rounded-full text-xs font-medium transition-colors"
          >
            Verbs: {duplicateCounts.verbs}
          </button>
        )}
      </div>
      
      <p className="mt-2 text-xs">
        Click on a category to view and manage duplicate content.
      </p>
    </div>
  );
};

export default DuplicateContentSummary;