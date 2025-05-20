import React, { useEffect } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="container px-4 mx-auto">
          <div className="flex flex-wrap -mx-4">
            <div className="w-full lg:w-1/2 px-4 mb-12 lg:mb-0">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-xl"
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-indigo-900 mb-6">
                  Safe Transit for Every Student
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Modern school bus management that provides real-time tracking, 
                  efficient routing, and peace of mind for parents and schools alike.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/parent/register" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition duration-300">
                    Get Started
                  </Link>
                  <Link to="/contact" className="px-8 py-4 bg-white hover:bg-gray-100 text-indigo-600 font-medium rounded-lg shadow-md hover:shadow-lg transition duration-300 border border-indigo-100">
                    Learn More
                  </Link>
                </div>
              </motion.div>
            </div>
            <div className="w-full lg:w-1/2 px-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative"
              >
                <img 
                  className="w-full h-auto rounded-2xl shadow-2xl" 
                  src="/schoolbus.png" 
                  alt="School Bus Management" 
                />
                <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-yellow-400 rounded-full opacity-20 blur-xl z-0"></div>
                <div className="absolute -top-6 -right-6 w-40 h-40 bg-indigo-400 rounded-full opacity-20 blur-xl z-0"></div>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-10 w-20 h-20 bg-yellow-400 rounded-full opacity-10 blur-xl"></div>
        <div className="absolute bottom-1/3 right-10 w-32 h-32 bg-indigo-400 rounded-full opacity-10 blur-xl"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container px-4 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-indigo-900 mb-4">
              Everything You Need for Bus Management
            </h2>
            <p className="text-xl text-gray-600">
              Our comprehensive solution offers features designed for parents, drivers, and administrators.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Real-time Tracking",
                description: "Monitor bus locations in real-time with GPS technology for peace of mind.",
                icon: "📍",
                color: "bg-gradient-to-br from-blue-50 to-blue-100"
              },
              {
                title: "Route Optimization",
                description: "Efficient route planning to save time, fuel, and reduce environmental impact.",
                icon: "🛣️",
                color: "bg-gradient-to-br from-indigo-50 to-indigo-100"
              },
              {
                title: "Safety Alerts",
                description: "Instant notifications about delays, route changes, or emergencies.",
                icon: "🔔",
                color: "bg-gradient-to-br from-amber-50 to-amber-100"
              },
              {
                title: "Student Attendance",
                description: "Digital check-in and check-out system to monitor student presence.",
                icon: "✅",
                color: "bg-gradient-to-br from-green-50 to-green-100"
              },
              {
                title: "Parent Communication",
                description: "Direct messaging between parents, drivers, and school administration.",
                icon: "💬",
                color: "bg-gradient-to-br from-purple-50 to-purple-100"
              },
              {
                title: "Analytics Dashboard",
                description: "Comprehensive insights and reports for better decision making.",
                icon: "📊",
                color: "bg-gradient-to-br from-cyan-50 to-cyan-100"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`${feature.color} p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300`}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-indigo-900 mb-3">{feature.title}</h3>
                <p className="text-gray-700">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
        <div className="container px-4 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Designed for Everyone
            </h2>
            <p className="text-xl text-indigo-100">
              A solution that serves the needs of all stakeholders in student transportation.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                role: "Parents",
                description: "Track your child's bus location, receive notifications, and communicate with drivers.",
                icon: "👪",
                link: "/parent/login"
              },
              {
                role: "Drivers",
                description: "Access optimized routes, manage student attendance, and receive real-time updates.",
                icon: "🚌",
                link: "/driver/login"
              }
            ].map((role, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-md p-8 rounded-xl"
              >
                <div className="text-4xl mb-4">{role.icon}</div>
                <h3 className="text-2xl font-semibold mb-3">{role.role}</h3>
                <p className="text-indigo-100 mb-6">{role.description}</p>
                <Link
                  to={role.link}
                  className="inline-block px-6 py-3 bg-white text-indigo-700 font-medium rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  Login as {role.role.slice(0, -1)}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container px-4 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-indigo-900 mb-4">
              Trusted by Schools Nationwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our users have to say about our school bus management system.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "The real-time tracking feature gives me peace of mind knowing exactly when my child arrives at school.",
                name: "Sarah Johnson",
                role: "Parent"
              },
              {
                quote: "Route optimization has reduced our fuel costs by 30% and made my job as a driver much easier.",
                name: "Michael Chen",
                role: "Bus Driver"
              },
              {
                quote: "The analytics dashboard provides invaluable insights for our transportation planning.",
                name: "Dr. Williams",
                role: "School Administrator"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-8 rounded-xl shadow-md"
              >
                <svg className="h-10 w-10 text-indigo-400 mb-4" fill="currentColor" viewBox="0 0 32 32">
                  <path d="M10 8c-2.209 0-4 1.791-4 4v10h10V12h-6c0-1.105 0.895-2 2-2v-2zm12 0c-2.209 0-4 1.791-4 4v10h10V12h-6c0-1.105 0.895-2 2-2v-2z"></path>
                </svg>
                <p className="text-gray-700 mb-6 italic">{testimonial.quote}</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold text-indigo-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-yellow-400 to-amber-500 text-indigo-900">
        <div className="container px-4 mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your School Transportation?</h2>
            <p className="text-xl mb-8">Join hundreds of schools already using our platform to ensure safe and efficient student transportation.</p>
            <Link
              to="/contact"
              className="px-8 py-4 bg-indigo-800 hover:bg-indigo-900 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition duration-300 inline-block"
            >
              Schedule a Demo
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}