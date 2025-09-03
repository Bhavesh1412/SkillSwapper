// src/components/skills/SkillSelector.js
// Skill selection component with search and autocomplete

import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';

const SkillSelector = ({ 
  availableSkills = [], 
  onSkillSelect, 
  placeholder = "Search for skills...",
  excludeSkills = [] 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Filter skills based on search term and exclusions
  const filteredSkills = availableSkills.filter(skill => {
    const matchesSearch = skill.skill_name.toLowerCase().includes(searchTerm.toLowerCase());
    const notExcluded = !excludeSkills.includes(skill.skill_name);
    return matchesSearch && notExcluded;
  }).slice(0, 10); // Limit to 10 results

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredSkills.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            handleSkillSelect(filteredSkills[selectedIndex]);
          } else if (searchTerm.trim()) {
            handleSkillSelect({ skill_name: searchTerm.trim() });
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, selectedIndex, filteredSkills, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSkillSelect = (skill) => {
    onSkillSelect(skill);
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(value.length > 0);
    setSelectedIndex(-1);
  };

  return (
    <div className="relative" ref={inputRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => searchTerm && setIsOpen(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto">
          {filteredSkills.length > 0 ? (
            <ul ref={listRef} className="py-1">
              {filteredSkills.map((skill, index) => (
                <li key={skill.id || skill.skill_name}>
                  <button
                    type="button"
                    onClick={() => handleSkillSelect(skill)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                      index === selectedIndex ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                    }`}
                  >
                    {skill.skill_name}
                    <Plus className="h-4 w-4 text-gray-400" />
                  </button>
                </li>
              ))}
            </ul>
          ) : searchTerm.length > 0 ? (
            <div className="px-4 py-3 text-sm text-gray-700">
              <button
                type="button"
                onClick={() => handleSkillSelect({ skill_name: searchTerm.trim() })}
                className="w-full text-left hover:text-primary-600 flex items-center justify-between"
              >
                Add "{searchTerm.trim()}" as a new skill
                <Plus className="h-4 w-4 text-primary-600" />
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">
              No skills found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillSelector;