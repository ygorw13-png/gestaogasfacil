
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UserList } from './UserList';

describe('UserList Component', () => {
  const mockUsers = [
    { id: '1', name: 'João Silva', role: 'admin' },
    { id: '2', name: 'Maria Souza', role: 'colaborador' },
  ];

  it('renderiza corretamente sem usuários', () => {
    const onAddUser = vi.fn();
    render(<UserList users={[]} loading={false} onAddUserClick={onAddUser} />);
    
    expect(screen.getByText('Não há usuários cadastrados')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /adicionar usuário/i })).toBeInTheDocument();
  });

  it('renderiza corretamente com usuários', () => {
    const onAddUser = vi.fn();
    render(<UserList users={mockUsers} loading={false} onAddUserClick={onAddUser} />);
    
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Maria Souza')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('colaborador')).toBeInTheDocument();
  });

  it('mostra indicador de carregamento quando loading=true', () => {
    const onAddUser = vi.fn();
    render(<UserList users={[]} loading={true} onAddUserClick={onAddUser} />);
    
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('chama onAddUserClick quando botão é clicado', () => {
    const onAddUser = vi.fn();
    render(<UserList users={mockUsers} loading={false} onAddUserClick={onAddUser} />);
    
    fireEvent.click(screen.getByRole('button', { name: /adicionar usuário/i }));
    expect(onAddUser).toHaveBeenCalledTimes(1);
  });
});
