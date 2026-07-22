import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithRouter } from '@/test/renderWithRouter';

const meta = { correlationId: 'trace-1', timestamp: new Date(0).toISOString(), path: '/api/v1' };
const success = (data: unknown) =>
  new Response(JSON.stringify({ data, meta }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
const failure = (status: number, message: string) =>
  new Response(JSON.stringify({ error: { code: 'ERROR', message }, meta }), {
    status,
    headers: { 'content-type': 'application/json' },
  });

describe('authenticated experience', () => {
  it('logs in, loads identity and allows company selection', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(success({ accessToken: 'initial-token', tokenType: 'Bearer' }))
      .mockResolvedValueOnce(success({ actorId: 'actor', activeCompanyId: null, permissions: [] }))
      .mockResolvedValueOnce(
        success([{ id: 'company', legalName: 'Empresa SA', tradeName: 'Empresa' }]),
      )
      .mockResolvedValueOnce(success({ accessToken: 'company-token', tokenType: 'Bearer' }))
      .mockResolvedValueOnce(
        success({
          actorId: 'actor',
          activeCompanyId: 'company',
          permissions: ['payroll.review.view'],
        }),
      )
      .mockResolvedValueOnce(
        success([{ id: 'company', legalName: 'Empresa SA', tradeName: 'Empresa' }]),
      );
    renderWithRouter('/login', false);
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('heading', { name: 'Selecionar empresa' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Acessar empresa' }));
    expect(await screen.findByRole('heading', { name: 'Visão geral' })).toBeInTheDocument();
    expect(sessionStorage.getItem('dp-system.session.v1')).toContain('company-token');
  });

  it('shows invalid credentials without creating a session', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(failure(401, 'Credenciais inválidas'));
    renderWithRouter('/login', false);
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'invalid123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciais inválidas');
    expect(sessionStorage.getItem('dp-system.session.v1')).toBeNull();
  });

  it('redirects anonymous users and denies a missing capability', async () => {
    renderWithRouter('/folha/conferencia', false);
    expect(await screen.findByRole('heading', { name: 'Entrar no DP-System' })).toBeInTheDocument();
    renderWithRouter('/folha/conferencia', true, []);
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Acesso negado' })).toBeInTheDocument(),
    );
  });
});
