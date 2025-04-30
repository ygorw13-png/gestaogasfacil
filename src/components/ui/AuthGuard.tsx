
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  redirectTo = '/login'
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" message="GasFlow Aqua Manager" />
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("AuthGuard - User not authenticated, redirecting to login");
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
