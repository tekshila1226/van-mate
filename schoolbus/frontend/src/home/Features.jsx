import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  HiLocationMarker, 
  HiUserGroup, 
  HiClock, 
  HiBell, 
  HiPhone, 
  HiCreditCard, 
  HiChartBar, 
  HiShieldCheck,
  HiCog,
  HiDocumentReport,
  HiOutlineLightningBolt,
  HiOutlineDeviceMobile
} from 'react-icons/hi';
import Header from './components/Header';
import Footer from './components/Footer';

export default function Features() {
  // Define features by user type
  const userFeatures = [
    {
      userType: 'Parents',
      icon: <HiUserGroup className="w-12 h-12 text-indigo-600" />,
      description: "Stay connected with your child's school transportation journey",
      features: [
        {
          title: 'Real-time GPS Tracking',
          description: 'Monitor your child\'s bus location in real-time, with accurate ETA to stops',
          icon: <HiLocationMarker className="w-6 h-6 text-indigo-500" />
        },
        {
          title: 'Pickup & Dropoff Notifications',
          description: 'Receive instant alerts when your child boards or exits the bus',
          icon: <HiBell className="w-6 h-6 text-indigo-500" />
        },
        {
          title: 'Attendance Reporting',
          description: 'Easily report absences or late arrivals directly through the app',
          icon: <HiClock className="w-6 h-6 text-indigo-500" />
        },
        {
          title: 'Direct Communication',
          description: 'Message drivers and school administrators securely within the platform',
          icon: <HiPhone className="w-6 h-6 text-indigo-500" />
        }
      ]
    },
    {
      userType: 'Drivers',
      icon: <HiOutlineDeviceMobile className="w-12 h-12 text-amber-600" />,
      description: "Streamline your routes and manage student transportation effortlessly",
      features: [
        {
          title: 'Digital Attendance',
          description: 'Mark student pickups and dropoffs with simple taps, eliminating paperwork',
          icon: <HiClock className="w-6 h-6 text-amber-500" />
        },
        {
          title: 'Optimized Routes',
          description: 'Follow turn-by-turn directions with optimized routes for efficiency',
          icon: <HiLocationMarker className="w-6 h-6 text-amber-500" />
        },
        {
          title: 'Student Information',
          description: 'Access important details about students, including emergency contacts',
          icon: <HiUserGroup className="w-6 h-6 text-amber-500" />
        },
        {
          title: 'Emergency Reporting',
          description: 'One-touch emergency reporting with instant notification to administrators',
          icon: <HiBell className="w-6 h-6 text-amber-500" />
        }
      ]
    },
    {
      userType: 'Administrators',
      icon: <HiCog className="w-12 h-12 text-blue-600" />,
      description: "Comprehensive tools to manage your entire transportation system",
      features: [
        {
          title: 'Fleet Management',
          description: 'Track maintenance, fuel usage, and vehicle status across your entire fleet',
          icon: <HiShieldCheck className="w-6 h-6 text-blue-500" />
        },
        {
          title: 'Route Planning',
          description: 'Create and optimize routes based on student addresses and school locations',
          icon: <HiOutlineLightningBolt className="w-6 h-6 text-blue-500" />
        },
        {
          title: 'Comprehensive Reporting',
          description: 'Generate detailed reports on attendance, route efficiency, and more',
          icon: <HiDocumentReport className="w-6 h-6 text-blue-500" />
        },
        {
          title: 'Payment Processing',
          description: 'Manage student transportation fees with integrated payment processing',
          icon: <HiCreditCard className="w-6 h-6 text-blue-500" />
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-white to-indigo-50 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <motion.h1 
                className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Powerful Features for Safer School Transportation
              </motion.h1>
              <motion.p 
                className="text-xl text-gray-600 mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Our comprehensive solution connects parents, drivers, and school administrators
                to ensure children's safety and streamline transportation logistics.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Link 
                  to="/register" 
                  className="inline-block bg-indigo-600 text-white py-3 px-8 rounded-lg font-medium text-lg hover:bg-indigo-700 transition-colors mr-4"
                >
                  Get Started
                </Link>
                <Link 
                  to="/contact" 
                  className="inline-block bg-white text-indigo-600 border border-indigo-600 py-3 px-8 rounded-lg font-medium text-lg hover:bg-indigo-50 transition-colors"
                >
                  Contact Sales
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Core Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Tailored Features for Every User</h2>
              <p className="text-lg text-gray-600">
                Our platform offers specialized functionality for parents, drivers, and school administrators,
                ensuring everyone has the tools they need.
              </p>
            </div>
            
            <div className="space-y-20">
              {userFeatures.map((userFeature, userIndex) => (
                <motion.div 
                  key={userFeature.userType}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * userIndex }}
                  className={`
                    ${userIndex % 2 === 1 ? 'md:flex-row-reverse' : ''}
                    md:flex items-center gap-12
                  `}
                >
                  <div className="md:w-1/2 mb-10 md:mb-0">
                    <div className={`
                      p-6 rounded-xl inline-flex mb-6
                      ${userIndex === 0 ? 'bg-indigo-100' : userIndex === 1 ? 'bg-amber-100' : 'bg-blue-100'}
                    `}>
                      {userFeature.icon}
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                      For {userFeature.userType}
                    </h3>
                    <p className="text-xl text-gray-600 mb-6">
                      {userFeature.description}
                    </p>
                    <Link 
                      className={`
                        inline-block py-2 px-6 rounded-lg font-medium transition-colors
                        ${userIndex === 0 
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                          : userIndex === 1 
                            ? 'bg-amber-600 text-white hover:bg-amber-700' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }
                      `}
                    >
                      Learn More
                    </Link>
                  </div>
                  
                  <div className="md:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userFeature.features.map((feature, featureIndex) => (
                      <motion.div 
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 + (0.1 * featureIndex) }}
                        className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm"
                      >
                        <div className="mb-4">
                          {feature.icon}
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h4>
                        <p className="text-gray-600">{feature.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Benefits Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Platform?</h2>
              <p className="text-lg text-gray-600">
                Beyond features, our solution provides tangible benefits that improve safety,
                efficiency, and peace of mind.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  title: 'Enhanced Safety',
                  description: 'Real-time tracking, attendance verification, and emergency protocols ensure students are always accounted for.',
                  icon: <HiShieldCheck className="w-10 h-10 text-green-600" />,
                  color: 'bg-green-50 border-green-200'
                },
                {
                  title: 'Time Savings',
                  description: 'Automated processes and optimized routes reduce administrative work and commute times.',
                  icon: <HiClock className="w-10 h-10 text-indigo-600" />,
                  color: 'bg-indigo-50 border-indigo-200'
                },
                {
                  title: 'Cost Efficiency',
                  description: 'Optimize fuel usage, reduce paperwork, and streamline operations to minimize transportation costs.',
                  icon: <HiCreditCard className="w-10 h-10 text-amber-600" />,
                  color: 'bg-amber-50 border-amber-200'
                },
                {
                  title: 'Data-Driven Decisions',
                  description: 'Comprehensive analytics help identify trends and make informed improvements to your transportation system.',
                  icon: <HiChartBar className="w-10 h-10 text-blue-600" />,
                  color: 'bg-blue-50 border-blue-200'
                },
                {
                  title: 'Peace of Mind',
                  description: 'Parents know exactly where their children are during the transportation process, reducing anxiety and uncertainty.',
                  icon: <HiBell className="w-10 h-10 text-purple-600" />,
                  color: 'bg-purple-50 border-purple-200'
                },
                {
                  title: 'Easy Integration',
                  description: 'Our platform works seamlessly with existing school management systems and transportation infrastructure.',
                  icon: <HiCog className="w-10 h-10 text-gray-600" />,
                  color: 'bg-gray-50 border-gray-200'
                }
              ].map((benefit, index) => (
                <motion.div 
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  className={`p-6 rounded-xl border shadow-sm ${benefit.color}`}
                >
                  <div className="mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 bg-indigo-600">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-6">Ready to transform your school transportation?</h2>
              <p className="text-xl text-indigo-100 mb-8">
                Join thousands of schools that have improved safety, reduced costs, and simplified
                their transportation management with our platform.
              </p>
              <div className="space-x-4">
                <Link 
                  to="/parent/register" 
                  className="inline-block bg-white text-indigo-600 py-3 px-8 rounded-lg font-medium text-lg hover:bg-gray-100 transition-colors"
                >
                  Start Free Trial
                </Link>
                <Link 
                  to="/pricing" 
                  className="inline-block bg-transparent text-white border border-white py-3 px-8 rounded-lg font-medium text-lg hover:bg-indigo-700 transition-colors"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}