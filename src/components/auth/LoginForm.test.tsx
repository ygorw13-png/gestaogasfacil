
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
  const mockSubmit = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza corretamente', () => {
    render(
      <BrowserRouter>
        <LoginForm onSubmit={mockSubmit} loading={false} error={null} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('GasFlow Aqua')).toBeInTheDocument();
    expect(screen.getByText('Faça login para acessar o sistema')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('exibe mensagem de erro quando fornecida', () => {
    render(
      <BrowserRouter>
        <LoginForm onSubmit={mockSubmit} loading={false} error="Credenciais inválidas" />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument();
  });

  it('desabilita o formulário durante o carregamento', () => {
    render(
      <BrowserRouter>
        <LoginForm onSubmit={mockSubmit} loading={true} error={null} />
      </BrowserRouter>
    );
    
    expect(screen.getByLabelText('E-mail')).toBeDisabled();
    expect(screen.getByLabelText('Senha')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Entrando...' })).toBeDisabled();
  });

  it('exibe erros de validação quando os campos são preenchidos incorretamente', async () => {
    render(
      <BrowserRouter>
        <LoginForm onSubmit={mockSubmit} loading={false} error={null} />
      </BrowserRouter>
    );
    
    // Email inválido
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'email-invalido' }
    });
    
    // Senha muito curta
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: '123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    
    // Verificamos se não chamou onSubmit porque temos erros de validação
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('chama a função onSubmit com email e senha corretos ao enviar o formulário', () => {
    render(
      <BrowserRouter>
        <LoginForm onSubmit={mockSubmit} loading={false} error={null} />
      </BrowserRouter>
    );
    
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'teste@exemplo.com' }
    });
    
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha123456' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    
    expect(mockSubmit).toHaveBeenCalledWith('teste@exemplo.com', 'senha123456');
  });
});
