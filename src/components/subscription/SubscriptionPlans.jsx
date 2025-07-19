import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StripeService } from '../../services/StripeService';
import { useAuth } from '../../contexts/AuthContext';
import SubscriptionSignupForm from './SubscriptionSignupForm';
import CheckoutForm from './CheckoutForm';

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const pricingSectionRef = useRef(null);

  useEffect(() => {
    // Set a single subscription plan
    setLoading(true);
    try {
      const singlePlan = {
        id: 'premium_monthly',
        name: 'Premium Access',
        price: 9.99,
        interval: 'month',
        features: [
          'All vocabulary and verb exercises',
          'Advanced progress tracking',
          'Personalized learning path',
          'Offline access',
          'Priority support'
        ],
      };
      
      setPlans([singlePlan]);
    } catch (error) {
      console.error('Error setting plan:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // If the URL has the #pricing hash, scroll to the pricing section
    if (window.location.hash === '#pricing' && pricingSectionRef.current) {
      setTimeout(() => {
        pricingSectionRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 500);
    }
  }, []);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    
    if (plan.id === 'free') {
      // For free plan, just navigate to the practice page
      navigate('/practice/words');
    } else if (isAuthenticated) {
      // If user is logged in, show checkout form
      setShowCheckoutModal(true);
    } else {
      // If user is not logged in, show signup form
      setShowSignupModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowSignupModal(false);
    setShowCheckoutModal(false);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center p-12" ref={pricingSectionRef}>
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-lg">Loading plans...</span>
      </div>
    );
  }

  return (
    <div ref={pricingSectionRef} className="animate-fade-in">
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`bg-gray-800 rounded-2xl p-8 border transition-all duration-300 hover:transform hover:scale-105 ${
              plan.id === 'premium_yearly' 
                ? 'border-purple-500 shadow-lg shadow-purple-500/20' 
                : 'border-gray-700 hover:border-blue-500'
            }`}
          >
            {/* Plan header */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-center justify-center mb-2">
                <span className="text-4xl font-bold">${plan.price}</span>
                {plan.interval !== 'forever' && (
                  <span className="text-gray-400 ml-1">/{plan.interval}</span>
                )}
              </div>
              
              {/* Original price display for discounted plans */}
              {plan.originalPrice && (
                <div className="text-gray-400 mb-2">
                  <span className="line-through">${plan.originalPrice}</span>
                </div>
              )}
            </div>
            
            {/* Feature list */}
            <div className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <svg
                    className={`w-5 h-5 mr-2 ${
                      plan.id === 'premium_yearly' ? 'text-purple-400' : 'text-blue-400'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
            
            {/* CTA button */}
            <button
              onClick={() => handleSelectPlan(plan)}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                plan.id === 'premium_yearly'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                  : plan.id === 'free'
                  ? 'border border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
              }`}
            >
              {plan.id === 'free' ? 'Start Free' : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>
      
      {/* Money-back guarantee and secure payment info */}
      <div className="text-center mt-8 space-y-2">
        <div className="flex items-center justify-center">
          <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-gray-300">30-day money-back guarantee</span>
        </div>
        <div className="flex items-center justify-center">
          <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-gray-300">Secure payment processing</span>
        </div>
      </div>

      {/* Subscription signup modal */}
      {showSignupModal && selectedPlan && (
        <SubscriptionSignupForm 
          plan={selectedPlan} 
          onClose={handleCloseModal} 
        />
      )}
      
      {/* Checkout modal */}
      {showCheckoutModal && selectedPlan && (
        <CheckoutForm 
          plan={selectedPlan} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};

export default SubscriptionPlans;