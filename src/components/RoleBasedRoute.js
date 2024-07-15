import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();

  console.log("RBR: ", currentUser);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
};

export default RoleBasedRoute;