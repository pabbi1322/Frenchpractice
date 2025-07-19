import React from 'react';
import { Link } from 'react-router-dom';

const DemoInstructions = () => {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5 mb-6">
      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
        Welcome to the Demo Account!
      </h3>
      <p className="text-gray-700 dark:text-gray-300 mb-3">
        You're currently using the demo account which gives you access to all premium features. Here's what you can do:
      </p>
      
      <ul className="list-disc pl-5 mb-4 space-y-1 text-gray-700 dark:text-gray-300">
        <li>Practice French vocabulary in the <Link to="/practice/words" className="text-blue-600 hover:underline">Words Practice</Link> section</li>
        <li>Learn verb conjugations in the <Link to="/practice/verbs" className="text-blue-600 hover:underline">Verbs Practice</Link> section</li>
        <li>Master French numbers in the <Link to="/practice/numbers" className="text-blue-600 hover:underline">Numbers Practice</Link> section</li>
        <li>Improve your sentence formation in the <Link to="/practice/sentences" className="text-blue-600 hover:underline">Sentences Practice</Link> section</li>
        <li>Access content management to customize your learning materials</li>
      </ul>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        <strong>Demo credentials:</strong> username: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">demo</span>, password: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">demo123</span>
      </div>
    </div>
  );
};

export default DemoInstructions;