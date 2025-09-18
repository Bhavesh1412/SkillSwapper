// src/pages/MatchesPage.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { matchAPI } from '../services/api';

const MatchesPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await matchAPI.getMatches({ limit: 50, offset: 0 });
        const data = response?.data?.matches || response?.matches || [];
        setMatches(Array.isArray(data) ? data : []);
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to load matches';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold flex items-center text-gray-900">
          <Users className="h-6 w-6 mr-2 text-primary-500" /> Skill Matches
        </h2>
        {loading && (
          <div className="text-gray-600">Loading matches...</div>
        )}
        {!loading && error && (
          <div className="text-red-600">{error}</div>
        )}
        {!loading && !error && matches.length === 0 && (
          <div className="relative bg-white rounded-2xl shadow p-10 sm:p-12 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-3xl sm:text-5xl font-bold text-gray-400 opacity-40 select-none">
                No matches yet
              </span>
            </div>
            <div className="relative text-center text-gray-700">
              Add more skills to your profile to find matches.
            </div>
          </div>
        )}
        {!loading && !error && matches.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {matches.map((item) => {
              const user = item.user || {};
              const details = item.matchDetails || {};
              const teach = details.skillsYouCanTeachThem || [];
              const learn = details.skillsTheyCanTeachYou || [];
              return (
                <div key={user.id} className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow">
                  <h3 className="text-lg font-medium">{user.name}</h3>
                  {user.location && (
                    <p className="text-gray-500 text-sm">{user.location}</p>
                  )}
                  <div className="mt-2 text-sm text-gray-700">
                    <p><span className="font-semibold">You can teach:</span> {teach.join(', ') || '—'}</p>
                    <p><span className="font-semibold">They can teach:</span> {learn.join(', ') || '—'}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      Score: {details.matchScore || 0}
                    </span>
                    <Link
                      to={`/profile/${user.id}`}
                      className="px-3 py-1 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchesPage;
