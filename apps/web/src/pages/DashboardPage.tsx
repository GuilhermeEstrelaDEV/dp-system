import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Alert, Badge, Button, Card, EmptyState, Skeleton } from '@/components/common/Primitives';
import { StatCard } from '@/components/common/StatCard';
import { useAuth } from '@/features/auth/AuthContext';
import { ApiClientError, apiRequest } from '@/lib/api';
import { minimalProjectionKey } from '@/lib/projectionCache';

type Metric = { value: number; label: string; description: string };
type Point = { key: string; label: string; value: number };
type Activity = { type: string; occurredAt: string };
type DashboardSummary = {
  context: { companyId: string; companyName: string; generatedAt: string; timezone: 'UTC' };
  access: 'AVAILABLE' | 'RESTRICTED';
  review?: {
    metrics: Metric[];
    statusDistribution: Point[];
    sixMonthTimeline: Point[];
    recentActivity: Activity[];
  };
  payrollPeriod?: { metrics: Metric[]; statusDistribution: Point[] };
};

function Bars({ title, points }: { readonly title: string; readonly points: Point[] }) {
  const maximum = Math.max(...points.map(({ value }) => value), 1);
  if (!points.length)
    return (
      <EmptyState
        title="Sem dados para distribuição"
        description="Nenhum registro autorizado foi encontrado na empresa ativa."
      />
    );
  return (
    <Card className="dashboard-panel">
      <h2>{title}</h2>
      <ul aria-label={title} className="dashboard-bars">
        {points.map((point) => (
          <li key={point.key}>
            <span>{point.label}</span>
            <span aria-label={`${point.label}: ${point.value}`} className="dashboard-bars__track">
              <span style={{ width: `${(point.value / maximum) * 100}%` }} />
            </span>
            <strong>{point.value}</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function DashboardPage() {
  const auth = useAuth();
  const company = auth.companies.find(({ id }) => id === auth.activeCompanyId);
  const query = useQuery({
    queryKey: minimalProjectionKey(auth.activeCompanyId, auth.user?.actorId, 'dashboard-summary'),
    queryFn: ({ signal }) => apiRequest<DashboardSummary>('/dashboard/summary', { signal }),
    enabled: Boolean(auth.activeCompanyId),
    retry: (count, error) =>
      !(error instanceof ApiClientError && [401, 403, 404].includes(error.status)) && count < 1,
  });

  if (!auth.activeCompanyId)
    return (
      <EmptyState
        title="Selecione uma empresa"
        description="O dashboard exige um contexto empresarial ativo."
      />
    );
  if (query.isPending)
    return (
      <section aria-label="Carregando dashboard">
        <Skeleton label="Carregando indicadores executivos" />
        <Skeleton label="Carregando visualizações" />
      </section>
    );
  if (query.isError)
    return (
      <Alert tone="danger">
        Não foi possível carregar o dashboard.{' '}
        <Button onClick={() => void query.refetch()} variant="secondary">
          Tentar novamente
        </Button>
      </Alert>
    );

  const summary = query.data;
  const metrics = [
    ...(summary.review?.metrics ?? []),
    ...(summary.payrollPeriod?.metrics ?? []),
  ].slice(0, 6);
  const distribution =
    summary.review?.statusDistribution ?? summary.payrollPeriod?.statusDistribution ?? [];
  return (
    <section aria-labelledby="dashboard-title">
      <Alert tone="warning">
        Ambiente demonstrativo local. Os valores exibidos são calculados do banco e limitados à
        empresa ativa.
      </Alert>
      <PageHeader
        description={`Resumo autorizado de ${summary.context.companyName}. Atualizado em UTC.`}
        title="Visão executiva"
      >
        <Badge tone="neutral">{company?.tradeName ?? summary.context.companyName}</Badge>
      </PageHeader>
      {summary.access === 'RESTRICTED' ? (
        <EmptyState
          title="Indicadores restritos"
          description="Sua identidade está autenticada, mas não possui acesso aos indicadores disponíveis. Este é o comportamento seguro esperado."
        />
      ) : metrics.length === 0 ? (
        <EmptyState
          title="Empresa sem dados disponíveis"
          description="Não há registros autorizados para compor os indicadores desta empresa."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric) => (
              <StatCard
                detail={`${metric.description} Empresa: ${summary.context.companyName}.`}
                key={metric.label}
                label={metric.label}
                value={metric.value.toLocaleString('pt-BR')}
              />
            ))}
          </div>
          <div className="dashboard-visuals">
            <Bars
              points={distribution}
              title={summary.review ? 'Ciclos por status' : 'Competências por status'}
            />
            {summary.review && (
              <Bars
                points={summary.review.sixMonthTimeline}
                title="Eventos de conferência — últimos 6 meses"
              />
            )}
          </div>
          {summary.review && (
            <Card className="dashboard-panel">
              <h2>Atividade recente de conferência</h2>
              {summary.review.recentActivity.length ? (
                <ul className="dashboard-activity">
                  {summary.review.recentActivity.map((activity) => (
                    <li key={`${activity.type}-${activity.occurredAt}`}>
                      <span>{activity.type}</span>
                      <time dateTime={activity.occurredAt}>
                        {new Intl.DateTimeFormat('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                          timeZone: 'UTC',
                        }).format(new Date(activity.occurredAt))}{' '}
                        UTC
                      </time>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="Sem atividade recente"
                  description="Nenhum evento de conferência foi registrado nos últimos seis meses."
                />
              )}
            </Card>
          )}
          {auth.hasCapability('payroll.review.view') && (
            <nav aria-label="Atalhos do dashboard" className="dashboard-shortcuts">
              <Link to="/folha/conferencia">Consultar conferências de folha</Link>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
