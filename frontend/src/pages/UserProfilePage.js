import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, User, BookOpen, Target, File, Download } from 'lucide-react';
import { userAPI, matchAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [matchDetails, setMatchDetails] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch user profile
        const profileResponse = await userAPI.getProfile(userId);
        setUser(profileResponse.data.user);

        // Fetch user documents
        try {
          const documentsResponse = await fetch(`/api/upload/documents?userId=${userId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('skillswapper_token')}`
            }
          });
          if (documentsResponse.ok) {
            const docsData = await documentsResponse.json();
            setDocuments(docsData.data.documents || []);
          }
        } catch (docError) {
          console.log('Could not fetch documents:', docError);
        }

        // Fetch match details if current user is logged in
        if (currentUser && currentUser.id !== parseInt(userId)) {
          try {
            const matchResponse = await matchAPI.getDetailedMatch(userId);
            setMatchDetails(matchResponse.data);
          } catch (matchError) {
            // Match details are optional, don't fail the whole page
            console.log('No match details available:', matchError.message);
            // Set empty match details to show the connect button
            setMatchDetails({ matchAnalysis: { isValidMatch: false } });
          }
        }
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to load profile';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId, currentUser]);

  const handleConnect = async () => {
    if (!currentUser) {
      toast.error('Please log in to connect with users');
      navigate('/login');
      return;
    }

    if (currentUser.id === parseInt(userId)) {
      toast.error('You cannot connect with yourself');
      return;
    }

    try {
      setConnecting(true);
      const response = await matchAPI.saveMatch(userId);
      toast.success('Connection request sent successfully!');
      
      // Optionally navigate back to matches or show success state
      setTimeout(() => {
        navigate('/matches');
      }, 1500);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to send connection request';
      toast.error(msg);
    } finally {
      setConnecting(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-lg mb-4">User not found</div>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === parseInt(userId);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {/* Profile Header */}
              <div className="flex items-start space-x-6 mb-8">
                <div className="flex-shrink-0">
                  {user.profile_pic ? (
                    <img
                      src={user.profile_pic}
                      alt={user.name}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <User className="h-12 w-12 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{user.name}</h2>
                  {user.location && (
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-2" />
                      {user.location}
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Member since {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                  <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                </div>
              )}

              {/* Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Skills I Can Teach */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                    Skills I Can Teach
                  </h3>
                  {user.skills_have && user.skills_have.length > 0 ? (
                    <div className="space-y-2">
                      {user.skills_have.map((skill, index) => (
                        <div key={index} className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                          <span className="text-green-800 font-medium">{skill.skill_name}</span>
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                            {skill.proficiency_level}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No skills listed</p>
                  )}
                </div>

                {/* Skills I Want to Learn */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-blue-600" />
                    Skills I Want to Learn
                  </h3>
                  {user.skills_want && user.skills_want.length > 0 ? (
                    <div className="space-y-2">
                      {user.skills_want.map((skill, index) => (
                        <div key={index} className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                          <span className="text-blue-800 font-medium">{skill.skill_name}</span>
                          <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                            {skill.urgency_level}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No skills listed</p>
                  )}
                </div>
              </div>

              {/* Certificates */}
              {documents.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <File className="h-5 w-5 mr-2 text-purple-600" />
                    Certificates & Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map((doc, index) => (
                      <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <File className="h-8 w-8 text-purple-600" />
                            <div>
                              <p className="font-medium text-gray-900">{doc.file_name}</p>
                              <p className="text-sm text-gray-600">
                                {(doc.file_size / 1024).toFixed(1)} KB
                              </p>
                              {doc.skill_name && (
                                <p className="text-xs text-purple-600 mt-1">
                                  Related to: {doc.skill_name}
                                </p>
                              )}
                            </div>
                          </div>
                          <a
                            href={`http://localhost:3001${doc.file_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-800 transition-colors"
                            title="Download document"
                          >
                            <Download className="h-5 w-5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Match Analysis */}
            {matchDetails && matchDetails.matchAnalysis && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Analysis</h3>
                
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600">
                      {matchDetails.matchAnalysis.matchScore}
                    </div>
                    <div className="text-sm text-gray-600">Match Score</div>
                  </div>

                  {matchDetails.matchAnalysis.skillsYouCanTeachThem.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">You can teach them:</h4>
                      <div className="space-y-1">
                        {matchDetails.matchAnalysis.skillsYouCanTeachThem.map((skill, index) => (
                          <div key={index} className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                            {skill.skill_name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchDetails.matchAnalysis.skillsTheyCanTeachYou.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">They can teach you:</h4>
                      <div className="space-y-1">
                        {matchDetails.matchAnalysis.skillsTheyCanTeachYou.map((skill, index) => (
                          <div key={index} className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {skill.skill_name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchDetails.matchAnalysis.recommendations && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Recommendations:</h4>
                      <div className="space-y-2">
                        {matchDetails.matchAnalysis.recommendations.map((rec, index) => (
                          <div key={index} className={`text-sm p-2 rounded ${
                            rec.type === 'success' ? 'bg-green-100 text-green-800' :
                            rec.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {rec.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Connect Button */}
            {!isOwnProfile && currentUser && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {connecting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Sending Request...</span>
                    </>
                  ) : (
                    'Connect & Start Learning'
                  )}
                </button>
                <p className="text-xs text-gray-500 text-center mt-3">
                  {matchDetails?.matchAnalysis?.isValidMatch 
                    ? 'Great match! Send a connection request to start skill swapping'
                    : 'Send a connection request to start skill swapping'
                  }
                </p>
              </div>
            )}

            {/* Login Prompt */}
            {!currentUser && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Want to Connect?</h3>
                  <p className="text-gray-600 mb-4">Sign in to connect with this user and start skill swapping</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                  >
                    Sign In to Connect
                  </button>
                </div>
              </div>
            )}

            {/* Profile Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Skills to teach:</span>
                  <span className="font-medium">{user.skills_have?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Skills to learn:</span>
                  <span className="font-medium">{user.skills_want?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Profile completeness:</span>
                  <span className="font-medium">
                    {Math.round(((user.bio ? 1 : 0) + (user.location ? 1 : 0) + (user.profile_pic ? 1 : 0) + (user.skills_have?.length > 0 ? 1 : 0) + (user.skills_want?.length > 0 ? 1 : 0)) / 5 * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
