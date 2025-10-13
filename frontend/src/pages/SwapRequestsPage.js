// src/pages/SwapRequestsPage.js
// Page to display user's sent swap requests with their status

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, User, Calendar } from "lucide-react";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { matchAPI } from "../services/api";

const SwapRequestsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [swapRequests, setSwapRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, pending, accepted, declined

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSwapRequests();
    }
  }, [isAuthenticated, filter]);

  const fetchSwapRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (filter !== "all") {
        params.status = filter;
      }
      
      const response = await matchAPI.getSavedMatches(params);
      
      if (response.success) {
        // Filter to show only requests where current user is the initiator
        const sentRequests = response.data.matches.filter(match => match.isInitiator);

        // Enrich with detailed skills if missing
        const enriched = await Promise.all(
          sentRequests.map(async (req) => {
            const teach = req?.matchDetails?.skillsYouCanTeachThem;
            const learn = req?.matchDetails?.skillsTheyCanTeachYou;
            const needsTeach = !Array.isArray(teach) || teach.length === 0;
            const needsLearn = !Array.isArray(learn) || learn.length === 0;
            if (!needsTeach && !needsLearn) return req;

            try {
              const detail = await matchAPI.getDetailedMatch(req.otherUser.id);
              if (detail?.success) {
                const analysis = detail.data?.matchAnalysis;
                const enrichedTeach = Array.isArray(analysis?.skillsYouCanTeachThem)
                  ? analysis.skillsYouCanTeachThem.map((s) => s.skill_name || s)
                  : teach || [];
                const enrichedLearn = Array.isArray(analysis?.skillsTheyCanTeachYou)
                  ? analysis.skillsTheyCanTeachYou.map((s) => s.skill_name || s)
                  : learn || [];
                return {
                  ...req,
                  matchDetails: {
                    ...(req.matchDetails || {}),
                    skillsYouCanTeachThem: enrichedTeach,
                    skillsTheyCanTeachYou: enrichedLearn,
                  },
                };
              }
            } catch (_) {
              // ignore enrichment failure, keep original
            }
            return req;
          })
        );

        setSwapRequests(enriched);
      } else {
        setError("Failed to fetch swap requests");
      }
    } catch (err) {
      console.error("Error fetching swap requests:", err);
      setError("Failed to fetch swap requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "accepted":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "declined":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "expired":
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "declined":
        return "bg-red-100 text-red-800 border-red-200";
      case "expired":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Swap Requests
          </h1>
          <p className="text-gray-600">
            Track the status of your skill swap requests
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { key: "all", label: "All Requests" },
              { key: "pending", label: "Pending" },
              { key: "accepted", label: "Accepted" },
              { key: "declined", label: "Declined" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === tab.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error Loading Requests
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchSwapRequests}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : swapRequests.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Swap Requests Found
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === "all"
                ? "You haven't sent any swap requests yet."
                : `No ${filter} requests found.`}
            </p>
            <Link
              to="/matches"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Find Matches
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {swapRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {request.otherUser.profile_pic ? (
                        <img
                          src={request.otherUser.profile_pic}
                          alt={request.otherUser.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.otherUser.name}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {getStatusIcon(request.status)}
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Calendar className="h-4 w-4" />
                          Sent on {formatDate(request.created_at)}
                        </div>
                        {request.updated_at !== request.created_at && (
                          <div className="text-xs text-gray-500">
                            Last updated: {formatDate(request.updated_at)}
                          </div>
                        )}
                      </div>
                      
                      {/* Skills Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Skills You Can Teach
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(request.matchDetails?.skillsYouCanTeachThem) && request.matchDetails.skillsYouCanTeachThem.length > 0 ? (
                              request.matchDetails.skillsYouCanTeachThem.map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                                >
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500 text-sm">None specified</span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Skills You Want to Learn
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(request.matchDetails?.skillsTheyCanTeachYou) && request.matchDetails.skillsTheyCanTeachYou.length > 0 ? (
                              request.matchDetails.skillsTheyCanTeachYou.map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md"
                                >
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500 text-sm">None specified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <Link
                      to={`/user/${request.otherUser.id}`}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      View Profile →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SwapRequestsPage;
