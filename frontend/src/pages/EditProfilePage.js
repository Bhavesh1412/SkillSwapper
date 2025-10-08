// src/pages/EditProfilePage.js
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSkills } from '../contexts/SkillContext';
import SkillSelector from '../components/skills/SkillSelector';
import { userAPI, uploadAPI } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Upload, File, Trash2, X } from 'lucide-react';

const EditProfilePage = () => {
  const { user, updateUserProfile, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      location: user?.location || ''
    }
  });

  const {
    allSkills,
    loadAllSkills,
    addSkillsToHave,
    addSkillsToWant,
    removeSkillFromHave,
    removeSkillFromWant,
  } = useSkills();

  const [uploading, setUploading] = useState(false);
  const [recentUploads, setRecentUploads] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  // Refresh default values if user changes
  useEffect(() => {
    reset({
      name: user?.name || '',
      bio: user?.bio || '',
      location: user?.location || ''
    });
  }, [user, reset]);

  // Ensure skills are loaded
  useEffect(() => {
    loadAllSkills();
  }, [loadAllSkills]);

  const onSubmit = async (data) => {
    try {
      const response = await userAPI.updateProfile(user.id, data);
      if (response.success) {
        updateUserProfile(response.data.user);
        toast.success('Profile updated');
        navigate('/profile');
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    }
  };

  const handleAddSkillHave = async (skill) => {
    await addSkillsToHave([{ name: skill.skill_name, level: 'intermediate' }]);
  };

  const handleAddSkillWant = async (skill) => {
    await addSkillsToWant([{ name: skill.skill_name, urgency: 'medium' }]);
  };

  const handleUploadCertificates = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file) => formData.append('documents', file));

    setUploading(true);
    try {
      const result = await uploadAPI.uploadDocuments(formData);
      if (result.success) {
        setRecentUploads((prev) => [...result.data.documents, ...prev].slice(0, 10));
        toast.success(`Uploaded ${result.data.documents.length} document(s)`);
      } else {
        toast.error(result.message || 'Upload failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Upload failed';
      toast.error(message);
    } finally {
      setUploading(false);
      // reset input value to allow re-uploading same file
      event.target.value = '';
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
        <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              {...register('name')}
              className="block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              {...register('bio')}
              rows={4}
              className="block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              {...register('location')}
              className="block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Skills Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Skills</h3>

            {/* Skills I Can Teach (Have) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills I Can Teach</label>
              <SkillSelector
                availableSkills={allSkills}
                onSkillSelect={handleAddSkillHave}
                placeholder="Search for skills you can teach..."
                excludeSkills={(user.skills_have || []).map(s => s.skill_name)}
              />
              {(user.skills_have?.length || 0) > 0 && (
                <div className="mt-3 space-y-2">
                  {user.skills_have.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-2 rounded-lg bg-primary-50 border border-primary-200">
                      <span className="text-sm font-medium text-primary-800">{skill.skill_name}</span>
                      <button
                        type="button"
                        onClick={() => removeSkillFromHave(skill.id)}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Skills I Want to Learn (Want) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills I Want to Learn</label>
              <SkillSelector
                availableSkills={allSkills}
                onSkillSelect={handleAddSkillWant}
                placeholder="Search for skills you want to learn..."
                excludeSkills={(user.skills_want || []).map(s => s.skill_name)}
              />
              {(user.skills_want?.length || 0) > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {user.skills_want.map((skill) => (
                    <div key={skill.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-secondary-100 text-secondary-800">
                      {skill.skill_name}
                      <button
                        type="button"
                        onClick={() => removeSkillFromWant(skill.id)}
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

          {/* Certificates Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Certificates</h3>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="certificate-upload-edit"
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
                  id="certificate-upload-edit"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleUploadCertificates}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            {recentUploads.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Recently Uploaded:</p>
                {recentUploads.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <File className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.file_name}</p>
                        <p className="text-xs text-gray-500">{doc.file_type}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;
