
import { render, screen, waitFor } from '@/test/setup-react-testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import Login from './Login';

// Mock the essential hooks only
vi.mock('@/contexts/auth');
vi.mock('@/hooks/use-toast');
vi.mock('@/utils/csrfProtection', () => ({
  useCsrfProtection: () => ({
    csrfToken: 'test-csrf-token',
    validateCsrfToken: vi.fn().mockReturnValue(true),
    refreshCsrfToken: vi.fn(),
    addCsrfHeader: vi.fn()
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
      permissions: {ready:false,error:false,roles:[]},
      profile: null,
      user: null,
      session: null,
      loading: false,
      error: null,
      signIn: vi.fn().mockResolvedValue({ success: true }),
      signOut: vi.fn(),
      refresh: vi.fn(),
      organization: null,
      hasRole: vi.fn().mockReturnValue(false),
      getUserCurrentRole: vi.fn().mockReturnValue(null)
    });
    
    // Mock para useToast
    vi.mocked(useToast).mockReturnValue({
      toast: vi.fn(),
      dismiss: vi.fn(),
      toasts: []
    });
  });

  it('renderiza o formulário de login quando o usuário não está autenticado', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i, {selector:'input'})).toBeInTheDocument();
  });

  it('não renderiza conteúdo quando o usuário está autenticado', () => {
    // Simular usuário autenticado
    vi.mocked(useAuth).mockReturnValue({
      permissions: {ready:true,error:false,roles:['entregador']},
      profile: null,
      user: { id: '123', email: 'teste@exemplo.com' } as any,
      session: { user: { id: '123' } } as any,
      loading: false,
      error: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      refresh: vi.fn(),
      organization: null,
      hasRole: vi.fn().mockReturnValue(false),
      getUserCurrentRole: vi.fn().mockReturnValue('entregador')
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
