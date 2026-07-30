import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithRouter } from '@/test/renderWithRouter';

describe('application shell', () => {
  it('renders semantic layout regions, brand and demonstrative dashboard', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            context: {
              companyId: 'company-1',
              companyName: 'Empresa Teste',
              generatedAt: '2026-07-30T00:00:00Z',
              timezone: 'UTC',
            },
            access: 'RESTRICTED',
          },
          meta: {},
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    renderWithRouter();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Visão executiva' })).toBeInTheDocument();
    expect(screen.getByText('DP-System')).toBeInTheDocument();
    expect(screen.getAllByText(/Ambiente (demonstrativo|local)/).length).toBeGreaterThan(0);
  });

  it('navigates to a real module and marks the active route', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByRole('link', { name: /Colaboradores/ }));
    expect(await screen.findByRole('heading', { name: 'Colaboradores' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Colaboradores/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByLabelText('Navegação estrutural')).toHaveTextContent(
      /Início\s*\/\s*Colaboradores/,
    );
  });

  it('identifies future modules without creating actionable links', () => {
    renderWithRouter();
    expect(screen.getByText('Desligamentos').closest('[aria-disabled="true"]')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Desligamentos' })).not.toBeInTheDocument();
    expect(screen.getAllByText('Em breve')).toHaveLength(3);
  });

  it('shows company context and the user menu', () => {
    renderWithRouter();
    expect(screen.getByRole('button', { name: /Empresa Teste/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });

  it('recolhe a sidebar mantendo seus rótulos acessíveis', () => {
    renderWithRouter();
    fireEvent.click(screen.getByRole('button', { name: 'Recolher barra lateral' }));
    expect(screen.getByRole('button', { name: 'Expandir barra lateral' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('link', { name: /Colaboradores/ })).toHaveAttribute(
      'title',
      'Colaboradores',
    );
  });

  it('fecha o menu móvel e devolve o foco ao gatilho', async () => {
    renderWithRouter();
    const trigger = screen.getByRole('button', { name: 'Abrir menu de navegação' });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Menu de navegação' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Fechar menu' }));
    expect(await screen.findByRole('button', { name: 'Abrir menu de navegação' })).toHaveFocus();
    expect(screen.queryByRole('dialog', { name: 'Menu de navegação' })).not.toBeInTheDocument();
  });

  it('fecha o menu móvel por Escape, backdrop e seleção de rota', async () => {
    renderWithRouter();
    const trigger = screen.getByRole('button', { name: 'Abrir menu de navegação' });
    fireEvent.click(trigger);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(await screen.findByRole('button', { name: 'Abrir menu de navegação' })).toHaveFocus();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar menu pelo plano de fundo' }));
    expect(await screen.findByRole('button', { name: 'Abrir menu de navegação' })).toHaveFocus();
    fireEvent.click(trigger);
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Menu de navegação' })).getByRole('link', {
        name: /Colaboradores/,
      }),
    );
    expect(await screen.findByRole('heading', { name: 'Colaboradores' })).toBeInTheDocument();
  });
});
