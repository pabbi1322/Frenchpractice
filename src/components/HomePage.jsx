import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ContactForm from './ContactForm';
import SubscriptionPlans from './subscription/SubscriptionPlans';

function HomePage() {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const contactSectionRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
    
    // Check for hash in URL (for scrolling to contact section)
    if (location.hash === '#contact' && contactSectionRef.current) {
      // Add a small delay to ensure the page has loaded properly
      setTimeout(() => {
        contactSectionRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 500);
    }
  }, [location]);
  
  const handleGetStarted = () => {
    // Navigate directly to vocabulary practice page
    navigate('/practice/words');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Hero Header */}
      <header className="fixed top-0 w-full z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            FrenchMaster
          </div>
          <div className="flex gap-4">
            <Link to="/practice/words" className="text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors duration-200">
              Login
            </Link>
            <Link to="/practice/words" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text */}
            <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Master <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">French</span> with Elegance
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Immerse yourself in the beautiful French language through our interactive platform. 
                From vocabulary to conversation, we make learning French engaging and effective.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/practice/words"
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl inline-block"
                >
                  <span className="flex items-center justify-center gap-2">
                    Get Started
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
                <Link to="/practice/words" className="border-2 border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105">
                  Login
                </Link>
              </div>
            </div>

            {/* Right Side - Image */}
            <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl blur-3xl"></div>
                <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-3xl border border-gray-700">
                  <div className="text-center">
                    <div className="text-8xl mb-4">🇫🇷</div>
                    <div className="text-2xl font-bold text-blue-400 mb-2">Bonjour!</div>
                    <div className="text-lg text-gray-300 mb-4">Welcome to French Learning</div>
                    <div className="flex justify-center space-x-4 text-4xl">
                      <span className="animate-bounce delay-0">🥐</span>
                      <span className="animate-bounce delay-100">🗼</span>
                      <span className="animate-bounce delay-200">📚</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 px-6 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            What Our Students Say
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Review 1 - Amandeep */}
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-blue-500 transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  A
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-lg">Amandeep</h4>
                  <div className="flex text-yellow-400">
                    {'★'.repeat(5)}
                  </div>
                </div>
              </div>
              <p className="text-gray-300 italic">
                "This platform transformed my French learning experience. The interactive exercises and clear explanations made grammar so much easier to understand!"
              </p>
            </div>

            {/* Review 2 - Prabh */}
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-purple-500 transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  P
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-lg">Prabh</h4>
                  <div className="flex text-yellow-400">
                    {'★'.repeat(5)}
                  </div>
                </div>
              </div>
              <p className="text-gray-300 italic">
                "I love the vocabulary building exercises! The way words are presented with context makes them stick in my memory. Highly recommended!"
              </p>
            </div>

            {/* Review 3 - Nitasha */}
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-green-500 transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  N
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-lg">Nitasha</h4>
                  <div className="flex text-yellow-400">
                    {'★'.repeat(5)}
                  </div>
                </div>
              </div>
              <p className="text-gray-300 italic">
                "From beginner to conversational in just 3 months! The structured approach and practice modules are incredibly effective. Merci beaucoup!"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="py-20 px-6" id="contact" ref={contactSectionRef}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Contact Us
            </h2>
            <p className="text-xl text-gray-300">
              Have a question or need help? We're here for you.
            </p>
          </div>
          
          <ContactForm id="contact-form" />
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Choose Your Learning Plan
            </h2>
            <p className="text-xl text-gray-300">
              Find the perfect plan to accelerate your French learning journey
            </p>
          </div>
          <div>
            <SubscriptionPlans />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Speak French Fluently?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of successful learners and start your French journey today!
          </p>
          <div className="flex justify-center">
            <Link
              to="/practice/words"
              className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="py-12 px-6 bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                FrenchMaster
              </div>
              <p className="text-gray-400 mt-2">© {new Date().getFullYear()} All rights reserved</p>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;