export type DashboardMetric = { value: number; label: string; description: string };
export type DashboardDataPoint = { key: string; label: string; value: number };
export type DashboardActivity = { type: string; occurredAt: string; description: string };

export type DashboardSummary = {
  context: { companyId: string; companyName: string; generatedAt: string; timezone: 'UTC' };
  access: 'AVAILABLE' | 'RESTRICTED';
  review?: {
    metrics: DashboardMetric[];
    statusDistribution: DashboardDataPoint[];
    sixMonthTimeline: DashboardDataPoint[];
    recentActivity: DashboardActivity[];
  };
  payrollPeriod?: {
    metrics: DashboardMetric[];
    statusDistribution: DashboardDataPoint[];
  };
};
