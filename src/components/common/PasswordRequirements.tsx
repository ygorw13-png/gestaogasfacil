
import React from 'react';

interface PasswordRequirementsProps {
  className?: string;
}

export function PasswordRequirements({ className }: PasswordRequirementsProps) {
  return (
    <div className={`text-sm text-muted-foreground ${className}`}>
      <p>A senha deve conter:</p>
      <ul className="list-disc pl-5">
        <li>Pelo menos 8 caracteres</li>
        <li>Uma letra maiúscula</li>
        <li>Uma letra minúscula</li>
        <li>Um número</li>
      </ul>
    </div>
  );
}
