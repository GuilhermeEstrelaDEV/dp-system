import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { type RecordKind, variableCompensationApi } from './api';

const kinds: Array<[RecordKind, string]> = [
  ['events', 'Comissões e prêmios'],
  ['advances', 'Adiantamentos'],
  ['off-cycle-payments', 'Pagamentos externos'],
  ['reconciliations', 'Conciliações'],
];
const decimalPattern = /^-?\d+(?:\.\d{1,2})?$/;

export function VariableCompensationPanel() {
  const client = useQueryClient();
  const [kind, setKind] = useState<RecordKind>('events');
  const [referenceId, setReferenceId] = useState('');
  const [referencePeriod, setReferencePeriod] = useState('');
  const [type, setType] = useState('');
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const queryName = kind === 'reconciliations' ? 'payrollRunId' : 'employmentContractId';
  const records = useQuery({
    queryKey: ['variable-compensation', kind, referenceId],
    enabled: Boolean(referenceId),
    queryFn: () =>
      variableCompensationApi.list(kind, new URLSearchParams({ [queryName]: referenceId })),
  });
  const create = useMutation({
    mutationFn: (body: Record<string, string>) => variableCompensationApi.create(kind, body),
    onSuccess: () => {
      setAmount('');
      setType('');
      setDetails('');
      void client.invalidateQueries({ queryKey: ['variable-compensation'] });
    },
  });
  const isReconciliation = kind === 'reconciliations';

  return (
    <section className="mt-6" aria-labelledby="variable-compensation-title">
      <h2 id="variable-compensation-title">Remuneração variável e conciliação</h2>
      <p role="note">
        Registros administrativos demonstrativos. Não calculam comissão, desconto, tributo ou
        pagamento e não representam aprovação financeira.
      </p>
      <label>
        Tipo de registro
        <select value={kind} onChange={(event) => setKind(event.target.value as RecordKind)}>
          {kinds.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <form
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!decimalPattern.test(amount)) return;
          create.mutate({
            [queryName]: referenceId,
            ...(kind !== 'advances' ? { type } : {}),
            ...(isReconciliation ? { differenceAmount: amount } : { amount, referencePeriod }),
            ...(kind === 'off-cycle-payments' ? { reason: details } : {}),
            ...(kind === 'events' && details ? { policyReference: details } : {}),
            ...(isReconciliation && details ? { notes: details } : {}),
          });
        }}
      >
        <label>
          {isReconciliation ? 'Execução de folha' : 'Contrato'}
          <input
            value={referenceId}
            onChange={(event) => setReferenceId(event.target.value)}
            required
          />
        </label>
        {!isReconciliation ? (
          <label>
            Competência
            <input
              type="date"
              value={referencePeriod}
              onChange={(event) => setReferencePeriod(event.target.value)}
              required
            />
          </label>
        ) : null}
        {kind !== 'advances' ? (
          <label>
            Tipo
            <input value={type} onChange={(event) => setType(event.target.value)} required />
          </label>
        ) : null}
        <label>
          {isReconciliation ? 'Diferença' : 'Valor'}
          <input value={amount} onChange={(event) => setAmount(event.target.value)} required />
        </label>
        {kind === 'events' || kind === 'off-cycle-payments' || isReconciliation ? (
          <label>
            {kind === 'off-cycle-payments' ? 'Motivo' : 'Referência/observações'}
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              required={kind === 'off-cycle-payments'}
            />
          </label>
        ) : null}
        <button disabled={create.isPending}>Registrar</button>
        {amount && !decimalPattern.test(amount) ? (
          <p role="alert">Informe um decimal com até duas casas.</p>
        ) : null}
        {create.isError ? <p role="alert">{create.error.message}</p> : null}
      </form>
      {records.isLoading ? <p role="status">Carregando registros…</p> : null}
      {records.isError ? <p role="alert">{records.error.message}</p> : null}
      {referenceId && records.data?.length === 0 ? <p>Nenhum registro encontrado.</p> : null}
      <ul aria-label="Registros de remuneração variável">
        {records.data?.map((record) => (
          <li key={record.id}>
            <strong>{record.type ?? kind}</strong> · {record.amount ?? record.differenceAmount} ·{' '}
            {record.approvalStatus ?? record.status ?? 'PENDING'}
          </li>
        ))}
      </ul>
    </section>
  );
}
