// src/pages/MatchesPage.js
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Users } from 'lucide-react';

const MatchesPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  // Placeholder matches
  const matches = [
    { id: 1, name: 'Alice', skill: 'React' },
    { id: 2, name: 'Bob', skill: 'Python' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold flex items-center text-gray-900">
          <Users className="h-6 w-6 mr-2 text-primary-500" /> Skill Matches
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {matches.map(match => (
            <div key={match.id} className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow">
              <h3 className="text-lg font-medium">{match.name}</h3>
              <p className="text-gray-600">Skill: {match.skill}</p>
              <Link
                to={`/profile/${match.id}`}
                className="mt-2 inline-block px-3 py-1 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                View Profile
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatchesPage;
