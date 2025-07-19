// src/components/subscription/CheckoutForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StripeService } from '../../services/StripeService';
import { useAuth } from '../../contexts/AuthContext';

const CheckoutForm = ({ plan, onClose }) => {
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
  });
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { user, updateSubscription } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const formatted = value
        .replace(/\s/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim()
        .slice(0, 19);
      
      setPaymentDetails(prev => ({ ...prev, [name]: formatted }));
    } 
    // Format expiry date as MM/YY
    else if (name === 'expiryDate') {
      const formatted = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d{0,2})/, '$1/$2')
        .slice(0, 5);
      
      setPaymentDetails(prev => ({ ...prev, [name]: formatted }));
    } 
    // CVV - numbers only, max 4 digits
    else if (name === 'cvv') {
      const formatted = value.replace(/\D/g, '').slice(0, 4);
      setPaymentDetails(prev => ({ ...prev, [name]: formatted }));
    } 
    // Other fields
    else {
      setPaymentDetails(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate card number - simple validation for mock
    if (!paymentDetails.cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required';
    } else if (paymentDetails.cardNumber.replace(/\s/g, '').length < 16) {
      newErrors.cardNumber = 'Card number must be at least 16 digits';
    }
    
    // Validate cardholder name
    if (!paymentDetails.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }
    
    // Validate expiry date
    if (!paymentDetails.expiryDate.trim()) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (!/^\d{2}\/\d{2}$/.test(paymentDetails.expiryDate)) {
      newErrors.expiryDate = 'Expiry date must be in MM/YY format';
    } else {
      // Check if the card is expired
      const [month, year] = paymentDetails.expiryDate.split('/');
      const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
      const now = new Date();
      if (expiryDate < now) {
        newErrors.expiryDate = 'Card is expired';
      }
    }
    
    // Validate CVV
    if (!paymentDetails.cvv.trim()) {
      newErrors.cvv = 'Security code is required';
    } else if (paymentDetails.cvv.length < 3) {
      newErrors.cvv = 'Security code must be at least 3 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsProcessing(true);
    
    try {
      // Get customer info from user context
      const customerInfo = {
        email: user.email,
        name: user.name
      };
      
      // Process the subscription with Stripe
      // Prepare card data for Stripe
      const cardData = {
        card: {
          number: paymentDetails.cardNumber.replace(/\s/g, ''),
          exp_month: parseInt(paymentDetails.expiryDate.split('/')[0]),
          exp_year: parseInt('20' + paymentDetails.expiryDate.split('/')[1]),
          cvc: paymentDetails.cvv
        },
        billing_details: {
          name: paymentDetails.cardholderName,
          email: customerInfo.email
        }
      };
      
      // First create a payment method
      const paymentMethod = await StripeService.createPaymentMethod(cardData);
      
      // Then create the subscription with the payment method
      const subscription = await StripeService.createSubscription({
        customer: user.id || 'cus_user_' + Math.random().toString(36).substring(2),
        payment_method: paymentMethod.id,
        plan: plan.id
      });
      
      // Store subscription data in localStorage
      localStorage.setItem('frenchmaster_subscription', JSON.stringify({
        id: subscription.id,
        status: subscription.status,
        plan: {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          interval: plan.interval
        },
        customerEmail: user.email,
        createdAt: new Date().toISOString(),
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }));
      
      // Update subscription in context
      updateSubscription(subscription);
      
      // Redirect to success page or account
      navigate('/practice/words');
      
      // Show a success message or toast notification
      console.log('Subscription created successfully:', subscription);
    } catch (error) {
      console.error('Error processing payment:', error);
      setErrors({
        general: error.message || 'An error occurred while processing your payment. Please try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700 relative animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          disabled={isProcessing}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Complete Your Purchase</h2>
          <p className="text-gray-300 mt-2">You're subscribing to the {plan.name} plan</p>
          
          <div className="bg-gray-700/50 rounded-lg p-4 mt-4 border border-gray-600">
            <div className="flex justify-between mb-2">
              <span className="text-gray-300">Plan:</span>
              <span className="font-medium">{plan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Price:</span>
              <span className="font-medium">${plan.price}/{plan.interval}</span>
            </div>
          </div>
        </div>
        
        {errors.general && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg mb-6">
            {errors.general}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-300 mb-1">
                Card Number
              </label>
              <input
                type="text"
                id="cardNumber"
                name="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={paymentDetails.cardNumber}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500 ${
                  errors.cardNumber ? 'border-red-500' : 'border-gray-600'
                }`}
                disabled={isProcessing}
              />
              {errors.cardNumber && (
                <p className="mt-1 text-sm text-red-400">{errors.cardNumber}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-300 mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                id="cardholderName"
                name="cardholderName"
                placeholder="John Doe"
                value={paymentDetails.cardholderName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500 ${
                  errors.cardholderName ? 'border-red-500' : 'border-gray-600'
                }`}
                disabled={isProcessing}
              />
              {errors.cardholderName && (
                <p className="mt-1 text-sm text-red-400">{errors.cardholderName}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-300 mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  id="expiryDate"
                  name="expiryDate"
                  placeholder="MM/YY"
                  value={paymentDetails.expiryDate}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500 ${
                    errors.expiryDate ? 'border-red-500' : 'border-gray-600'
                  }`}
                  disabled={isProcessing}
                />
                {errors.expiryDate && (
                  <p className="mt-1 text-sm text-red-400">{errors.expiryDate}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-300 mb-1">
                  Security Code
                </label>
                <input
                  type="text"
                  id="cvv"
                  name="cvv"
                  placeholder="CVV"
                  value={paymentDetails.cvv}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500 ${
                    errors.cvv ? 'border-red-500' : 'border-gray-600'
                  }`}
                  disabled={isProcessing}
                />
                {errors.cvv && (
                  <p className="mt-1 text-sm text-red-400">{errors.cvv}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Payment...
                </>
              ) : (
                `Subscribe Now - $${plan.price}/${plan.interval}`
              )}
            </button>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-400">
            By subscribing, you agree to our Terms of Service and Privacy Policy
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutForm;