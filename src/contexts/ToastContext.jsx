import React, { createContext, useContext, useState } from 'react';

// Create context
const ToastContext = createContext();

// Toast types for styling
const TOAST_TYPES = {
  success: {
    bgColor: 'bg-green-500',
    icon: '✓'
  },
  error: {
    bgColor: 'bg-red-500',
    icon: '✕'
  },
  warning: {
    bgColor: 'bg-yellow-500',
    icon: '!'
  },
  info: {
    bgColor: 'bg-blue-500',
    icon: 'ℹ'
  }
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Add a new toast
  const showToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const toast = {
      id,
      message,
      type,
      duration
    };

    setToasts((prev) => [...prev, toast]);

    // Auto remove after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  // Remove a toast
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${TOAST_TYPES[toast.type].bgColor} text-white px-4 py-2 rounded-lg shadow-lg flex items-center`}
            onClick={() => removeToast(toast.id)}
            role="alert"
          >
            <span className="mr-2 font-bold">{TOAST_TYPES[toast.type].icon}</span>
            <p>{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

export default ToastContext;