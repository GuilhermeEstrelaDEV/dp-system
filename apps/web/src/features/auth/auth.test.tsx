import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithRouter } from '@/test/renderWithRouter';
import { sanitizeStoredSession } from './authSession';

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
      .mockResolvedValueOnce(
        success({
          actorId: 'actor',
          activeCompanyId: null,
          permissions: [],
          email: 'user@example.com',
          displayName: 'Usuário',
        }),
      )
      .mockResolvedValueOnce(
        success([{ id: 'company', legalName: 'Empresa SA', tradeName: 'Empresa' }]),
      )
      .mockResolvedValueOnce(success({ accessToken: 'company-token', tokenType: 'Bearer' }))
      .mockResolvedValueOnce(
        success({
          actorId: 'actor',
          activeCompanyId: 'company',
          permissions: ['payroll.review.view'],
          email: 'user@example.com',
          displayName: 'Usuário',
        }),
      )
      .mockResolvedValueOnce(
        success([{ id: 'company', legalName: 'Empresa SA', tradeName: 'Empresa' }]),
      )
      .mockResolvedValueOnce(
        success({
          context: {
            companyId: 'company',
            companyName: 'Empresa',
            generatedAt: '2026-07-30T00:00:00Z',
            timezone: 'UTC',
          },
          access: 'RESTRICTED',
        }),
      );
    renderWithRouter('/login', false);
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('heading', { name: 'Selecionar empresa' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Acessar empresa' }));
    expect(await screen.findByRole('heading', { name: 'Visão executiva' })).toBeInTheDocument();
    await waitFor(() =>
      expect(sessionStorage.getItem('dp-system.session.v1')).toContain('company-token'),
    );
  });

  it('shows invalid credentials without creating a session', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(failure(401, 'Credenciais inválidas'));
    renderWithRouter('/login', false);
    expect(screen.getAllByText('DP-System').length).toBeGreaterThan(0);
    expect(screen.getByText('Acesso seguro')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'invalid123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.');
    expect(sessionStorage.getItem('dp-system.session.v1')).toBeNull();
  });

  it('redirects anonymous users and renders a safe state for a missing capability', async () => {
    renderWithRouter('/folha/conferencia', false);
    expect(await screen.findByRole('heading', { name: 'Entrar no DP-System' })).toBeInTheDocument();
    renderWithRouter('/folha/conferencia', true, []);
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Acesso restrito' })).toBeInTheDocument(),
    );
    expect(screen.getByText('Nenhum dado foi carregado.', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao dashboard' })).toBeInTheDocument();
  });

  it('does not call a legacy API when the authenticated identity lacks platform management', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    renderWithRouter('/colaboradores', true, []);
    expect(await screen.findByRole('heading', { name: 'Acesso restrito' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Novo colaborador' })).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('drops legacy technical fields while restoring a session', () => {
    const session = sanitizeStoredSession({
      token: 'token',
      user: {
        actorId: 'actor',
        activeCompanyId: 'company',
        permissions: ['platform.read'],
        email: 'user@example.com',
        displayName: 'Usuário',
        roleCodes: ['ADMIN'],
        sessionId: 'session-secret',
        traceId: 'trace-secret',
        accessGrants: [{ id: 'grant-secret' }],
      },
      companies: [
        {
          id: 'company',
          legalName: 'Empresa SA',
          tradeName: null,
          internalCode: 'secret',
        },
      ],
    });

    expect(session).toEqual({
      token: 'token',
      user: {
        actorId: 'actor',
        activeCompanyId: 'company',
        permissions: ['platform.read'],
        email: 'user@example.com',
        displayName: 'Usuário',
      },
      companies: [{ id: 'company', legalName: 'Empresa SA', tradeName: null }],
    });
    expect(session?.user).not.toHaveProperty('roleCodes');
    expect(session?.user).not.toHaveProperty('sessionId');
    expect(session?.user).not.toHaveProperty('accessGrants');
  });
});
