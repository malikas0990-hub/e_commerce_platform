import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../services/api';

export default function ProtectedRoute({ roles, children }) {
  const user = auth.getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
