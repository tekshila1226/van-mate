import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { HiBars3, HiXMark } from 'react-icons/hi2'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src="/logo.png" 
              alt="School Bus Management" 
              className="h-8 w-auto mr-2" 
            />
            <span className="text-xl font-bold text-indigo-900">VANMATE</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/features" className="text-gray-600 hover:text-indigo-700 transition-colors">
              Features
            </Link>
            {/* <Link to="/pricing" className="text-gray-600 hover:text-indigo-700 transition-colors">
              Pricing
            </Link> */}
            <Link to="/contact" className="text-gray-600 hover:text-indigo-700 transition-colors">
              Contact
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/parent/login" className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                Log in
              </Link>
              <Link to="/parent/register" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
                Sign up
              </Link>
            </div>
          </nav>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden rounded-md p-2 text-gray-600 hover:text-indigo-700 hover:bg-gray-100 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <HiXMark className="h-6 w-6" />
            ) : (
              <HiBars3 className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-2">
          <div className="container mx-auto px-4 space-y-1">
            <Link to="/features" className="block py-2 px-4 rounded hover:bg-gray-100 text-gray-700">
              Features
            </Link>
            {/* <Link to="/pricing" className="block py-2 px-4 rounded hover:bg-gray-100 text-gray-700">
              Pricing
            </Link> */}
            <Link to="/contact" className="block py-2 px-4 rounded hover:bg-gray-100 text-gray-700">
              Contact
            </Link>
            <div className="pt-2 pb-3 border-t border-gray-200">
              <Link to="/parent/login" className="block py-2 px-4 rounded hover:bg-gray-100 text-indigo-600 font-medium">
                Log in
              </Link>
              <Link to="/parent/register" className="block py-2 px-4 rounded bg-indigo-600 text-white font-medium mt-2">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}