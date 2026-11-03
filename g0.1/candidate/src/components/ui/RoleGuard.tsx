import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { AuthGuard } from './AuthGuard';
export const RoleGuard: React.FC<{children:React.ReactNode;allowedRoles?:string[];redirectTo?:string}> = ({children,allowedRoles=[],redirectTo='/'}) => {
  const {hasRole}=useAuth();
  return <AuthGuard>{allowedRoles.length>0 && !hasRole(allowedRoles)
    ? <Navigate to={redirectTo} replace /> : children}</AuthGuard>;
};