
import { useCsrfProtection } from '@/utils/csrfProtection';
import LoginForm from '@/components/auth/LoginForm';
import { useLoginForm } from '@/hooks/useLoginForm';

export default function Login() {
  const { loading, error, user, handleSubmit } = useLoginForm();
  const { csrfToken } = useCsrfProtection();
  
  // If the user is already logged in, don't render the form
  if (user) return null;

  const handleFormSubmit = (email: string, password: string) => {
    handleSubmit(email, password, csrfToken);
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-b from-green-50 to-white">
      <LoginForm 
        onSubmit={handleFormSubmit}
        loading={loading}
        error={error?.message || null}
      />
    </div>
  );
}
