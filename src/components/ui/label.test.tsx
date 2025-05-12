
import { render, screen } from '@/test/setup-react-testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Label } from './label';

describe('Label Component', () => {
  const originalConsoleWarn = console.warn;
  
  beforeEach(() => {
    // Mock console.warn para testar avisos
    console.warn = vi.fn();
  });
  
  afterEach(() => {
    // Restaurar console.warn original
    console.warn = originalConsoleWarn;
  });

  it('renderiza corretamente com texto', () => {
    render(<Label>Test Label</Label>);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('aceita e aplica propriedade htmlFor', () => {
    render(<Label htmlFor="test-id">Test Label</Label>);
    expect(screen.getByText('Test Label')).toHaveAttribute('for', 'test-id');
  });

  it('emite aviso quando não tem htmlFor nem filhos', () => {
    render(<Label />);
    expect(console.warn).toHaveBeenCalledWith(
      'Label: Labels should have htmlFor attribute when not wrapping the labeled element'
    );
  });

  it('não emite aviso quando tem filhos mas não tem htmlFor', () => {
    render(<Label>Label com filhos</Label>);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('aceita propriedades adicionais', () => {
    render(<Label data-testid="my-label">Test</Label>);
    expect(screen.getByTestId('my-label')).toBeInTheDocument();
  });
});
