
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSupabaseCRUD } from './useSupabaseCRUD';
import { useSupabaseErrorHandler } from './useSupabaseHelpers';

// Mock do módulo de cliente Supabase
vi.mock('@/integrations/supabase/client', () => {
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockFrom = vi.fn(() => ({
    select: mockSelect.mockReturnThis(),
    eq: mockEq.mockReturnThis(),
    insert: mockInsert.mockReturnThis(),
    update: mockUpdate.mockReturnThis(),
    delete: mockDelete.mockReturnThis(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis()
  }));

  return {
    supabase: {
      from: mockFrom
    }
  };
});

// Mock do hook de tratamento de erros
vi.mock('./useSupabaseHelpers', () => ({
  useSupabaseErrorHandler: vi.fn(),
  buildSupabaseQuery: vi.fn((query) => query)
}));

describe('useSupabaseCRUD', () => {
  const mockHandleError = vi.fn();
  const mockHandleSuccess = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configuração padrão do mock do useSupabaseErrorHandler
    vi.mocked(useSupabaseErrorHandler).mockReturnValue({
      handleError: mockHandleError.mockImplementation((error) => null),
      handleSuccess: mockHandleSuccess
    });
  });

  it('deve retornar as funções CRUD e os estados', () => {
    const { result } = renderHook(() => useSupabaseCRUD('clients'));
    
    expect(result.current.getAll).toBeInstanceOf(Function);
    expect(result.current.getById).toBeInstanceOf(Function);
    expect(result.current.create).toBeInstanceOf(Function);
    expect(result.current.update).toBeInstanceOf(Function);
    expect(result.current.remove).toBeInstanceOf(Function);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('deve definir loading como true durante operações', async () => {
    const supabase = await import('@/integrations/supabase/client');
    vi.mocked(supabase.supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis()
    } as any));

    const { result } = renderHook(() => useSupabaseCRUD('clients'));
    
    // Início da operação - verificação requer await do act
    const loadingPromise = act(async () => {
      result.current.getById('123');
      // Estado intermediário de loading
      expect(result.current.loading).toBe(true);
    });
    
    // Aguarda a operação concluir
    await loadingPromise;
    
    // Loading deve ser false após a operação
    expect(result.current.loading).toBe(false);
  });
});
