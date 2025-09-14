import React from "react";
import { useParams } from "react-router-dom";

const UserProfilePage = () => {
  const { id } = useParams();

  return (
    <div className="max-w-lg mx-auto mt-12 p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold text-indigo-600 mb-4">
        User Profile - {id}
      </h1>
      <p className="text-gray-700 mb-2">👤 Name: Alice</p>
      <p className="text-gray-700 mb-2">🎯 Skills: JavaScript</p>
      <p className="text-gray-700 mb-2">📖 Learning: Python</p>
      <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
        Send Swap Request
      </button>
    </div>
  );
};

export default UserProfilePage;
