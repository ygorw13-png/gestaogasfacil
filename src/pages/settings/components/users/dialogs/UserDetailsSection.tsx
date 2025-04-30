
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserDetailsSectionProps {
  email: string;
  setEmail: (value: string) => void;
  name: string;
  setName: (value: string) => void;
  role: string;
  setRole: (value: string) => void;
  errors?: {
    email?: string;
    name?: string;
    role?: string;
  };
}

export function UserDetailsSection({ 
  email, 
  setEmail, 
  name, 
  setName, 
  role, 
  setRole, 
  errors 
}: UserDetailsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="usuario@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors?.email && (
          <p className="text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          placeholder="Nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {errors?.name && (
          <p className="text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Função</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="gerente">Gerente</SelectItem>
            <SelectItem value="vendedor">Vendedor</SelectItem>
            <SelectItem value="motorista">Motorista</SelectItem>
          </SelectContent>
        </Select>
        {errors?.role && (
          <p className="text-sm text-red-500">{errors.role}</p>
        )}
      </div>
    </div>
  );
}
