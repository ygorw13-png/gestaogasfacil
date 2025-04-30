
import { AlertTriangle, XCircle, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertBarVariants = cva(
  "flex items-center gap-2 p-3 rounded-md mb-4",
  {
    variants: {
      variant: {
        default: "bg-blue-50 text-blue-800 border border-blue-200",
        danger: "bg-red-50 text-red-800 border border-red-200",
        warning: "bg-amber-50 text-amber-800 border border-amber-200",
        success: "bg-green-50 text-green-800 border border-green-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface AlertBarProps extends VariantProps<typeof alertBarVariants> {
  message: string;
  onClose?: () => void;
  hideAfter?: number; // milissegundos, se definido o alerta desaparece após esse tempo
  className?: string;
}

export function AlertBar({ 
  message, 
  variant, 
  onClose, 
  hideAfter,
  className 
}: AlertBarProps) {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  
  useEffect(() => {
    if (hideAfter) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, hideAfter);
      
      return () => clearTimeout(timer);
    }
  }, [hideAfter, onClose]);
  
  if (!isVisible) return null;
  
  const IconComponent = variant === 'danger' 
    ? XCircle 
    : variant === 'warning' 
      ? AlertTriangle 
      : Info;
  
  return (
    <div className={cn(alertBarVariants({ variant }), className)}>
      <IconComponent className="h-5 w-5" />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button 
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Fechar"
        >
          <XCircle className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
