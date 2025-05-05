
import { useCsrfProtection } from '@/utils/csrfProtection';
import LoginForm from '@/components/auth/LoginForm';
import { useLoginForm } from '@/hooks/useLoginForm';
import { validateEmail } from '@/utils/inputValidation';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
    <div className="flex min-h-screen w-full bg-gradient-to-b from-green-50 to-white">
      <div className="m-auto w-full max-w-md px-4 py-8 sm:px-0">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
            GasFlow Aqua Manager
          </h1>
          <div className="w-full bg-white shadow-md rounded-lg p-6 border border-gray-100">
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
