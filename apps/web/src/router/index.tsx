import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { App } from '@/app/App';
import { DashboardPage } from '@/pages/DashboardPage';
import { ModulePlaceholderPage } from '@/pages/ModulePlaceholderPage';
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
import { VacationsLeavesPage } from '@/features/vacations-leaves';
import { PayrollPage } from '@/features/payroll';

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'administracao', element: <ModulePlaceholderPage /> },
      { path: 'estrutura', element: <CompaniesPage /> },
      { path: 'estrutura/empresas', element: <CompaniesPage /> },
      { path: 'estrutura/filiais', element: <BranchesPage /> },
      { path: 'estrutura/departamentos', element: <DepartmentsPage /> },
      { path: 'estrutura/cargos', element: <PositionsPage /> },
      { path: 'estrutura/centros-de-custo', element: <CostCentersPage /> },
      { path: 'colaboradores', element: <EmployeesPage /> },
      { path: 'colaboradores/:employeeId', element: <EmployeeDetailsPage /> },
      { path: 'colaboradores/:employeeId/contratos', element: <EmploymentContractsPage /> },
      { path: 'employees/:employeeId/contracts', element: <EmploymentContractsPage /> },
      { path: 'contratos', element: <EmploymentContractsPage /> },
      { path: 'contratos/:contractId', element: <EmploymentContractDetailsPage /> },
      { path: 'admissoes', element: <AdmissionsPage /> },
      { path: 'admissoes/nova', element: <AdmissionFormPage /> },
      { path: 'admissoes/:admissionId', element: <AdmissionDetailsPage /> },
      { path: 'admissoes/:admissionId/editar', element: <AdmissionFormPage /> },
      { path: 'admissoes/:admissionId/checklist', element: <AdmissionChecklistPage /> },
      { path: 'admissoes/:admissionId/documentos', element: <AdmissionDocumentsPage /> },
      { path: 'configuracoes/checklists', element: <ChecklistTemplatesPage /> },
      { path: 'movimentacoes', element: <VacationsLeavesPage /> },
      { path: 'jornada', element: <TimeManagementPage /> },
      { path: 'beneficios', element: <BenefitsPage /> },
      { path: 'folha', element: <PayrollPage /> },
      { path: 'folha/competencias', element: <PayrollPage /> },
      { path: 'folha/rubricas', element: <PayrollPage /> },
      { path: 'folha/parametros', element: <PayrollPage /> },
      { path: 'folha/lancamentos', element: <PayrollPage /> },
      { path: 'folha/execucoes', element: <PayrollPage /> },
      { path: 'folha/fechamentos', element: <PayrollPage /> },
      { path: 'folha/remuneracao-variavel', element: <PayrollPage /> },
      { path: 'desligamentos', element: <ModulePlaceholderPage /> },
      { path: 'documentos', element: <ModulePlaceholderPage /> },
      { path: 'relatorios', element: <ModulePlaceholderPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(appRoutes);
