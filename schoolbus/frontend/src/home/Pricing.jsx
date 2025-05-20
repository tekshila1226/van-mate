import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { HiCheck, HiOutlineX } from 'react-icons/hi';
import Header from './components/Header';
import Footer from './components/Footer';

export default function Pricing() {
  const pricingPlans = [
    {
      name: 'Basic',
      price: 99,
      period: 'per month',
      description: 'Perfect for small schools with up to 5 buses',
      features: [
        'Real-time bus tracking',
        'Parent mobile app',
        'Driver attendance tracking',
        'Basic reporting',
        'Email support',
      ],
      notIncluded: [
        'Advanced analytics',
        'Payment processing',
        'API access',
        'White-label customization'
      ],
      ctaText: 'Get Started',
      ctaLink: '/register',
      highlight: false,
      color: 'bg-gray-100 border-gray-200'
    },
    {
      name: 'Professional',
      price: 249,
      period: 'per month',
      description: 'Ideal for growing schools with up to 15 buses',
      features: [
        'Everything in Basic',
        'Payment processing',
        'Advanced analytics',
        'Route optimization',
        'Attendance history (12 months)',
        'Phone & email support',
        'Parent communication tools'
      ],
      notIncluded: [
        'API access',
        'White-label customization'
      ],
      ctaText: 'Start Free Trial',
      ctaLink: '/register',
      highlight: true,
      color: 'bg-indigo-50 border-indigo-200'
    },
    {
      name: 'Enterprise',
      price: 499,
      period: 'per month',
      description: 'For large school districts with unlimited buses',
      features: [
        'Everything in Professional',
        'API access',
        'White-label customization',
        'Dedicated account manager',
        'Unlimited data history',
        'Advanced security features',
        'Custom integration options',
        'SLA with 24/7 support'
      ],
      notIncluded: [],
      ctaText: 'Contact Sales',
      ctaLink: '/contact',
      highlight: false,
      color: 'bg-gray-100 border-gray-200'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <section className="py-20 bg-gradient-to-b from-white to-indigo-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.h1 
                className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Simple, Transparent Pricing
              </motion.h1>
              <motion.p 
                className="text-xl text-gray-600"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Choose the perfect plan for your school's transportation needs
              </motion.p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <motion.div 
                  key={plan.name}
                  className={`rounded-2xl shadow-lg overflow-hidden ${plan.color} border ${plan.highlight ? 'transform md:-translate-y-4' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + (index * 0.1) }}
                >
                  <div className="p-6 md:p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="flex items-end mb-4">
                      <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-600 ml-2">{plan.period}</span>
                    </div>
                    <p className="text-gray-600 mb-6">{plan.description}</p>
                    
                    <Link 
                      to={plan.ctaLink}
                      className={`block w-full py-3 px-4 rounded-lg text-center font-medium ${
                        plan.highlight 
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      } transition-colors`}
                    >
                      {plan.ctaText}
                    </Link>
                  </div>
                  
                  <div className="p-6 md:p-8 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-4">Features included:</h4>
                    <ul className="space-y-3">
                      {plan.features.map(feature => (
                        <li key={feature} className="flex items-start">
                          <HiCheck className="text-green-500 mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {plan.notIncluded.length > 0 && (
                      <>
                        <h4 className="font-medium text-gray-900 mt-6 mb-4">Not included:</h4>
                        <ul className="space-y-3">
                          {plan.notIncluded.map(feature => (
                            <li key={feature} className="flex items-start text-gray-400">
                              <HiOutlineX className="mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-16 text-center max-w-3xl mx-auto">
              <motion.div
                className="bg-white rounded-xl shadow-md p-8 border border-gray-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Need a custom solution?</h3>
                <p className="text-gray-600 mb-6">
                  We understand that every school district has unique requirements. 
                  Contact our sales team to discuss a customized solution that fits your specific needs.
                </p>
                <Link 
                  to="/contact" 
                  className="inline-block bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Contact Sales
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
              
              <div className="space-y-6">
                {[
                  {
                    question: "How does the billing work?",
                    answer: "We bill monthly with the option to pay annually for a 10% discount. All plans include unlimited users within your organization."
                  },
                  {
                    question: "Can I switch plans later?",
                    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated for the current billing period."
                  },
                  {
                    question: "Is there a contract or commitment?",
                    answer: "No long-term contracts. All plans are month-to-month, and you can cancel anytime."
                  },
                  {
                    question: "Do you offer discounts for educational institutions?",
                    answer: "Yes, we offer special pricing for public schools and non-profit educational institutions. Contact our sales team for details."
                  },
                  {
                    question: "What payment methods do you accept?",
                    answer: "We accept all major credit cards, ACH transfers, and purchase orders from qualified institutions."
                  }
                ].map((faq, index) => (
                  <motion.div 
                    key={index}
                    className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 + (index * 0.1) }}
                  >
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}