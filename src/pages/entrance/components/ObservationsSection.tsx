
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface ObservationsSectionProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export function ObservationsSection({ 
  value, 
  onChange, 
  placeholder = "Adicione observações relevantes sobre este fechamento...",
  maxLength = 500
}: ObservationsSectionProps) {
  const [charCount, setCharCount] = useState(value.length);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) return;
    
    onChange(newValue);
    setCharCount(newValue.length);
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="observations" className="text-base font-medium">
          Observações
        </Label>
        {maxLength && (
          <span className="text-xs text-muted-foreground">
            {charCount}/{maxLength} caracteres
          </span>
        )}
      </div>
      <Textarea
        id="observations"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="min-h-[100px] resize-none"
      />
    </div>
  );
}
