// src/services/StripeService.js
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.yourbackend.com';

/**
 * Service to handle Stripe API interactions
 * In a production app, most calls would go through your backend
 * for security and to avoid exposing your Stripe secret key
 */
class StripeService {
  constructor() {
    this.loadStripe();
  }

  /**
   * Loads the Stripe.js library
   */
  async loadStripe() {
    if (!window.Stripe) {
      // Load Stripe.js dynamically
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      document.body.appendChild(script);
      
      // Wait for the script to load
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }
    
    // Initialize Stripe
    this.stripe = window.Stripe(STRIPE_PUBLIC_KEY);
  }

  /**
   * Creates a checkout session for subscription
   * @param {Object} options - Checkout options
   * @param {string} options.priceId - Stripe price ID
   * @param {string} options.customerId - Optional Stripe customer ID
   * @param {string} options.successUrl - URL to redirect after successful payment
   * @param {string} options.cancelUrl - URL to redirect if user cancels
   * @returns {Promise<Object>} The checkout session
   */
  async createCheckoutSession(options) {
    // In a real app, this would make a call to your backend
    // which would create a checkout session using your Stripe secret key
    
    // Mock implementation for demo purposes
    await this.ensureStripeLoaded();

    // In production, make a real API call like this:
    // const response = await fetch(`${API_BASE_URL}/stripe/create-checkout-session`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    //   },
    //   body: JSON.stringify(options),
    // });
    // const session = await response.json();
    
    // For this demo, we'll create a mock session
    const mockSessionId = 'cs_test_' + Math.random().toString(36).substr(2, 9);
    
    // This would typically return a sessionId to use with redirectToCheckout
    return { id: mockSessionId };
  }

  /**
   * Redirects to Stripe Checkout
   * @param {string} sessionId - Checkout session ID
   * @returns {Promise<{error?: Error}>} Result object
   */
  async redirectToCheckout(sessionId) {
    await this.ensureStripeLoaded();
    
    // In a real implementation, this would redirect to Stripe
    // return this.stripe.redirectToCheckout({ sessionId });
    
    // For demo, we'll simulate a successful payment after a delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate a successful checkout
    const subscription = {
      id: 'sub_' + Math.random().toString(36).substr(2, 9),
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      plan: {
        id: 'premium_monthly',
        amount: 999, // amount in cents
        interval: 'month',
        product: 'prod_french_premium'
      }
    };
    
    // Save to localStorage for the demo
    localStorage.setItem('frenchmaster_subscription', JSON.stringify(subscription));
    
    return { success: true, subscription };
  }

  /**
   * Ensures Stripe is loaded before making API calls
   * @private 
   */
  async ensureStripeLoaded() {
    if (!this.stripe) {
      await this.loadStripe();
    }
    return this.stripe;
  }

  /**
   * Fetches customer's subscription details
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} Subscription details
   */
  async getSubscription(customerId) {
    // In production, this would make a backend API call
    // const response = await fetch(`${API_BASE_URL}/stripe/subscription/${customerId}`, {
    //   headers: {
    //     'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    //   },
    // });
    // return await response.json();
    
    // For demo, check localStorage
    const storedSubscription = localStorage.getItem('frenchmaster_subscription');
    if (storedSubscription) {
      return JSON.parse(storedSubscription);
    }
    
    return null;
  }

  /**
   * Creates a payment method and attaches it to a customer
   * @param {Object} paymentMethodData - Payment method data
   * @returns {Promise<Object>} Created payment method
   */
  async createPaymentMethod(paymentMethodData) {
    await this.ensureStripeLoaded();
    
    // In a real implementation, this would create a payment method with Stripe
    // and then make a backend call to attach it to the customer
    const mockPaymentMethod = {
      id: 'pm_' + Math.random().toString(36).substr(2, 9),
      card: {
        brand: 'visa',
        last4: paymentMethodData.card.number.slice(-4),
        exp_month: paymentMethodData.card.exp_month,
        exp_year: paymentMethodData.card.exp_year
      },
      billing_details: {
        name: paymentMethodData.billing_details.name,
      }
    };
    
    return mockPaymentMethod;
  }

  /**
   * Creates a subscription directly (without checkout)
   * @param {Object} options - Subscription options
   * @returns {Promise<Object>} Created subscription
   */
  async createSubscription(options) {
    // In production, this would make a backend API call
    // const response = await fetch(`${API_BASE_URL}/stripe/subscriptions`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    //   },
    //   body: JSON.stringify(options),
    // });
    // return await response.json();
    
    // For demo, create a mock subscription
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const subscription = {
      id: 'sub_' + Math.random().toString(36).substr(2, 9),
      customer: options.customer,
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      plan: {
        id: options.plan,
        amount: 999, // $9.99
        interval: 'month',
        product: 'prod_french_premium'
      },
      latest_invoice: {
        payment_intent: {
          client_secret: 'pi_secret_' + Math.random().toString(36).substr(2, 9)
        }
      }
    };
    
    // Save to localStorage for the demo
    localStorage.setItem('frenchmaster_subscription', JSON.stringify(subscription));
    
    return subscription;
  }

  /**
   * Updates an existing subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated subscription
   */
  async updateSubscription(subscriptionId, updateData) {
    // In production, this would make a backend API call
    // const response = await fetch(`${API_BASE_URL}/stripe/subscriptions/${subscriptionId}`, {
    //   method: 'PATCH',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    //   },
    //   body: JSON.stringify(updateData),
    // });
    // return await response.json();
    
    // For demo, update the mock subscription
    const storedSubscription = localStorage.getItem('frenchmaster_subscription');
    if (storedSubscription) {
      const subscription = JSON.parse(storedSubscription);
      const updated = { ...subscription, ...updateData };
      localStorage.setItem('frenchmaster_subscription', JSON.stringify(updated));
      return updated;
    }
    
    throw new Error('Subscription not found');
  }

  /**
   * Cancels a subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Canceled subscription
   */
  async cancelSubscription(subscriptionId) {
    // In production, this would make a backend API call
    // const response = await fetch(`${API_BASE_URL}/stripe/subscriptions/${subscriptionId}`, {
    //   method: 'DELETE',
    //   headers: {
    //     'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    //   },
    // });
    // return await response.json();
    
    // For demo, update the mock subscription
    const storedSubscription = localStorage.getItem('frenchmaster_subscription');
    if (storedSubscription) {
      const subscription = JSON.parse(storedSubscription);
      subscription.status = 'canceled';
      subscription.cancel_at_period_end = true;
      localStorage.setItem('frenchmaster_subscription', JSON.stringify(subscription));
      return subscription;
    }
    
    throw new Error('Subscription not found');
  }
}

// Export a singleton instance
const stripeServiceInstance = new StripeService();
export { stripeServiceInstance as StripeService };