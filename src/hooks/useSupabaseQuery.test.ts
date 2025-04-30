
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useToast } from './use-toast';

// Mocks
vi.mock('./use-toast');

describe('useSupabaseQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({
      toast: vi.fn(),
      dismiss: vi.fn(),
      // Removido a propriedade update que estava causando erro
    });
  });

  it('deve retornar estado inicial correto', () => {
    const mockQueryFn = vi.fn().mockResolvedValue({
      data: [],
      error: null
    });

    const { result } = renderHook(() => useSupabaseQuery({
      queryFn: mockQueryFn
    }));

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.refetch).toBe('function');
  });

  it('deve carregar dados com sucesso', async () => {
    const mockData = [{ id: 1, name: 'Test' }];
    const mockQueryFn = vi.fn().mockResolvedValue({
      data: mockData,
      error: null
    });
    const mockOnSuccess = vi.fn();

    const { result } = renderHook(() => useSupabaseQuery({
      queryFn: mockQueryFn,
      onSuccess: mockOnSuccess
    }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockQueryFn).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
    expect(mockOnSuccess).toHaveBeenCalledWith(mockData);
  });

  it('deve lidar com erros corretamente', async () => {
    const mockError = { message: 'Error fetching data', code: 'SOME_ERROR' };
    const mockQueryFn = vi.fn().mockResolvedValue({
      data: null,
      error: mockError
    });
    const mockOnError = vi.fn();
    const toast = vi.fn();
    
    vi.mocked(useToast).mockReturnValue({
      toast,
      dismiss: vi.fn(),
      // Removido a propriedade update que estava causando erro
    });

    const { result } = renderHook(() => useSupabaseQuery({
      queryFn: mockQueryFn,
      onError: mockOnError,
      errorMessage: 'Custom error message'
    }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockQueryFn).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toEqual(mockError);
    expect(mockOnError).toHaveBeenCalledWith(mockError);
    expect(toast).toHaveBeenCalledWith({
      title: "Erro",
      description: "Custom error message",
      variant: "destructive"
    });
  });

  it('não deve executar a consulta se enabled=false', async () => {
    const mockQueryFn = vi.fn().mockResolvedValue({
      data: [],
      error: null
    });

    renderHook(() => useSupabaseQuery({
      queryFn: mockQueryFn,
      enabled: false
    }));

    // Aguardar para garantir que não houve chamadas
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(mockQueryFn).not.toHaveBeenCalled();
  });
});
