
import { useCsrfProtection } from '@/utils/csrfProtection';
import LoginForm from '@/components/auth/LoginForm';
import { useLoginForm } from '@/hooks/useLoginForm';
import { validateEmail } from '@/utils/inputValidation';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FireAnimation from '@/components/animations/FireAnimation';
import GasCylinderIcon from '@/components/icons/GasCylinderIcon';

export default function Login() {
  const { loading, error, user, handleSubmit } = useLoginForm();
  const { csrfToken } = useCsrfProtection();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      console.log("Login - User already logged in, redirecting");
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleFormSubmit = async (email: string, password: string): Promise<void> => {
    try {
      // Validate email before sending
      const validatedEmail = validateEmail(email);
      // Call submit handler with validated data
      return await handleSubmit(validatedEmail, password, csrfToken);
    } catch (error: any) {
      console.error("Validation error:", error.message);
      throw error;
    }
  };

  // Don't render login form if user is already logged in
  if (user) return null;

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-b from-gray-900 to-gray-800 relative overflow-hidden">
      {/* Fire animation as background */}
      <div className="absolute inset-0 opacity-50">
        <FireAnimation />
      </div>
      
      <div className="m-auto w-full max-w-md px-4 py-8 sm:px-0 z-10">
        <div className="flex flex-col items-center justify-center">
          {/* Gas cylinder icon */}
          <div className="mb-6 relative">
            <GasCylinderIcon className="w-24 h-24" />
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-6">
              <FireAnimation />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-center text-white mb-2">
            GasFlow Aqua Manager
          </h1>
          <p className="text-gray-300 mb-6 text-center">
            Sistema de gestão para distribuição de gás
          </p>
          
          <div className="w-full bg-white/10 backdrop-blur-md shadow-xl rounded-lg p-6 border border-white/20">
            <LoginForm 
              onSubmit={handleFormSubmit}
              loading={loading}
              error={error?.message || null}
              csrfToken={csrfToken}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
