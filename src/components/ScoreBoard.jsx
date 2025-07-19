import React from 'react';

function ScoreBoard({ score }) {
  const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  
  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-600">
      <div className="flex justify-between items-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">
            {score.correct}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">Correct</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {score.total}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">Total</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
            {percentage}%
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">Accuracy</div>
        </div>
      </div>
      
      {/* Progress Bar */}
      {score.total > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-1">
            <span>Progress</span>
            <span>{score.correct}/{score.total}</span>
          </div>
          <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-700 h-2 rounded-full"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Motivational Messages */}
      {score.total > 0 && (
        <div className="mt-3 text-center">
          {percentage >= 90 && (
            <span className="text-green-600 font-semibold">🌟 Excellent work!</span>
          )}
          {percentage >= 70 && percentage < 90 && (
            <span className="text-blue-600 font-semibold">👍 Great job!</span>
          )}
          {percentage >= 50 && percentage < 70 && (
            <span className="text-yellow-600 font-semibold">📚 Keep practicing!</span>
          )}
          {percentage < 50 && score.total >= 5 && (
            <span className="text-orange-600 font-semibold">💪 Don't give up!</span>
          )}
        </div>
      )}
    </div>
  );
}

export default ScoreBoard;