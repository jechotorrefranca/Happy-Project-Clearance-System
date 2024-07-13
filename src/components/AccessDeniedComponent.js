import React from 'react';
import { useNavigate } from 'react-router-dom';

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-xl mb-8">You do not have permission to access this page.</p>
        <button 
          onClick={() => navigate('/')} 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;