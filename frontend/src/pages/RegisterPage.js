// src/pages/RegisterPage.js
// Registration page with multi-step form and skill selection

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, MapPin, ArrowRight, ArrowLeft, Plus, X, AlertCircle, Upload, File, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSkills } from '../contexts/SkillContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SkillSelector from '../components/skills/SkillSelector';

const RegisterPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedSkillsHave, setSelectedSkillsHave] = useState([]);
  const [selectedSkillsWant, setSelectedSkillsWant] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const { register: registerUser, loading, isAuthenticated } = useAuth();
  const { allSkills, loadAllSkills } = useSkills();
  const navigate = useNavigate();

  // Redirect authenticated users
  useEffect(() => {
    console.log('RegisterPage: useEffect isAuthenticated:', isAuthenticated);
    if (isAuthenticated) {
      console.log('RegisterPage: redirecting to dashboard due to isAuthenticated');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Load skills on mount
  useEffect(() => {
    loadAllSkills();
  }, [loadAllSkills]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
    control,
    trigger
  } = useForm({
    mode: 'onBlur',
  });

  const watchedPassword = watch('password');

  // Step validation
  const validateCurrentStep = async () => {
    const fieldsToValidate = {
      1: ['name', 'email', 'password', 'confirmPassword'],
      2: ['bio', 'location'],
      3: [] // Skills are optional
    };

    const fields = fieldsToValidate[currentStep];
    if (fields.length === 0) return true;

    const isValid = await trigger(fields);
    return isValid;
  };

  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    console.log('RegisterPage: nextStep called, currentStep:', currentStep, 'isValid:', isValid);
    if (isValid && currentStep < 3) {
      console.log('RegisterPage: setting step to:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data) => {
    console.log('RegisterPage: onSubmit called with data:', data);
    console.log('RegisterPage: selectedSkillsHave:', selectedSkillsHave);
    console.log('RegisterPage: selectedSkillsWant:', selectedSkillsWant);
    console.log('RegisterPage: certificates:', certificates);
    try {
      const userData = {
        name: data.name,
        email: data.email,
        password: data.password,
        bio: data.bio,
        location: data.location,
        skills_have: selectedSkillsHave,
        skills_want: selectedSkillsWant
      };

      console.log('RegisterPage: calling registerUser with:', userData);
      const result = await registerUser(userData);
      console.log('RegisterPage: registerUser result:', result);

      if (result.success) {
        // Upload certificates after successful registration
        if (certificates.length > 0) {
          try {
            const token = localStorage.getItem('skillswapper_token');
            const uploadPromises = certificates.map(async (cert) => {
              const formData = new FormData();
              formData.append('documents', cert.file);

              const response = await fetch('/api/upload/document', {
                method: 'POST',
                body: formData,
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (!response.ok) {
                throw new Error('Upload failed');
              }

              return await response.json();
            });

            await Promise.all(uploadPromises);
            console.log('Certificates uploaded successfully');
          } catch (uploadError) {
            console.error('Certificate upload error:', uploadError);
            // Don't fail registration if certificate upload fails
          }
        }

        console.log('RegisterPage: registration successful, navigating to dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        console.log('RegisterPage: registration failed:', result.message);
        setError('root', {
          type: 'manual',
          message: result.message || 'Registration failed. Please try again.'
        });
      }
    } catch (error) {
      console.log('RegisterPage: onSubmit error:', error);
      setError('root', {
        type: 'manual',
        message: 'An unexpected error occurred. Please try again.'
      });
    }
  };

  const addSkillToHave = (skill) => {
    if (!selectedSkillsHave.find(s => s.name === skill.skill_name)) {
      setSelectedSkillsHave([...selectedSkillsHave, {
        name: skill.skill_name,
        level: 'intermediate'
      }]);
    }
  };

  const updateSkillLevel = (index, newLevel) => {
    const updatedSkills = [...selectedSkillsHave];
    updatedSkills[index].level = newLevel;
    setSelectedSkillsHave(updatedSkills);
  };

  const addSkillToWant = (skill) => {
    if (!selectedSkillsWant.find(s => s.name === skill.skill_name)) {
      setSelectedSkillsWant([...selectedSkillsWant, {
        name: skill.skill_name,
        urgency: 'medium'
      }]);
    }
  };

  const removeSkillFromHave = (index) => {
    setSelectedSkillsHave(selectedSkillsHave.filter((_, i) => i !== index));
  };

  const removeSkillFromWant = (index) => {
    setSelectedSkillsWant(selectedSkillsWant.filter((_, i) => i !== index));
  };

  // Certificate upload functions
  const handleCertificateUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      // Store files locally for upload after registration
      const fileObjects = files.map(file => ({
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        id: Date.now() + Math.random()
      }));
      
      setCertificates([...certificates, ...fileObjects]);
    } catch (error) {
      console.error('Certificate selection error:', error);
      setError('root', {
        type: 'manual',
        message: 'Failed to select certificates. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  const removeCertificate = (index) => {
    setCertificates(certificates.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-heading font-bold text-gray-900">
            Join SkillSwapper
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Start your skill sharing journey today
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                  currentStep >= step
                    ? 'bg-primary-500 border-primary-500 text-white'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-0.5 transition-colors ${
                    currentStep > step ? 'bg-primary-500' : 'bg-gray-300'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Labels */}
        <div className="flex justify-center">
          <div className="flex space-x-12 text-xs text-gray-600">
            <span className={currentStep >= 1 ? 'font-medium text-primary-600' : ''}>
              Account
            </span>
            <span className={currentStep >= 2 ? 'font-medium text-primary-600' : ''}>
              Profile
            </span>
            <span className={currentStep >= 3 ? 'font-medium text-primary-600' : ''}>
              Skills
            </span>
          </div>
        </div>

        {/* Registration Form */}
        <form className="mt-8 space-y-6">
          {/* Root Error Message */}
          {errors.root && (
            <div className="rounded-md bg-error-50 border border-error-200 p-4 animate-fade-in">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-error-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-error-800">
                    Registration Failed
                  </h3>
                  <div className="mt-1 text-sm text-error-700">
                    {errors.root.message}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Account Information */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('name', {
                      required: 'Full name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters long',
                      },
                      maxLength: {
                        value: 100,
                        message: 'Name cannot exceed 100 characters',
                      },
                      pattern: {
                        value: /^[a-zA-Z\s]+$/,
                        message: 'Name can only contain letters and spaces',
                      },
                    })}
                    type="text"
                    autoComplete="name"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                      errors.name
                        ? 'border-error-300 focus:ring-error-500'
                        : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-error-600 animate-fade-in">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('email', {
                      required: 'Email address is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Please enter a valid email address',
                      },
                    })}
                    type="email"
                    autoComplete="email"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                      errors.email
                        ? 'border-error-300 focus:ring-error-500'
                        : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    placeholder="Enter your email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-error-600 animate-fade-in">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters long',
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                        message: 'Password must contain uppercase, lowercase, number, and special character',
                      },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`block w-full pl-10 pr-10 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                      errors.password
                        ? 'border-error-300 focus:ring-error-500'
                        : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-primary-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-error-600 animate-fade-in">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value =>
                        value === watchedPassword || 'Passwords do not match',
                    })}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                      errors.confirmPassword
                        ? 'border-error-300 focus:ring-error-500'
                        : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    placeholder="Confirm your password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-error-600 animate-fade-in">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Profile Information */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
              
              {/* Bio Field */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  {...register('bio', {
                    maxLength: {
                      value: 500,
                      message: 'Bio cannot exceed 500 characters',
                    },
                  })}
                  rows={4}
                  className={`block w-full px-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors resize-none ${
                    errors.bio
                      ? 'border-error-300 focus:ring-error-500'
                      : 'border-gray-300 focus:ring-primary-500'
                  }`}
                  placeholder="Tell others about yourself, your interests, and what you're passionate about..."
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-error-600 animate-fade-in">
                    {errors.bio.message}
                  </p>
                )}
              </div>

              {/* Location Field */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('location', {
                      maxLength: {
                        value: 100,
                        message: 'Location cannot exceed 100 characters',
                      },
                    })}
                    type="text"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                      errors.location
                        ? 'border-error-300 focus:ring-error-500'
                        : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    placeholder="City, Country"
                  />
                </div>
                {errors.location && (
                  <p className="mt-1 text-sm text-error-600 animate-fade-in">
                    {errors.location.message}
                  </p>
                )}
              </div>

              {/* Certificate Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificates <span className="text-gray-400">(optional)</span>
                </label>
                <div className="space-y-3">
                  {/* Upload Button */}
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="certificate-upload"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        uploading
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploading ? (
                          <LoadingSpinner size="sm" className="text-primary-600" />
                        ) : (
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        )}
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> certificates
                        </p>
                        <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (MAX. 5MB each)</p>
                      </div>
                      <input
                        id="certificate-upload"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleCertificateUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </div>

                  {/* Uploaded Certificates */}
                  {certificates.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Selected Certificates:</p>
                      {certificates.map((cert, index) => (
                        <div
                          key={cert.id || index}
                          className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <File className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{cert.name}</p>
                              <p className="text-xs text-gray-500">
                                {(cert.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCertificate(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Skills */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              {console.log('RegisterPage: rendering step 3')}
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Skills</h3>
              
              {/* Skills I Have */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Skills I Can Teach <span className="text-gray-400">(optional)</span>
                </h4>
                <SkillSelector
                  availableSkills={allSkills}
                  onSkillSelect={addSkillToHave}
                  placeholder="Search for skills you can teach..."
                  excludeSkills={selectedSkillsHave.map(s => s.name)}
                />
                
                {/* Selected Skills Have */}
                {selectedSkillsHave.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedSkillsHave.map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg bg-primary-50 border border-primary-200"
                      >
                        <span className="text-sm font-medium text-primary-800">{skill.name}</span>
                        <div className="flex items-center space-x-2">
                          <select
                            value={skill.level}
                            onChange={(e) => updateSkillLevel(index, e.target.value)}
                            className="text-xs px-2 py-1 border border-primary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeSkillFromHave(index)}
                            className="text-primary-600 hover:text-primary-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Skills I Want */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Skills I Want to Learn <span className="text-gray-400">(optional)</span>
                </h4>
                <SkillSelector
                  availableSkills={allSkills}
                  onSkillSelect={addSkillToWant}
                  placeholder="Search for skills you want to learn..."
                  excludeSkills={selectedSkillsWant.map(s => s.name)}
                />
                
                {/* Selected Skills Want */}
                {selectedSkillsWant.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedSkillsWant.map((skill, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-secondary-100 text-secondary-800"
                      >
                        {skill.name}
                        <button
                          type="button"
                          onClick={() => removeSkillFromWant(index)}
                          className="ml-2 hover:text-secondary-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-secondary-500 border border-transparent rounded-lg hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || loading}
                className="flex items-center px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-secondary-500 border border-transparent rounded-lg hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {(isSubmitting || loading) ? (
                  <LoadingSpinner size="sm" className="text-white" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Login Link */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;