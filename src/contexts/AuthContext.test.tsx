
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Mock do supabase
vi.mock('@/integrations/supabase/client');

// Componente de teste para acessar o contexto
const TestConsumer = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(auth.loading)}</div>
      <div data-testid="user">{auth.user ? auth.user.id : 'no-user'}</div>
      <button onClick={() => auth.signIn('test@example.com', 'password')}>Sign In</button>
      <button onClick={() => auth.signOut()}>Sign Out</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock para getSession
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    } as any);
    
    // Mock para onAuthStateChange
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    } as any);
  });

  it('deve fornecer estado de autenticação inicial', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    
    // Inicialmente está carregando
    expect(screen.getByTestId('loading').textContent).toBe('true');
    
    // Após a inicialização, não tem usuário
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('no-user');
    });
  });

  it('deve chamar signIn com credenciais corretas', async () => {
    // Mock para signInWithPassword
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: { user: { id: 'test-id' } } },
      error: null
    } as any);
    
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    
    // Esperar pelo estado inicial
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Tentar fazer login
    act(() => {
      screen.getByText('Sign In').click();
    });
    
    // Verificar se o método foi chamado com as credenciais corretas
    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });
  });

  it('deve chamar signOut corretamente', async () => {
    // Mock para signOut
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as any);
    
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    
    // Esperar pelo estado inicial
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Tentar fazer logout
    act(() => {
      screen.getByText('Sign Out').click();
    });
    
    // Verificar se o método foi chamado
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });
});
