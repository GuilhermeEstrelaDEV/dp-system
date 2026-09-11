import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  Button,
  ConfirmDialog,
  ErrorState,
  FormActions,
  FormField,
  FormSection,
  Input,
  Select,
  Textarea,
} from './Primitives';

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

  it('keeps label, control, help text and error in a readable field sequence', () => {
    render(
      <form className="ui-form-card">
        <FormSection description="Dados demonstrativos." title="Dados básicos">
          <FormField
            error="Versão inválida"
            errorId="version-error"
            help="Use a versão aprovada."
            helpId="version-help"
            label="Versão"
            required
          >
            <Input aria-describedby="version-help version-error" aria-invalid="true" />
          </FormField>
        </FormSection>
        <FormActions>
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </FormActions>
      </form>,
    );

    const control = screen.getByLabelText(/Versão/);
    const field = control.closest('label');
    expect(field).toHaveClass('ui-field');
    expect(field?.children).toHaveLength(4);
    expect(field?.children[0]).toHaveClass('ui-field__label');
    expect(field?.children[1]).toBe(control);
    expect(field?.children[2]).toHaveClass('ui-field-help');
    expect(field?.children[3]).toHaveClass('ui-field-error');
    expect(screen.getByText('Use a versão aprovada.')).toHaveAttribute('id', 'version-help');
    expect(screen.getByRole('alert')).toHaveAttribute('id', 'version-error');
    expect(screen.getByRole('button', { name: 'Cancelar' }).parentElement).toHaveClass(
      'ui-form-actions',
    );
  });

  it('preserves the shared responsive form and table spacing contract', () => {
    const formStyles = readFileSync(resolve('src/styles/index.css'), 'utf8');

    expect(formStyles).toContain('--form-label-control-gap: 0.5rem');
    expect(formStyles).toContain('.app-content label:not(.flex)');
    expect(formStyles).toContain('.app-content form.grid');
    expect(formStyles).toContain('@media (max-width: 640px)');
    expect(formStyles).toMatch(
      /\.ui-form-grid\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\)/u,
    );
    expect(formStyles).toContain('scrollbar-gutter: stable');
  });
});
