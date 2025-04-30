
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PasswordSectionProps {
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  error: string | null;
}

export function PasswordSection({ 
  password, 
  setPassword, 
  confirmPassword, 
  setConfirmPassword,
  error 
}: PasswordSectionProps) {
  return (
    <div className="space-y-4">
      <div className="font-medium">Senha</div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
            placeholder="Digite a senha"
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirme a Senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1"
            placeholder="Confirme a senha"
          />
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
}
