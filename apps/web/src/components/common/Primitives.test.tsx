import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog, ErrorState, FormSection, Select, Textarea } from './Primitives';

describe('ConfirmDialog', () => {
  it('focuses the safe action and supports Escape', () => {
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        confirmLabel="Inativar registro"
        description="O histórico será preservado."
        onCancel={onCancel}
        onConfirm={vi.fn()}
        open
        title="Confirmar alteração"
      />,
    );

    const cancel = screen.getByRole('button', { name: 'Cancelar' });
    expect(cancel).toHaveFocus();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('does not cancel a pending action with Escape', () => {
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        confirmLabel="Inativar registro"
        description="O histórico será preservado."
        onCancel={onCancel}
        onConfirm={vi.fn()}
        open
        pending
        title="Confirmar alteração"
      />,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Processando…' })).toBeDisabled();
  });

  it('keeps a mutation error visible inside the dialog', () => {
    render(
      <ConfirmDialog
        confirmLabel="Inativar registro"
        description="O histórico será preservado."
        error="Falha controlada ao alterar o status"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        open
        title="Confirmar alteração"
      />,
    );

    const dialog = screen.getByRole('dialog', { name: 'Confirmar alteração' });
    expect(dialog).toContainElement(screen.getByRole('alert'));
    expect(screen.getByRole('alert')).toHaveTextContent('Falha controlada ao alterar o status');
  });
});

describe('form and feedback primitives', () => {
  it('applies the shared control styles to select and textarea', () => {
    render(
      <>
        <Select aria-label="Status">
          <option value="ACTIVE">Ativo</option>
        </Select>
        <Textarea aria-label="Observações" />
      </>,
    );

    expect(screen.getByLabelText('Status')).toHaveClass('ui-select');
    expect(screen.getByLabelText('Observações')).toHaveClass('ui-textarea');
  });

  it('renders an error without offering an unavailable retry action', () => {
    render(<ErrorState message="Falha controlada" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Falha controlada');
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
  });

  it('allows a form section without optional supporting copy', () => {
    render(
      <FormSection title="Dados básicos">
        <span>Campo demonstrativo</span>
      </FormSection>,
    );

    expect(screen.getByRole('heading', { name: 'Dados básicos' })).toBeInTheDocument();
    expect(screen.getByText('Campo demonstrativo')).toBeInTheDocument();
  });
});
