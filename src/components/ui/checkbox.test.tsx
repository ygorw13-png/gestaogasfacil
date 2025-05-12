
import { render, screen } from '@/test/setup-react-testing';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Checkbox } from './checkbox';

describe('Checkbox Component', () => {
  it('renderiza corretamente', () => {
    render(<Checkbox />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('aceita e aplica classes CSS adicionais', () => {
    render(<Checkbox className="test-class" />);
    expect(screen.getByRole('checkbox')).toHaveClass('test-class');
  });

  it('suporta estado disabled', () => {
    render(<Checkbox disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('chama o callback onChange quando clicado', async () => {
    const handleChange = vi.fn();
    render(<Checkbox onChange={handleChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});
