// src/services/api.js
// API service layer for making HTTP requests to the backend

import axios from 'axios';

// Create axios instance with default config
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('skillswapper_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        status: 'NETWORK_ERROR'
      });
    }

    // Handle HTTP errors
    const { status, data } = error.response;
    
    // Token expired or invalid
    if (status === 401 && data.message?.includes('token')) {
      localStorage.removeItem('skillswapper_token');
      window.location.href = '/login';
      return Promise.reject(data);
    }
    
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  // Register new user
  register: (userData) => API.post('/auth/register', userData),
  
  // Login user
  login: (credentials) => API.post('/auth/login', credentials),
  
  // Verify token
  verifyToken: (token) => API.post('/auth/verify', { token }),
};

// User API
export const userAPI = {
  // Get current user profile
  getMe: () => API.get('/users/me'),
  
  // Get user profile by ID
  getProfile: (userId) => API.get(`/users/profile/${userId}`),
  
  // Update user profile
  updateProfile: (userId, profileData) => 
    API.put(`/users/profile/${userId}`, profileData),
  
  // Get user's documents
  getDocuments: (userId) => API.get(`/users/${userId}/documents`),
  
  // Search users
  searchUsers: (params) => API.get('/users/search', { params }),
};

// Skills API
export const skillAPI = {
  // Get all available skills
  getAllSkills: () => API.get('/skills'),
  
  // Add skills to user's "have" list
  addToHave: (skills) => API.post('/skills/add-to-have', { skills }),
  
  // Add skills to user's "want" list
  addToWant: (skills) => API.post('/skills/add-to-want', { skills }),
  
  // Remove skill from "have" list
  removeFromHave: (skillId) => API.delete(`/skills/remove-from-have/${skillId}`),
  
  // Remove skill from "want" list
  removeFromWant: (skillId) => API.delete(`/skills/remove-from-want/${skillId}`),
  
  // Update proficiency level
  updateProficiency: (data) => API.put('/skills/update-proficiency', data),
  
  // Update urgency level
  updateUrgency: (data) => API.put('/skills/update-urgency', data),
};

// Matches API
export const matchAPI = {
  // Get recommended matches
  getMatches: (params) => API.get('/matches', { params }),
  
  // Get detailed match info
  getDetailedMatch: (userId) => API.get(`/matches/detailed/${userId}`),
  
  // Save a match
  saveMatch: (user2Id) => API.post('/matches/save', { user2Id }),
  
  // Get match statistics
  getStatistics: () => API.get('/matches/statistics'),
};

// Upload API
export const uploadAPI = {
  // Upload documents
  uploadDocuments: (formData) => API.post('/upload/document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // Upload profile picture
  uploadProfilePicture: (formData) => API.post('/upload/profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // Get user's documents
  getDocuments: () => API.get('/upload/documents'),
  
  // Delete document
  deleteDocument: (documentId) => API.delete(`/upload/document/${documentId}`),
};

// Utility function for handling file uploads with progress
export const uploadWithProgress = (url, formData, onProgress) => {
  return API.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgress(percentCompleted);
    },
  });
};

// Utility function to get image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) return imagePath;
  
  // Otherwise, prepend the API base URL
  const baseURL = process.env.REACT_APP_API_URL || '';
  return `${baseURL}${imagePath}`;
};

// Health check
export const healthCheck = () => API.get('/health');

export default API;