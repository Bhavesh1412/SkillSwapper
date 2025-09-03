// src/pages/HomePage.js
// Landing page with hero section and features

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Search, BookOpen, Star, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Users,
      title: 'Connect & Match',
      description: 'Find people who have the skills you want and want the skills you have.'
    },
    {
      icon: Search,
      title: 'Smart Discovery',
      description: 'Our algorithm finds the perfect skill exchange matches for you.'
    },
    {
      icon: BookOpen,
      title: 'Learn Together',
      description: 'Exchange knowledge in a collaborative and supportive environment.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'UI Designer',
      content: 'I taught design skills and learned Python. Amazing experience!',
      avatar: '👩‍💻'
    },
    {
      name: 'Mike Rodriguez',
      role: 'Chef',
      content: 'Exchanged cooking lessons for photography skills. Perfect match!',
      avatar: '👨‍🍳'
    },
    {
      name: 'Emma Johnson',
      role: 'Musician',
      content: 'Found someone to teach me coding while I taught guitar. Win-win!',
      avatar: '👩‍🎤'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Active Users' },
    { number: '50K+', label: 'Skills Exchanges' },
    { number: '500+', label: 'Different Skills' },
    { number: '95%', label: 'Match Success Rate' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-gray-900 mb-6">
              Exchange Skills,
              <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                {' '}Expand Horizons
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect with people who have the skills you want to learn, 
              while sharing your own expertise. Create meaningful exchanges 
              that benefit everyone.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-8 py-4 text-lg font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-2xl hover:border-primary-300 hover:text-primary-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Hero Image/Illustration */}
            <div className="relative mx-auto max-w-4xl">
              <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl">
                    <div className="w-16 h-16 bg-primary-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">I Can Teach</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="px-3 py-1 bg-white rounded-full">Web Development</div>
                      <div className="px-3 py-1 bg-white rounded-full">Photography</div>
                    </div>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-2xl">
                    <div className="w-16 h-16 bg-secondary-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Perfect Match</h3>
                    <div className="text-2xl mb-2">🎯</div>
                    <div className="text-sm text-gray-600">Sarah wants to learn Web Dev<br/>and can teach Guitar</div>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-success-50 to-success-100 rounded-2xl">
                    <div className="w-16 h-16 bg-success-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <Star className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">I Want to Learn</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="px-3 py-1 bg-white rounded-full">Guitar</div>
                      <div className="px-3 py-1 bg-white rounded-full">Cooking</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-3xl lg:text-4xl font-bold text-gray-900">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-4">
              How SkillSwapper Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, effective, and designed to create meaningful connections
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-4">
              Get Started in 3 Simple Steps
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center relative">
              <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Create Your Profile
              </h3>
              <p className="text-gray-600">
                List the skills you can teach and what you want to learn
              </p>
            </div>
            
            <div className="text-center relative">
              <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Find Your Match
              </h3>
              <p className="text-gray-600">
                Our algorithm finds people with complementary skills
              </p>
            </div>
            
            <div className="text-center relative">
              <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Start Learning
              </h3>
              <p className="text-gray-600">
                Connect and begin your skill exchange journey
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-4">{testimonial.avatar}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.content}"</p>
                <div className="flex text-yellow-400 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-20 bg-gradient-to-r from-primary-500 to-secondary-500">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-white mb-6">
              Ready to Start Your Skill Exchange Journey?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of learners and teachers in our community
            </p>
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 text-lg font-medium text-primary-600 bg-white rounded-2xl hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Join SkillSwapper Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;