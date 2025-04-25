
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Mock authentication - in a real app, this would be a real authentication call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo, we'll just check if any values are entered
      if (email && password) {
        // Future authentication logic would go here
        navigate("/");
      } else {
        toast({
          title: "Erro de login",
          description: "Por favor, insira um email e senha válidos.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro de login",
        description: "Ocorreu um erro ao tentar fazer login. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent">
      <div className="w-full max-w-md px-4 py-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gasflow-600 text-white p-2 rounded-lg mb-4">
            <Box size={48} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">GasFlow Aqua Manager</h1>
          <p className="text-gray-500">Sistema de gestão para revendas de GLP e água</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <a 
                    href="#" 
                    className="text-sm text-gasflow-600 hover:text-gasflow-700"
                    onClick={(e) => {
                      e.preventDefault();
                      toast({
                        title: "Redefinição de senha",
                        description: "Função em desenvolvimento.",
                      });
                    }}
                  >
                    Esqueceu a senha?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full bg-gasflow-600 hover:bg-gasflow-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Entrando...</span>
                  </div>
                ) : (
                  "Entrar"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
