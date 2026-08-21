import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { App } from '@/app/App';
import { DashboardPage } from '@/pages/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';
import { BranchesPage } from '@/features/branches';
import { CompaniesPage } from '@/features/companies';
import { CostCentersPage } from '@/features/cost-centers';
import { DepartmentsPage } from '@/features/departments';
import { PositionsPage } from '@/features/positions';
import { EmployeeDetailsPage } from '@/features/employees/EmployeeDetailsPage';
import { EmployeesPage } from '@/features/employees';
import {
  EmploymentContractDetailsPage,
  EmploymentContractsPage,
} from '@/features/employment-contracts';
import { AdmissionsPage } from '@/features/admissions';
import { AdmissionChecklistPage } from '@/features/admissions/AdmissionChecklistPage';
import { AdmissionDetailsPage } from '@/features/admissions/AdmissionDetailsPage';
import { AdmissionDocumentsPage } from '@/features/admissions/AdmissionDocumentsPage';
import { AdmissionFormPage } from '@/features/admissions/AdmissionFormPage';
import { ChecklistTemplatesPage } from '@/features/admissions/ChecklistTemplatesPage';
import { TimeManagementPage } from '@/features/time-management';
import { BenefitsPage } from '@/features/benefits';
import { VacationManagementPage, VacationsLeavesPage } from '@/features/vacations-leaves';
import { PayrollPage } from '@/features/payroll';
import {
  AuthenticatedRoute,
  CapabilityRoute,
  CompanySelectionPage,
  LoginPage,
} from '@/features/auth/AuthPages';
import {
  PayrollReviewDetailPage,
  PayrollReviewRunsPage,
  PayrollRunReviewPage,
} from '@/features/payroll-review/PayrollReviewPages';
import {
  PayrollPeriodEventsPage,
  PayrollPeriodHistoryPage,
  PayrollPeriodManifestPage,
  PayrollPeriodVersionPage,
} from '@/features/payroll-period-history/PayrollPeriodHistoryPages';

export const appRoutes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/selecionar-empresa',
    element: <CompanySelectionPage />,
  },
  {
    element: <AuthenticatedRoute />,
    children: [
      {
        path: '/',
        element: <App />,
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <DashboardPage /> },
          {
            element: <CapabilityRoute capability="platform.manage" />,
            children: [
              { path: 'folha', element: <PayrollPage /> },
              { path: 'folha/competencias', element: <PayrollPage /> },
              { path: 'folha/lancamentos', element: <PayrollPage /> },
              { path: 'folha/execucoes', element: <PayrollPage /> },
            ],
          },
          {
            element: <CapabilityRoute capability="time.read" />,
            children: [{ path: 'jornada', element: <TimeManagementPage /> }],
          },
          {
            element: <CapabilityRoute capability="benefit.read" />,
            children: [{ path: 'beneficios', element: <BenefitsPage /> }],
          },
          {
            element: <CapabilityRoute capability="vacation.read" />,
            children: [{ path: 'ferias', element: <VacationManagementPage /> }],
          },
          {
            element: <CapabilityRoute capability="organization.read" />,
            children: [
              { path: 'estrutura/filiais', element: <BranchesPage /> },
              { path: 'estrutura/departamentos', element: <DepartmentsPage /> },
              { path: 'estrutura/cargos', element: <PositionsPage /> },
              { path: 'estrutura/centros-de-custo', element: <CostCentersPage /> },
            ],
          },
          {
            element: <CapabilityRoute capability="admission.read" />,
            children: [
              { path: 'admissoes', element: <AdmissionsPage /> },
              { path: 'admissoes/:admissionId', element: <AdmissionDetailsPage /> },
              { path: 'admissoes/:admissionId/checklist', element: <AdmissionChecklistPage /> },
              { path: 'admissoes/:admissionId/documentos', element: <AdmissionDocumentsPage /> },
              { path: 'configuracoes/checklists', element: <ChecklistTemplatesPage /> },
            ],
          },
          {
            element: <CapabilityRoute capability="admission.manage" />,
            children: [
              { path: 'admissoes/nova', element: <AdmissionFormPage /> },
              { path: 'admissoes/:admissionId/editar', element: <AdmissionFormPage /> },
            ],
          },
          {
            element: <CapabilityRoute capability="leave.read" />,
            children: [{ path: 'movimentacoes', element: <VacationsLeavesPage /> }],
          },
          {
            element: <CapabilityRoute capability="variable_compensation.read" />,
            children: [{ path: 'folha/remuneracao-variavel', element: <PayrollPage /> }],
          },
          {
            element: <CapabilityRoute capability="company.read" />,
            children: [
              { path: 'estrutura', element: <CompaniesPage /> },
              { path: 'estrutura/empresas', element: <CompaniesPage /> },
            ],
          },
          {
            element: <CapabilityRoute capability="employee.read" />,
            children: [
              { path: 'colaboradores', element: <EmployeesPage /> },
              { path: 'colaboradores/:employeeId', element: <EmployeeDetailsPage /> },
            ],
          },
          {
            element: <CapabilityRoute capability="contract.read" />,
            children: [
              {
                path: 'colaboradores/:employeeId/contratos',
                element: <EmploymentContractsPage />,
              },
              { path: 'employees/:employeeId/contracts', element: <EmploymentContractsPage /> },
              { path: 'contratos', element: <EmploymentContractsPage /> },
              { path: 'contratos/:contractId', element: <EmploymentContractDetailsPage /> },
            ],
          },
          {
            element: <CapabilityRoute capability="payroll.rubric.read" />,
            children: [{ path: 'folha/rubricas', element: <PayrollPage /> }],
          },
          {
            element: <CapabilityRoute capability="payroll.parameter.read" />,
            children: [{ path: 'folha/parametros', element: <PayrollPage /> }],
          },
          {
            element: <CapabilityRoute capability="payroll.review.view" />,
            children: [
              { path: 'folha/execucoes/:runId', element: <PayrollRunReviewPage /> },
              { path: 'folha/conferencia', element: <PayrollReviewRunsPage /> },
              { path: 'folha/conferencia/:reviewId', element: <PayrollReviewDetailPage /> },
            ],
          },
          {
            element: <CapabilityRoute capability="payroll.period.close.history" />,
            children: [
              { path: 'folha/fechamentos', element: <PayrollPage /> },
              {
                path: 'folha/competencias/:payrollPeriodId/historico',
                element: <PayrollPeriodHistoryPage />,
              },
              {
                path: 'folha/competencias/:payrollPeriodId/historico/versoes/:closureVersion',
                element: <PayrollPeriodVersionPage />,
              },
              {
                path: 'folha/competencias/:payrollPeriodId/historico/versoes/:closureVersion/eventos',
                element: <PayrollPeriodEventsPage />,
              },
              {
                path: 'folha/competencias/:payrollPeriodId/historico/versoes/:closureVersion/manifesto',
                element: <PayrollPeriodManifestPage />,
              },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(appRoutes);
