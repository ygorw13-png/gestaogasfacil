
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordRequirements } from "@/components/common/PasswordRequirements";

interface PasswordSectionProps {
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  error?: string;
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
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="********"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      <PasswordRequirements />
    </div>
  );
}
