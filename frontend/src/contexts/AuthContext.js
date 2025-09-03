// src/contexts/AuthContext.js
// Authentication context for managing user state and auth operations

import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('skillswapper_token');
        
        if (!token) {
          setLoading(false);
          return;
        }

        // Verify token with backend
        const response = await authAPI.verifyToken(token);
        
        if (response.success) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          // Invalid token - clear it
          localStorage.removeItem('skillswapper_token');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('skillswapper_token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const response = await authAPI.login({ email, password });
      
      if (response.success) {
        const { token, user: userData } = response.data;
        
        // Store token
        localStorage.setItem('skillswapper_token', token);
        
        // Update state
        setUser(userData);
        setIsAuthenticated(true);
        
        toast.success(`Welcome back, ${userData.name}!`);
        return { success: true };
      } else {
        toast.error(response.message || 'Login failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      
      const response = await authAPI.register(userData);
      
      if (response.success) {
        const { token, user: newUser } = response.data;
        
        // Store token
        localStorage.setItem('skillswapper_token', token);
        
        // Update state
        setUser(newUser);
        setIsAuthenticated(true);
        
        toast.success(`Welcome to SkillSwapper, ${newUser.name}!`);
        return { success: true };
      } else {
        toast.error(response.message || 'Registration failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    try {
      // Clear token
      localStorage.removeItem('skillswapper_token');
      
      // Clear state
      setUser(null);
      setIsAuthenticated(false);
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Update user profile in context
  const updateUserProfile = (updatedData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...updatedData
    }));
  };

  // Add skills to user profile
  const updateUserSkills = (skillsHave, skillsWant) => {
    setUser(prevUser => ({
      ...prevUser,
      skills_have: skillsHave || prevUser.skills_have,
      skills_want: skillsWant || prevUser.skills_want
    }));
  };

  // Check if user has specific skill
  const hasSkill = (skillName, type = 'have') => {
    if (!user) return false;
    
    const skills = type === 'have' ? user.skills_have : user.skills_want;
    return skills?.some(skill => 
      skill.skill_name.toLowerCase() === skillName.toLowerCase()
    ) || false;
  };

  // Get user's proficiency level for a skill
  const getSkillLevel = (skillName) => {
    if (!user?.skills_have) return null;
    
    const skill = user.skills_have.find(skill => 
      skill.skill_name.toLowerCase() === skillName.toLowerCase()
    );
    
    return skill?.proficiency_level || null;
  };

  // Context value
  const value = {
    // State
    user,
    loading,
    isAuthenticated,
    
    // Actions
    login,
    register,
    logout,
    updateUserProfile,
    updateUserSkills,
    
    // Utilities
    hasSkill,
    getSkillLevel,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};