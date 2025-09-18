// src/pages/DashboardPage.js
// User dashboard showing quick profile overview and navigation

import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { User, BookOpen, ArrowLeftRight, LogOut } from "lucide-react";

const DashboardPage = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
           {" "}
      <div className="max-w-4xl mx-auto space-y-8">
                {/* Welcome Section */}       {" "}
        <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center justify-between">
                   {" "}
          <div>
                       {" "}
            <h2 className="text-2xl font-heading font-bold text-gray-900">
                            Welcome, {user.name} 👋            {" "}
            </h2>
                       {" "}
            <p className="text-gray-600">Ready to swap some skills today?</p>   
                 {" "}
          </div>
                   {" "}
          <button
            onClick={logout}
            className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
                        <LogOut className="h-4 w-4 mr-2" />            Logout  
                   {" "}
          </button>
                 {" "}
        </div>
                {/* Quick Links */}       {" "}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                   {" "}
          <Link
            to="/skills"
            className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-transform transform hover:scale-105"
          >
                        <BookOpen className="h-8 w-8 mb-2" />           {" "}
            <h3 className="font-medium">My Skills</h3>           {" "}
            <p className="text-sm opacity-80">
              Manage what you can teach & learn
            </p>
                     {" "}
          </Link>
                   {" "}
          <Link
            to="/swap-requests"
            className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-transform transform hover:scale-105"
          >
                       {" "}
            <ArrowLeftRight className="h-8 w-8 mb-2 text-primary-600" />       
                <h3 className="font-medium">Swap Requests</h3>           {" "}
            <p className="text-sm text-gray-600">
              Check and manage your requests
            </p>
                     {" "}
          </Link>
                   {" "}
          <Link
            to="/profile"
            className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-transform transform hover:scale-105"
          >
                        <User className="h-8 w-8 mb-2 text-secondary-600" />   
                    <h3 className="font-medium">My Profile</h3>           {" "}
            <p className="text-sm text-gray-600">Update your details anytime</p>
                     {" "}
          </Link>
                 {" "}
        </div>
             {" "}
      </div>
         {" "}
    </div>
  );
};

export default DashboardPage;
