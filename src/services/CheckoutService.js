// src/services/CheckoutService.js
/**
 * Mock Checkout Service for subscription management
 * In a real application, this would integrate with Stripe or another payment processor
 */

class CheckoutService {
  constructor() {
    // Initialize with some default plans
    this.plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        interval: 'forever',
        features: [
          'Basic vocabulary practice',
          'Limited progress tracking',
          'Community support'
        ],
      },
      {
        id: 'premium_monthly',
        name: 'Premium Monthly',
        price: 9.99,
        interval: 'month',
        features: [
          'All vocabulary and verb exercises',
          'Advanced progress tracking',
          'Personalized learning path',
          'Offline access',
          'Priority support'
        ],
      },
      {
        id: 'premium_yearly',
        name: 'Premium Yearly',
        price: 99.99,
        interval: 'year',
        originalPrice: 119.88,
        features: [
          'All vocabulary and verb exercises',
          'Advanced progress tracking',
          'Personalized learning path',
          'Offline access',
          'Priority support',
          'Bonus: Cultural content',
          'Save 17% compared to monthly'
        ],
      }
    ];
    
    // Local storage key for subscription data
    this.STORAGE_KEY = 'frenchmaster_subscription';
  }

  /**
   * Get the available pricing plans
   * @returns {Array} Array of plan objects
   */
  getPricingPlans() {
    return this.plans;
  }

  /**
   * Get the current active subscription from local storage
   * @returns {Object|null} The subscription object or null if no subscription exists
   */
  getCurrentSubscription() {
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    if (!storedData) return null;
    
    try {
      const subscription = JSON.parse(storedData);
      return subscription;
    } catch (error) {
      console.error('Error parsing subscription data:', error);
      return null;
    }
  }

  /**
   * Save a subscription to local storage
   * @param {Object} subscription The subscription object to save
   * @private
   */
  _saveSubscription(subscription) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(subscription));
  }

  /**
   * Process a mock checkout session for a subscription
   * @param {Object} plan The selected plan
   * @param {Object} paymentDetails Payment details from the form
   * @param {Object} customerInfo Customer information
   * @returns {Promise<Object>} The created subscription
   */
  async createSubscription(plan, paymentDetails, customerInfo) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create a mock subscription
    const now = new Date();
    let periodEnd;
    
    if (plan.interval === 'month') {
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    } else if (plan.interval === 'year') {
      periodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    } else {
      // Free plan or other intervals
      periodEnd = new Date(now.getFullYear() + 100, now.getMonth(), now.getDate()); // Effectively "forever"
    }
    
    const subscription = {
      subscriptionId: 'sub_' + Math.random().toString(36).substring(2, 15),
      customerId: 'cus_' + Math.random().toString(36).substring(2, 15),
      customerEmail: customerInfo.email,
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        interval: plan.interval
      },
      status: 'active',
      currentPeriodEnd: periodEnd.toISOString(),
      createdAt: now.toISOString(),
      paymentMethod: 'card_' + Math.random().toString(36).substring(2, 10),
      lastFour: paymentDetails.cardNumber.slice(-4)
    };
    
    // Save to local storage
    this._saveSubscription(subscription);
    
    return subscription;
  }

  /**
   * Refresh the subscription status from the "server"
   * @returns {Promise<Object|null>} The updated subscription or null if refresh failed
   */
  async refreshSubscriptionStatus() {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const subscription = this.getCurrentSubscription();
    if (!subscription) return null;
    
    // In a real app, this would call the backend to get latest status
    // For our mock, we'll just check if the subscription is expired
    const currentPeriodEnd = new Date(subscription.currentPeriodEnd);
    const now = new Date();
    
    if (now > currentPeriodEnd && subscription.status !== 'canceled') {
      // Subscription expired
      subscription.status = 'inactive';
      this._saveSubscription(subscription);
    }
    
    return subscription;
  }

  /**
   * Cancel the current subscription
   * @returns {Promise<Object>} The updated subscription
   */
  async cancelSubscription() {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const subscription = this.getCurrentSubscription();
    if (!subscription) {
      return { error: { message: 'No active subscription found' } };
    }
    
    // Update the subscription
    subscription.status = 'canceled';
    subscription.canceledAt = new Date().toISOString();
    
    // Save the updated subscription
    this._saveSubscription(subscription);
    
    return subscription;
  }
}

// Export a singleton instance
const checkoutServiceInstance = new CheckoutService();
export { checkoutServiceInstance as CheckoutService };