import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();

  const navigationItems = [
    { path: '/practice/words', label: 'Words Practice' },
    { path: '/practice/verbs', label: 'Verbs Practice' },
    { path: '/practice/numbers', label: 'Numbers Practice' },
    { path: '/practice/sentences', label: 'Sentences Practice' },
    { path: '/direct-verbs', label: 'Direct Verb Editor' },
    { path: '/account', label: 'My Account' },
    { path: '/#contact', label: 'Contact Us', isAnchor: true }
  ];

  const isActive = (path) => {
    return location.pathname === path || 
           (path === '/practice/words' && location.pathname === '/') || 
           (path.startsWith('/practice/') && location.pathname.startsWith(path));
  };

  return (
    <nav className="bg-gray-800 shadow-xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-blue-400">
              French Master
            </Link>
            <div className="hidden md:flex space-x-6">
              {navigationItems.map((item) => (
                item.isAnchor ? (
                  <a
                    key={item.path}
                    href={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105 
                      bg-gray-700 text-gray-300 hover:bg-gray-600 shadow-sm
                    `}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                      isActive(item.path)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 shadow-sm'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        <div className="md:hidden pb-4">
          <div className="flex flex-wrap gap-2">
            {navigationItems.map((item) => (
              item.isAnchor ? (
                <a
                  key={item.path}
                  href={item.path}
                  className="px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 bg-gray-700 text-gray-300 hover:bg-gray-600 shadow-sm"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 shadow-sm'
                  }`}
                >
                  {item.label}
                </Link>
              )
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;