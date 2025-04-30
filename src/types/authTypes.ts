
// Authentication types

// Registration form data
export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Validation errors
export interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// Authentication response
export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: any;
}
