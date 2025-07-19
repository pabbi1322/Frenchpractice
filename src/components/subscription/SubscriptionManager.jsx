import React, { useState, useEffect } from 'react';
import { StripeService } from '../../services/StripeService';
import { useNavigate } from 'react-router-dom';

const SubscriptionManager = () => {
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const navigate = useNavigate();

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch subscription data from Stripe
      const user = JSON.parse(localStorage.getItem('frenchmaster_user') || '{}');
      const subscriptionData = await StripeService.getSubscription(user.id || 'cus_default');
      
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load subscription information. Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    
    try {
      const result = await StripeService.cancelSubscription(subscription.id);
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      setSubscription(result);
      setMessage({
        type: 'success',
        text: 'Your subscription has been canceled successfully. You will still have access until the end of your current billing period.'
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setMessage({
        type: 'error',
        text: `Failed to cancel subscription: ${error.message}`
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRenewSubscription = async () => {
    // In a real app, this would direct the user to a checkout page for renewal
    navigate('/');
    
    // We now only have one plan at $9.99
    const plan = {
      id: 'premium_monthly',
      name: 'Premium Access',
      price: 9.99,
      interval: 'month'
    };
    
    // Scroll to pricing section
    setTimeout(() => {
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-300">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold mb-4">No Active Subscription</h2>
        <p className="text-gray-300 mb-6">
          You don't have any active subscription. Subscribe to start learning French today!
        </p>
        <button 
          onClick={() => navigate('/')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300"
        >
          View Subscription Plans
        </button>
      </div>
    );
  }

  const isActive = subscription.status === 'active';
  const isCanceled = subscription.status === 'canceled';

  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
      {/* Message banner */}
      {message.text && (
        <div className={`p-4 ${message.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white`}>
          <div className="flex items-center justify-between">
            <p className="flex items-center">
              {message.type === 'error' ? (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {message.text}
            </p>
            <button 
              onClick={() => setMessage({ type: '', text: '' })}
              className="text-white hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`p-6 ${isActive ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-gray-700 to-gray-800'} text-white`}>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{subscription.plan.name} Subscription</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${isActive ? 'bg-green-500' : 'bg-gray-600'}`}>
            {isActive ? 'Active' : isCanceled ? 'Canceled' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="mb-8">
          <div className="text-xl font-bold mb-4 text-blue-400">Subscription Details</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-gray-400 mb-1">Plan</div>
              <div className="text-white text-lg">{subscription.plan.name}</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Price</div>
              <div className="text-white text-lg">${subscription.plan.price}/month</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Status</div>
              <div className="text-white text-lg flex items-center">
                {isActive && (
                  <span className="flex items-center text-green-400">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Active
                  </span>
                )}
                {isCanceled && (
                  <span className="flex items-center text-gray-400">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Canceled
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Subscription ID</div>
              <div className="text-white text-lg font-mono text-sm break-all">{subscription.subscriptionId}</div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="text-xl font-bold mb-4 text-blue-400">Billing Information</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-gray-400 mb-1">Started On</div>
              <div className="text-white">{formatDate(subscription.createdAt)}</div>
            </div>
            {subscription.currentPeriodEnd && (
              <div>
                <div className="text-gray-400 mb-1">Current Period Ends</div>
                <div className="text-white">{formatDate(subscription.currentPeriodEnd)}</div>
              </div>
            )}
            {subscription.canceledAt && (
              <div>
                <div className="text-gray-400 mb-1">Canceled On</div>
                <div className="text-white">{formatDate(subscription.canceledAt)}</div>
              </div>
            )}
            <div>
              <div className="text-gray-400 mb-1">Email</div>
              <div className="text-white">{subscription.customerEmail}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {isActive && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="py-3 px-6 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-semibold transition-all duration-200"
            >
              Cancel Subscription
            </button>
          )}
          {isCanceled && (
            <button
              onClick={handleRenewSubscription}
              className="py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200"
            >
              Renew Subscription
            </button>
          )}
          <button
            onClick={() => navigate('/practice/words')}
            className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200"
          >
            Go to Learning Dashboard
          </button>
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold mb-4">Cancel Subscription</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to cancel your subscription? You will still have access until the end of your current billing period.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="py-2 px-4 border border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                disabled={isCancelling}
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center"
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Yes, Cancel Subscription'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;