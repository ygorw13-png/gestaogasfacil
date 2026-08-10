
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import RegisterForm from '@/components/auth/RegisterForm';
import { useRegisterForm } from '@/hooks/useRegisterForm';

export default function Register() {
  const { loading, validationErrors, handleRegister } = useRegisterForm();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Card className="w-full max-w-md shadow-lg border-green-100">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold text-green-800">GásFácil</CardTitle>
          <p className="text-sm text-gray-600">Crie sua conta para acessar o sistema</p>
        </CardHeader>
        <CardContent>
          <RegisterForm
            onSubmit={handleRegister}
            loading={loading}
            validationErrors={validationErrors}
          />
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700 hover:underline">
              Faça login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
