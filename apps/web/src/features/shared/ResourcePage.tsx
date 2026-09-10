import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DataTable, DataTableActions, DataTableStatus } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FieldError,
  FilterBar,
  FormActions,
  FormSection,
  Input,
  LoadingState,
  Select,
} from '@/components/common/Primitives';
import { useOptionalAuth } from '@/features/auth/AuthContext';
import { apiRequest } from '@/lib/api';

type Field = readonly [key: string, label: string, required?: boolean];

interface RecordItem {
  id: string;
  status: string;
}

interface PageProps {
  title: string;
  endpoint: string;
  fields: readonly Field[];
  companyScoped?: boolean;
  manageCapability?: string;
  createLabel?: string;
  description?: string;
}

export function ResourcePage<TItem extends RecordItem>({
  title,
  endpoint,
  fields,
  companyScoped = false,
  manageCapability,
  createLabel = 'Novo cadastro',
  description = 'Cadastros operacionais da empresa ativa.',
}: PageProps) {
  const auth = useOptionalAuth();
  const canManage = !manageCapability || (auth?.hasCapability(manageCapability) ?? true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TItem | null>(null);
  const [selected, setSelected] = useState<TItem | null>(null);
  const [pendingStatus, setPendingStatus] = useState<TItem | null>(null);
  const formId = useId();
  const client = useQueryClient();
  const schema = z.object(
    Object.fromEntries(
      fields.map(([key, label, required = true]) => [
        key,
        required ? z.string().min(1, `${label} é obrigatório`) : z.string().max(1000).optional(),
      ]),
    ),
  );
  const form = useForm<Record<string, string | undefined>>({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(fields.map(([key]) => [key, ''])),
  });
  const companyId = companyScoped ? (auth?.activeCompanyId ?? '') : '';
  const ready = !companyScoped || Boolean(companyId);
  const list = useQuery({
    queryKey: [endpoint, auth?.activeCompanyId, companyId, search, status, page],
    enabled: ready,
    queryFn: () =>
      apiRequest<{ items: TItem[]; pagination: { totalPages: number } }>(
        `${endpoint}?page=${page}&pageSize=20${companyScoped ? `&companyId=${companyId}` : ''}&search=${encodeURIComponent(search)}${status ? `&status=${status}` : ''}`,
      ),
  });
  const save = useMutation({
    mutationFn: (values: Record<string, string | undefined>) =>
      apiRequest<TItem>(editing ? `${endpoint}/${editing.id}` : endpoint, {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify(companyScoped && !editing ? { ...values, companyId } : values),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: [endpoint] });
      setEditing(null);
      setShowForm(false);
      setSelected(null);
      form.reset();
    },
  });
  const toggle = useMutation({
    mutationFn: (item: TItem) =>
      apiRequest<TItem>(
        `${endpoint}/${item.id}/${item.status === 'ACTIVE' ? 'inactivate' : 'activate'}`,
        { method: 'PATCH' },
      ),
    onSuccess: () => void client.invalidateQueries({ queryKey: [endpoint] }),
  });

  const openCreate = () => {
    save.reset();
    setEditing(null);
    form.reset();
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setShowForm(false);
    form.reset();
  };

  const beginEdit = (item: TItem) => {
    save.reset();
    setSelected(null);
    setEditing(item);
    setShowForm(true);
    fields.forEach(([key]) => form.setValue(key, String(item[key as keyof TItem] ?? '')));
  };

  return (
    <section aria-labelledby="resource-title">
      <PageHeader description={description} headingId="resource-title" title={title}>
        {canManage ? (
          <Button aria-label={createLabel} onClick={openCreate} type="button">
            + {createLabel}
          </Button>
        ) : null}
      </PageHeader>

      <FilterBar>
        <label className="ui-field">
          Buscar
          <Input
            aria-label={`Pesquisar ${title}`}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={`Buscar em ${title.toLowerCase()}`}
            type="search"
            value={search}
          />
        </label>
        <label className="ui-field">
          Status
          <Select
            aria-label="Filtrar por status"
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            value={status}
          >
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativos</option>
            <option value="INACTIVE">Inativos</option>
          </Select>
        </label>
      </FilterBar>

      {showForm ? (
        <form
          className="ui-form-card"
          onSubmit={form.handleSubmit((values) => save.mutate(values))}
        >
          <FormSection
            description="Preencha os campos obrigatórios. Use somente dados fictícios no ambiente demonstrativo."
            title={editing ? `Editar registro em ${title}` : createLabel}
          >
            {fields.map(([key, label, required = true]) => {
              const error = form.formState.errors[key]?.message;
              const errorId = `${formId}-${key}-error`;
              return (
                <label className="ui-field" key={key}>
                  <span>
                    {label}{' '}
                    {required ? (
                      <span aria-hidden="true" className="ui-required">
                        *
                      </span>
                    ) : (
                      <small>(opcional)</small>
                    )}
                  </span>
                  <Input
                    {...form.register(key)}
                    aria-describedby={error ? errorId : undefined}
                    aria-invalid={Boolean(error)}
                    aria-required={required}
                  />
                  <FieldError id={errorId}>{error}</FieldError>
                </label>
              );
            })}
          </FormSection>
          {save.isError ? <Alert tone="danger">{save.error.message}</Alert> : null}
          <FormActions>
            <Button onClick={closeForm} type="button" variant="secondary">
              Cancelar
            </Button>
            <Button disabled={save.isPending} type="submit">
              {save.isPending ? 'Salvando…' : editing ? 'Salvar alterações' : createLabel}
            </Button>
          </FormActions>
        </form>
      ) : null}

      {save.isSuccess && !showForm ? (
        <Alert tone="success">Registro salvo com sucesso.</Alert>
      ) : null}
      {!ready ? (
        <EmptyState
          description="Escolha a empresa ativa antes de consultar estes registros."
          title="Selecione uma empresa"
        />
      ) : list.isLoading ? (
        <LoadingState label={`Carregando ${title.toLowerCase()}…`} />
      ) : list.isError ? (
        <ErrorState message={list.error.message} onRetry={() => void list.refetch()} />
      ) : list.data?.items.length === 0 ? (
        <EmptyState
          action={
            canManage && !search && !status ? (
              <Button aria-label={createLabel} onClick={openCreate} type="button">
                + {createLabel}
              </Button>
            ) : undefined
          }
          description={
            search || status
              ? 'Ajuste a busca ou os filtros para encontrar outros registros.'
              : 'Ainda não há registros disponíveis neste contexto.'
          }
          title={`Nenhum registro em ${title.toLowerCase()}`}
        />
      ) : (
        <DataTable label={`Tabela de ${title.toLowerCase()}`}>
          <thead>
            <tr>
              {fields.map(([, label]) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
              <th scope="col">Status</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.data?.items.map((item) => (
              <tr key={item.id}>
                {fields.map(([key]) => (
                  <td
                    className={key === 'taxId' || key === 'code' ? 'ui-table-cell--compact' : ''}
                    key={key}
                  >
                    {String(item[key as keyof TItem] ?? '—')}
                  </td>
                ))}
                <td className="ui-table-cell--compact">
                  <DataTableStatus active={item.status === 'ACTIVE'} />
                </td>
                <td>
                  <DataTableActions>
                    <Button onClick={() => setSelected(item)} type="button" variant="ghost">
                      Detalhes
                    </Button>
                    {canManage ? (
                      <Button onClick={() => beginEdit(item)} type="button" variant="ghost">
                        Editar
                      </Button>
                    ) : null}
                    {canManage ? (
                      <Button
                        onClick={() => {
                          toggle.reset();
                          setPendingStatus(item);
                        }}
                        type="button"
                        variant="ghost"
                      >
                        {item.status === 'ACTIVE' ? 'Inativar' : 'Ativar'}
                      </Button>
                    ) : null}
                  </DataTableActions>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}

      {list.data ? (
        <nav aria-label="Paginação" className="ui-pagination">
          <Button
            disabled={page === 1}
            onClick={() => setPage((value) => value - 1)}
            type="button"
            variant="secondary"
          >
            Página anterior
          </Button>
          <span>
            Página {page} de {Math.max(list.data.pagination.totalPages, 1)}
          </span>
          <Button
            disabled={page >= list.data.pagination.totalPages}
            onClick={() => setPage((value) => value + 1)}
            type="button"
            variant="secondary"
          >
            Próxima página
          </Button>
        </nav>
      ) : null}

      {selected ? (
        <section aria-label="Detalhes do registro">
          <Card className="ui-details-panel">
            <h2>Detalhes</h2>
            <dl className="ui-details-list">
              {fields.map(([key, label]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>{String(selected[key as keyof TItem] ?? '—')}</dd>
                </div>
              ))}
            </dl>
            <FormActions>
              <Button onClick={() => setSelected(null)} type="button" variant="secondary">
                Fechar detalhes
              </Button>
            </FormActions>
          </Card>
        </section>
      ) : null}

      <ConfirmDialog
        confirmLabel={pendingStatus?.status === 'ACTIVE' ? 'Inativar registro' : 'Ativar registro'}
        description={`Esta ação irá ${pendingStatus?.status === 'ACTIVE' ? 'inativar' : 'ativar'} o registro. O histórico e os dados existentes serão preservados.`}
        error={toggle.isError ? toggle.error.message : undefined}
        onCancel={() => {
          toggle.reset();
          setPendingStatus(null);
        }}
        onConfirm={() => {
          if (!pendingStatus) return;
          toggle.mutate(pendingStatus, { onSuccess: () => setPendingStatus(null) });
        }}
        open={Boolean(pendingStatus)}
        pending={toggle.isPending}
        title="Confirmar alteração de status"
      />
    </section>
  );
}
