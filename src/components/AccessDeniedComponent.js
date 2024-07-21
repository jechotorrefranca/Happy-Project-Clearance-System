import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-100">
      <div className="sm:w-fit w-[85%] text-center border-4 border-red-300 rounded p-10 bg-red-200">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-xl mb-8">You do not have permission to access this page.</p>
        <motion.button
          whileHover={{scale: 1.03}}
          whileTap={{scale: 0.95}}
          onClick={() => navigate('/')} 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Go to Home
        </motion.button>
      </div>
    </div>
  );
};

export default AccessDenied;