// src/components/layout/Navbar.js
// Main navigation component

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, Settings, LogOut, Search, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getImageUrl } from '../../services/api';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
    setIsProfileOpen(false);
  }, [location]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-dropdown')) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <span className="font-heading font-bold text-xl text-gray-900">
                SkillSwapper
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <>
                {/* Authenticated Navigation Links */}
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePath('/dashboard')
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/matches"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePath('/matches')
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  Matches
                </Link>
                <Link
                  to="/profile"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePath('/profile')
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  Profile
                </Link>

                {/* Search Bar */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search skills..."
                    className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>

                {/* Notifications */}
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Bell className="h-5 w-5" />
                </button>

                {/* Profile Dropdown */}
                <div className="relative profile-dropdown">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {user?.profile_pic ? (
                      <img
                        src={getImageUrl(user.profile_pic)}
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover border-2 border-primary-200"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {user?.name || 'User'}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="mr-3 h-4 w-4" />
                        View Profile
                      </Link>
                      <Link
                        to="/profile/edit"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="mr-3 h-4 w-4" />
                        Settings
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Public Navigation Links */}
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePath('/')
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActivePath('/dashboard')
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/matches"
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActivePath('/matches')
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                    }`}
                  >
                    Matches
                  </Link>
                  <Link
                    to="/profile"
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActivePath('/profile')
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                    }`}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/profile/edit"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActivePath('/')
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                    }`}
                  >
                    Home
                  </Link>
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 transition-all duration-200"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;