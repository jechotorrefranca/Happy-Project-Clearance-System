import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '../firebaseConfig';

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (currentUser) {
        const db = getFirestore(app);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          setUserRole(userDoc.data().role);
        }
      }
      setLoading(false);
    };

    fetchUserRole();
  }, [currentUser]);
  

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    
    console.log("dsdsdsdsdsd")
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
};

export default RoleBasedRoute;