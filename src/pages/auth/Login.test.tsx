
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Login from './Login';

// Mock dos hooks
vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/use-toast');
vi.mock('@/hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({
    error: null,
    handleError: vi.fn(),
    clearError: vi.fn()
  })
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock padrão para useAuth
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: null,
      signIn: vi.fn().mockResolvedValue({ success: true }),
      signOut: vi.fn(),
      refresh: vi.fn(),
      organization: null
    });
    
    // Mock para useToast
    vi.mocked(useToast).mockReturnValue({
      toast: vi.fn(),
      dismiss: vi.fn()
      // Removido a propriedade update que estava causando erro
    });
  });

  it('renderiza o formulário de login quando o usuário não está autenticado', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    expect(screen.getByText('GasFlow Aqua')).toBeInTheDocument();
    expect(screen.getByText('Faça login para acessar o sistema')).toBeInTheDocument();
  });

  it('não renderiza conteúdo quando o usuário está autenticado', () => {
    // Simular usuário autenticado
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '123', email: 'teste@exemplo.com' } as any,
      session: { user: { id: '123' } } as any,
      loading: false,
      error: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      refresh: vi.fn(),
      organization: null
    });
    
    const { container } = render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    // O componente deve retornar null quando o usuário está autenticado
    expect(container.firstChild).toBeNull();
  });
});
