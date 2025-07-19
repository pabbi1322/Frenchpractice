// src/components/subscription/SubscriptionStatus.jsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const SubscriptionStatus = () => {
  const { user, subscription, isPaidUser } = useAuth();

  if (!user) {
    return null;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'past_due':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'canceled':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlanName = (planId) => {
    switch (planId) {
      case 'premium_monthly':
        return 'Premium Monthly';
      case 'premium_yearly':
        return 'Premium Yearly';
      default:
        return 'Free';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Subscription Status
      </h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Plan:
          </span>
          <span className="text-sm text-gray-900 dark:text-white">
            {subscription ? getPlanName(subscription.planId) : 'Free'}
          </span>
        </div>

        {subscription && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status:
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </span>
            </div>

            {subscription.currentPeriodEnd && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {subscription.status === 'active' ? 'Next Billing:' : 'Expires:'}
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {formatDate(subscription.currentPeriodEnd)}
                </span>
              </div>
            )}
          </>
        )}

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Access Level:
          </span>
          <span className="text-sm text-gray-900 dark:text-white">
            {isPaidUser ? 'Premium Access' : 'Basic Access'}
          </span>
        </div>

        {!isPaidUser && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Upgrade to Premium to access all features and unlimited practice sessions.
            </p>
          </div>
        )}

        {subscription && subscription.status === 'past_due' && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Your payment is past due. Please update your payment method to continue enjoying premium features.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionStatus;