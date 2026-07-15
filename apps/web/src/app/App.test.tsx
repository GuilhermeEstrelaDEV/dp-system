import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithRouter } from '@/test/renderWithRouter';

describe('application shell', () => {
  it('renders semantic layout regions and the demonstrative dashboard', () => {
    renderWithRouter();

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Visão geral' })).toBeInTheDocument();
    expect(screen.getAllByText('Ambiente demonstrativo').length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Todos os números e atividades abaixo são fictícios/i),
    ).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('navigates to a placeholder and marks the active route', async () => {
    renderWithRouter();

    fireEvent.click(screen.getByRole('link', { name: /Administração/ }));

    expect(await screen.findByRole('heading', { name: 'Administração' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Administração/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByLabelText('Navegação estrutural')).toHaveTextContent(
      /Início\s*\/\s*Administração/,
    );
    expect(screen.getByText(/rota de placeholder/i)).toBeInTheDocument();
  });

  it('recolhe a sidebar mantendo seus rótulos acessíveis', () => {
    renderWithRouter();

    const toggle = screen.getByRole('button', { name: 'Recolher barra lateral' });
    fireEvent.click(toggle);

    expect(screen.getByRole('button', { name: 'Expandir barra lateral' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('link', { name: /Colaboradores/ })).toHaveAttribute(
      'title',
      'Colaboradores',
    );
  });

  it('fecha o menu móvel pelo botão de fechar e devolve o foco ao gatilho', async () => {
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
    const dialog = screen.getByRole('dialog', { name: 'Menu de navegação' });
    fireEvent.click(within(dialog).getByRole('link', { name: /Colaboradores/ }));

    expect(await screen.findByRole('heading', { name: 'Colaboradores' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Menu de navegação' })).not.toBeInTheDocument();
  });
});
