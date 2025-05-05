
import { useState, useCallback } from "react";
import { z } from "zod";
import { useToast } from "./use-toast";

interface FormValidationOptions<T extends z.ZodType<any, any>> {
  schema: T;
  onSubmit?: (data: z.infer<T>) => Promise<boolean>;
  onSuccess?: (data: z.infer<T>) => void;
  onError?: (error: z.ZodError<T>) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useFormValidation<T extends z.ZodType<any, any>>(
  options: FormValidationOptions<T>
) {
  const { schema, onSubmit, onSuccess, onError, successMessage, errorMessage } = options;
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;
    
    // Handle different input types
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      processedValue = value === '' ? '' : Number(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Clear error for this field when it changes
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  const handleSelectChange = useCallback((name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when it changes
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form data against schema
      const validData = schema.parse(formData);
      
      // Clear any existing errors
      setErrors({});
      
      // If onSubmit is provided, call it with validated data
      if (onSubmit) {
        const result = await onSubmit(validData);
        
        if (result !== false) {
          // Show success toast if specified
          if (successMessage) {
            toast({
              title: "Sucesso",
              description: successMessage
            });
          }
          
          // Call onSuccess callback if provided
          if (onSuccess) {
            onSuccess(validData);
          }
        }
      } else if (onSuccess) {
        // If no onSubmit handler but onSuccess exists
        onSuccess(validData);
        
        // Show success toast if specified
        if (successMessage) {
          toast({
            title: "Sucesso",
            description: successMessage
          });
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Convert ZodError to a more usable format
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            fieldErrors[err.path.join('.')] = err.message;
          }
        });
        
        setErrors(fieldErrors);
        
        // Call onError if provided
        if (onError) {
          onError(error);
        }
        
        // Show error toast if specified
        if (errorMessage) {
          toast({
            title: "Erro",
            description: errorMessage,
            variant: "destructive"
          });
        }
      } else {
        // Handle unexpected errors
        console.error("Erro inesperado:", error);
        
        toast({
          title: "Erro",
          description: "Ocorreu um erro inesperado",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, schema, onSubmit, onSuccess, onError, successMessage, errorMessage, toast]);

  const setValue = useCallback((name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when it's set
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  return {
    formData,
    setFormData,
    errors,
    isSubmitting,
    handleChange,
    handleSelectChange,
    handleSubmit,
    setValue
  };
}
