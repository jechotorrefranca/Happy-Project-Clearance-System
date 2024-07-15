import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  console.log("PR: ", currentUser);


  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;