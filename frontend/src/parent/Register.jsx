import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { useRegisterMutation } from '../redux/features/userSlice';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [register, { isLoading, isSuccess, error, data }] = useRegisterMutation();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    role: 'parent'
  });
  
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isSuccess && data) {
      toast.success('Registration successful! Please log in.');
      // Navigate after a short delay for better UX
      setTimeout(() => {
        navigate('/parent/login');
      }, 1000);
    }
    
    if (error) {
      // Better error display with specific backend messages
      const errorMsg = 
        error.data?.message || 
        'Registration failed. Please try again.';
      toast.error(errorMsg);
    }
  }, [isSuccess, error, navigate, data]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/[^\d]/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (!formData.address.trim()) errors.address = 'Address is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        // Remove confirmPassword as it's not needed in the backend
        const { confirmPassword, ...userData } = formData;
        await register(userData).unwrap();
      } catch (err) {
        // Error is handled in useEffect
      }
    } else {
      toast.error('Please fix the errors in the form');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header />
      
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="md:flex">
                <div className="md:w-1/2 bg-gradient-to-br from-indigo-600 to-blue-700 p-10 text-white flex flex-col justify-center">
                  <h2 className="text-3xl font-bold mb-6">Join Our Community</h2>
                  <p className="mb-6">Create an account to track your child's school bus in real-time and receive important notifications.</p>
                  <ul className="space-y-4">
                    {[
                      "Real-time bus tracking",
                      "Instant notifications",
                      "Direct communication with drivers",
                      "Schedule management"
                    ].map((benefit, index) => (
                      <motion.li 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 + (index * 0.1) }}
                        className="flex items-center"
                      >
                        <svg className="w-5 h-5 mr-2 text-indigo-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {benefit}
                      </motion.li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <p>Already have an account?</p>
                    <Link to="/parent/login" className="text-indigo-200 hover:text-white font-medium mt-2 inline-block">
                      Log in to your account →
                    </Link>
                  </div>
                </div>
                
                {/* Form Fields - keeping these the same as they look good */}
                <div className="md:w-1/2 p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-800">Parent Registration</h3>
                    <p className="text-gray-600">Fill out the form below to create your account</p>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-gray-700 text-sm font-medium mb-1">First Name</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.firstName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-100'}`}
                          placeholder="John"
                        />
                        {formErrors.firstName && <p className="text-sm text-red-500 mt-1">{formErrors.firstName}</p>}
                      </div>
                      
                      <div>
                        <label htmlFor="lastName" className="block text-gray-700 text-sm font-medium mb-1">Last Name</label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.lastName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-100'}`}
                          placeholder="Doe"
                        />
                        {formErrors.lastName && <p className="text-sm text-red-500 mt-1">{formErrors.lastName}</p>}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-1">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-100'}`}
                        placeholder="youremail@example.com"
                      />
                      {formErrors.email && <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-gray-700 text-sm font-medium mb-1">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.phone ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-100'}`}
                        placeholder="(555) 123-4567"
                      />
                      {formErrors.phone && <p className="text-sm text-red-500 mt-1">{formErrors.phone}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="address" className="block text-gray-700 text-sm font-medium mb-1">Home Address</label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.address ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-100'}`}
                        placeholder="123 Main St, City, State, ZIP"
                      />
                      {formErrors.address && <p className="text-sm text-red-500 mt-1">{formErrors.address}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-1">Password</label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-100'}`}
                        placeholder="••••••••"
                      />
                      {formErrors.password && <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-1">Confirm Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.confirmPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-100'}`}
                        placeholder="••••••••"
                      />
                      {formErrors.confirmPassword && <p className="text-sm text-red-500 mt-1">{formErrors.confirmPassword}</p>}
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition duration-300 flex justify-center items-center"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating Account...
                          </>
                        ) : "Create Account"}
                      </button>
                    </div>
                    
                    <div className="text-center text-gray-500 text-sm">
                      By registering, you agree to our{' '}
                      <Link to="/terms" className="text-indigo-600 hover:text-indigo-800">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-indigo-600 hover:text-indigo-800">
                        Privacy Policy
                      </Link>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}