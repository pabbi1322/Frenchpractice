import React from 'react';

const DemoCredentials = ({ onUseDemo }) => {
  const handleClick = () => {
    if (onUseDemo) {
      onUseDemo('demo@example.com', 'demo123');
    }
  };

  return (
    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">
        Demo Access
      </h3>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
        Want to try the app without creating an account? Use these demo credentials:
      </p>
      <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 mb-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Email:</div>
          <div className="text-sm font-bold text-gray-900 dark:text-gray-200">demo@example.com</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Password:</div>
          <div className="text-sm font-bold text-gray-900 dark:text-gray-200">demo123</div>
        </div>
      </div>
      <button
        onClick={handleClick}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
      >
        Login with Demo Account
      </button>
    </div>
  );
};

export default DemoCredentials;