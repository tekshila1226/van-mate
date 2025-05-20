import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../redux/features/userSlice';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading, isSuccess, error, data }] = useLoginMutation();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'driver'
  });
  
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isSuccess && data) {
      toast.success('Login successful!');
      // Navigate after a short delay for better UX
      setTimeout(() => {
        navigate('/driver');
      }, 500);
    }
    
    if (error) {
      // Better error display with specific backend messages
      const errorMsg = 
        error.data?.message || 
        'Login failed. Please check your credentials.';
      toast.error(errorMsg);
    }
  }, [isSuccess, error, navigate, data]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
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
        await login(formData).unwrap();
      } catch (err) {
        // Error is handled in useEffect
      }
    } else {
      toast.error('Please fix the errors in the form');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50">
      <Header />
      
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800">Driver Login</h3>
                  <p className="text-gray-600">Welcome back! Please enter your details</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-amber-100'}`}
                      placeholder="youremail@example.com"
                    />
                    {formErrors.email && <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>}
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="password" className="block text-gray-700 text-sm font-medium">Password</label>
                      <Link to="/forgot-password" className="text-sm text-amber-600 hover:text-amber-800">
                        Forgot password?
                      </Link>
                    </div>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-amber-100'}`}
                      placeholder="••••••••"
                    />
                    {formErrors.password && <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>}
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-medium transition duration-300 flex justify-center items-center"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing In...
                        </>
                      ) : "Sign In"}
                    </button>
                  </div>
                </form>
                
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <p className="text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/driver/register" className="text-amber-600 hover:text-amber-800 font-medium">
                      Create an account
                    </Link>
                  </p>
                </div>

                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-500 mb-4">Or sign in as</p>
                  <div className="flex justify-center">
                    <Link to="/parent/login" className="text-gray-600 hover:text-amber-600 transition-colors">
                      Parent
                    </Link>
                  </div>
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
