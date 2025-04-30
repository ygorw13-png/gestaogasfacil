
import { useCsrfProtection } from '@/utils/csrfProtection';
import LoginForm from '@/components/auth/LoginForm';
import { useLoginForm } from '@/hooks/useLoginForm';
import { validateEmail } from '@/utils/inputValidation';

export default function Login() {
  const { loading, error, user, handleSubmit } = useLoginForm();
  const { csrfToken } = useCsrfProtection();
  
  // If the user is already logged in, don't render the form
  if (user) return null;

  const handleFormSubmit = async (email: string, password: string): Promise<void> => {
    try {
      // Validar email antes de enviar
      const validatedEmail = validateEmail(email);
      // Chamar o handler de submit com os dados validados
      return await handleSubmit(validatedEmail, password, csrfToken);
    } catch (error: any) {
      console.error("Erro de validação:", error.message);
      throw error;
    }
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
