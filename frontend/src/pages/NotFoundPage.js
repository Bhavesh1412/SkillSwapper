import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-6xl font-bold text-red-600 mb-4">404</h1>
      <p className="text-gray-700 mb-6">Oops! Page not found.</p>
      <Link
        to="/"
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Go Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
