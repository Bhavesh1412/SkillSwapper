// src/contexts/SkillContext.js
// Skills context for managing skills state and operations

import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { skillAPI } from '../services/api';
import { useAuth } from './AuthContext';

const SkillContext = createContext();

export const useSkills = () => {
  const context = useContext(SkillContext);
  if (!context) {
    throw new Error('useSkills must be used within a SkillProvider');
  }
  return context;
};

export const SkillProvider = ({ children }) => {
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [skillsLoaded, setSkillsLoaded] = useState(false);
  
  const { updateUserSkills, user, isAuthenticated } = useAuth();

  // Load all available skills
  const loadAllSkills = async (force = false) => {
    if (skillsLoaded && !force) return;

    try {
      setLoading(true);
      const response = await skillAPI.getAllSkills();
      
      if (response.success) {
        setAllSkills(response.data.skills);
        setSkillsLoaded(true);
      }
    } catch (error) {
      console.error('Failed to load skills:', error);
      toast.error('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  // Load skills on mount
  useEffect(() => {
    loadAllSkills();
  }, []);

  // Add skills to user's "have" list
  const addSkillsToHave = async (skills) => {
    if (!isAuthenticated) {
      toast.error('Please log in to manage skills');
      return { success: false };
    }

    try {
      setLoading(true);
      
      const response = await skillAPI.addToHave(skills);
      
      if (response.success) {
        // Update user's skills in auth context
        updateUserSkills(response.data.allSkillsHave, null);
        
        // Update all skills list if new skills were created
        await loadAllSkills(true);
        
        toast.success(response.message);
        return { success: true, data: response.data };
      } else {
        toast.error(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add skills';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Add skills to user's "want" list
  const addSkillsToWant = async (skills) => {
    if (!isAuthenticated) {
      toast.error('Please log in to manage skills');
      return { success: false };
    }

    try {
      setLoading(true);
      
      const response = await skillAPI.addToWant(skills);
      
      if (response.success) {
        // Update user's skills in auth context
        updateUserSkills(null, response.data.allSkillsWant);
        
        // Update all skills list if new skills were created
        await loadAllSkills(true);
        
        toast.success(response.message);
        return { success: true, data: response.data };
      } else {
        toast.error(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add skills';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Remove skill from "have" list
  const removeSkillFromHave = async (skillId) => {
    if (!isAuthenticated) {
      toast.error('Please log in to manage skills');
      return { success: false };
    }

    try {
      setLoading(true);
      
      const response = await skillAPI.removeFromHave(skillId);
      
      if (response.success) {
        // Update user's skills in auth context
        updateUserSkills(response.data.allSkillsHave, null);
        
        toast.success(response.message);
        return { success: true };
      } else {
        toast.error(response.message);
        return { success: false };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to remove skill';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Remove skill from "want" list
  const removeSkillFromWant = async (skillId) => {
    if (!isAuthenticated) {
      toast.error('Please log in to manage skills');
      return { success: false };
    }

    try {
      setLoading(true);
      
      const response = await skillAPI.removeFromWant(skillId);
      
      if (response.success) {
        // Update user's skills in auth context
        updateUserSkills(null, response.data.allSkillsWant);
        
        toast.success(response.message);
        return { success: true };
      } else {
        toast.error(response.message);
        return { success: false };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to remove skill';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update proficiency level
  const updateProficiency = async (skillId, proficiencyLevel) => {
    if (!isAuthenticated) {
      toast.error('Please log in to manage skills');
      return { success: false };
    }

    try {
      setLoading(true);
      
      const response = await skillAPI.updateProficiency({
        skillId,
        proficiencyLevel
      });
      
      if (response.success) {
        // Update user's skills in auth context
        updateUserSkills(response.data.allSkillsHave, null);
        
        toast.success(response.message);
        return { success: true };
      } else {
        toast.error(response.message);
        return { success: false };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update proficiency';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update urgency level
  const updateUrgency = async (skillId, urgencyLevel) => {
    if (!isAuthenticated) {
      toast.error('Please log in to manage skills');
      return { success: false };
    }

    try {
      setLoading(true);
      
      const response = await skillAPI.updateUrgency({
        skillId,
        urgencyLevel
      });
      
      if (response.success) {
        // Update user's skills in auth context
        updateUserSkills(null, response.data.allSkillsWant);
        
        toast.success(response.message);
        return { success: true };
      } else {
        toast.error(response.message);
        return { success: false };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update urgency';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Search skills by name
  const searchSkills = (searchTerm) => {
    if (!searchTerm) return allSkills;
    
    const term = searchTerm.toLowerCase();
    return allSkills.filter(skill =>
      skill.skill_name.toLowerCase().includes(term)
    );
  };

  // Get skill suggestions based on user's current skills
  const getSkillSuggestions = (type = 'want', limit = 5) => {
    if (!user) return [];

    const userSkillNames = type === 'have' 
      ? user.skills_have?.map(s => s.skill_name.toLowerCase()) || []
      : user.skills_want?.map(s => s.skill_name.toLowerCase()) || [];

    // Filter out skills user already has/wants
    const suggestions = allSkills.filter(skill =>
      !userSkillNames.includes(skill.skill_name.toLowerCase())
    );

    // Return random suggestions (in a real app, this could be smarter)
    return suggestions
      .sort(() => 0.5 - Math.random())
      .slice(0, limit);
  };

  // Check if skill exists in database
  const skillExists = (skillName) => {
    return allSkills.some(skill =>
      skill.skill_name.toLowerCase() === skillName.toLowerCase()
    );
  };

  const value = {
    // State
    allSkills,
    loading,
    skillsLoaded,
    
    // Actions
    loadAllSkills,
    addSkillsToHave,
    addSkillsToWant,
    removeSkillFromHave,
    removeSkillFromWant,
    updateProficiency,
    updateUrgency,
    
    // Utilities
    searchSkills,
    getSkillSuggestions,
    skillExists,
  };

  return (
    <SkillContext.Provider value={value}>
      {children}
    </SkillContext.Provider>
  );
};