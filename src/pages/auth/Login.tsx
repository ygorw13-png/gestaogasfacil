
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
