import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const roles = [
  ['ADMINISTRATOR', 'Administrador'],
  ['HR', 'RH'],
  ['PERSONNEL_DEPARTMENT', 'Departamento Pessoal'],
  ['FINANCE', 'Financeiro'],
  ['MANAGER', 'Gestor'],
  ['DIRECTOR', 'Diretor'],
  ['READ_ONLY', 'Somente Leitura'],
] as const;

const permissions = [
  [
    'platform.read',
    'View platform resources',
    'platform',
    'read',
    'PLATFORM',
    'MEDIUM',
    'SENSITIVE',
  ],
  [
    'platform.manage',
    'Manage platform resources',
    'platform',
    'manage',
    'PLATFORM',
    'CRITICAL',
    'RESTRICTED',
  ],
  [
    'delegation.manage',
    'Manage temporary substitutions',
    'delegation',
    'manage',
    'COMPANY',
    'CRITICAL',
    'RESTRICTED',
  ],
  [
    'emergency_access.manage',
    'Manage audited emergency access',
    'emergency_access',
    'manage',
    'COMPANY',
    'CRITICAL',
    'RESTRICTED',
  ],
  [
    'payroll.review.view',
    'View payroll review cycles and findings',
    'payroll.review',
    'view',
    'COMPANY',
    'MEDIUM',
    'RESTRICTED',
  ],
  [
    'payroll.review.create',
    'Open payroll review cycles',
    'payroll.review',
    'create',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'payroll.review.finding.create',
    'Create payroll review findings',
    'payroll.review.finding',
    'create',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'payroll.review.finding.resolve',
    'Resolve payroll review findings',
    'payroll.review.finding',
    'resolve',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'payroll.review.finding.reopen',
    'Reopen payroll review findings',
    'payroll.review.finding',
    'reopen',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'payroll.review.submit',
    'Submit payroll review cycles',
    'payroll.review',
    'submit',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'payroll.review.approve',
    'Approve configured payroll review stages',
    'payroll.review',
    'approve',
    'COMPANY',
    'CRITICAL',
    'RESTRICTED',
  ],
  [
    'payroll.review.reject',
    'Reject submitted payroll review cycles',
    'payroll.review',
    'reject',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'payroll.review.close',
    'Close approved payroll review cycles',
    'payroll.review',
    'close',
    'COMPANY',
    'CRITICAL',
    'RESTRICTED',
  ],
  [
    'payroll.review.reopen',
    'Reopen approved or closed payroll review cycles',
    'payroll.review',
    'reopen',
    'COMPANY',
    'CRITICAL',
    'RESTRICTED',
  ],
  [
    'payroll.period.close.view',
    'View payroll period closure summary',
    'payroll.period.close',
    'view',
    'COMPANY',
    'MEDIUM',
    'RESTRICTED',
  ],
  [
    'payroll.period.close.readiness',
    'Evaluate payroll period closure readiness',
    'payroll.period.close',
    'readiness',
    'COMPANY',
    'MEDIUM',
    'RESTRICTED',
  ],
  [
    'payroll.period.close.execute',
    'Execute payroll period closure',
    'payroll.period.close',
    'execute',
    'COMPANY',
    'CRITICAL',
    'RESTRICTED',
  ],
  [
    'payroll.period.close.reopen',
    'Reopen a closed payroll period',
    'payroll.period.close',
    'reopen',
    'COMPANY',
    'CRITICAL',
    'RESTRICTED',
  ],
  [
    'payroll.period.close.history',
    'View payroll period closure history',
    'payroll.period.close',
    'history',
    'COMPANY',
    'MEDIUM',
    'RESTRICTED',
  ],
  [
    'payroll.period.manage',
    'Manage payroll period lifecycle before canonical closure',
    'payroll.period',
    'manage',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'payroll.input.read',
    'View minimum operational payroll inputs',
    'payroll.input',
    'read',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'payroll.input.manage',
    'Manage operational payroll inputs without legal-rule expansion',
    'payroll.input',
    'manage',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'payroll.run.read',
    'View minimum payroll run status and permitted aggregates',
    'payroll.run',
    'read',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'payroll.run.manage',
    'Execute existing payroll run operations without engine expansion',
    'payroll.run',
    'manage',
    'COMPANY',
    'CRITICAL',
    'RESTRICTED',
  ],
  ['company.read', 'View company records', 'company', 'read', 'COMPANY', 'MEDIUM', 'SENSITIVE'],
  [
    'company.manage',
    'Manage company records',
    'company',
    'manage',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  ['employee.read', 'View employee records', 'employee', 'read', 'COMPANY', 'MEDIUM', 'SENSITIVE'],
  [
    'employee.manage',
    'Manage employee records',
    'employee',
    'manage',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'contract.read',
    'View employment contracts',
    'contract',
    'read',
    'COMPANY',
    'MEDIUM',
    'SENSITIVE',
  ],
  [
    'contract.manage',
    'Manage employment contracts',
    'contract',
    'manage',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'payroll.parameter.read',
    'View payroll parameters',
    'payroll.parameter',
    'read',
    'COMPANY',
    'MEDIUM',
    'RESTRICTED',
  ],
  [
    'payroll.parameter.manage',
    'Manage payroll parameters',
    'payroll.parameter',
    'manage',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'payroll.rubric.read',
    'View payroll rubrics',
    'payroll.rubric',
    'read',
    'COMPANY',
    'MEDIUM',
    'RESTRICTED',
  ],
  [
    'payroll.rubric.manage',
    'Manage payroll rubrics',
    'payroll.rubric',
    'manage',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'organization.read',
    'View company-local organizational resources',
    'organization',
    'read',
    'COMPANY',
    'MEDIUM',
    'SENSITIVE',
  ],
  [
    'organization.manage',
    'Manage company-local organizational resources',
    'organization',
    'manage',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'admission.read',
    'View minimum admission workflow data',
    'admission',
    'read',
    'COMPANY',
    'MEDIUM',
    'RESTRICTED',
  ],
  [
    'admission.manage',
    'Manage admission workflows and logical requirements',
    'admission',
    'manage',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  ['leave.read', 'View minimum leave records', 'leave', 'read', 'COMPANY', 'HIGH', 'RESTRICTED'],
  [
    'leave.manage',
    'Manage leave records without medical-data expansion',
    'leave',
    'manage',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'variable_compensation.read',
    'View operational variable compensation records',
    'variable_compensation',
    'read',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'variable_compensation.manage',
    'Manage modeled variable compensation records',
    'variable_compensation',
    'manage',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  ['time.read', 'View minimum time records', 'time', 'read', 'COMPANY', 'HIGH', 'RESTRICTED'],
  [
    'time.manage',
    'Manage modeled time records without legal-policy expansion',
    'time',
    'manage',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'benefit.read',
    'View minimum benefit records',
    'benefit',
    'read',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'benefit.manage',
    'Manage modeled benefit records without eligibility-policy expansion',
    'benefit',
    'manage',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'vacation.read',
    'View minimum vacation records',
    'vacation',
    'read',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'vacation.manage',
    'Manage modeled vacation records without legal-policy expansion',
    'vacation',
    'manage',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
] as const;

async function main() {
  await Promise.all(
    roles.map(([code, name]) =>
      prisma.role.upsert({
        where: { code },
        update: { name },
        create: { code, name },
      }),
    ),
  );

  const existingPermissions = await prisma.permission.findMany({
    select: {
      code: true,
      resource: true,
      action: true,
      scope: true,
      riskLevel: true,
      sensitivity: true,
    },
    orderBy: { code: 'asc' },
  });
  const approvedPermissions = new Map<
    string,
    {
      resource: string;
      action: string;
      scope: string;
      riskLevel: string;
      sensitivity: string;
    }
  >(
    permissions.map(([code, , resource, action, scope, riskLevel, sensitivity]) => [
      code,
      { resource, action, scope, riskLevel, sensitivity },
    ]),
  );
  if (existingPermissions.length > 0) {
    if (existingPermissions.length > permissions.length) {
      throw new Error('Permission seed blocked: inventory exceeds the approved catalog');
    }
    for (const existing of existingPermissions) {
      const approved = approvedPermissions.get(existing.code);
      if (
        !approved ||
        existing.resource !== approved.resource ||
        existing.action !== approved.action ||
        existing.scope !== approved.scope ||
        existing.riskLevel !== approved.riskLevel ||
        existing.sensitivity !== approved.sensitivity
      ) {
        throw new Error(`Permission seed blocked: ${existing.code} is not homologated as stored`);
      }
    }
  }

  await prisma.$transaction(
    permissions.map(([code, description, resource, action, scope, riskLevel, sensitivity]) =>
      prisma.permission.upsert({
        where: { code },
        update: {
          name: code,
          description,
          resource,
          action,
          scope,
          riskLevel,
          sensitivity,
        },
        create: {
          code,
          name: code,
          description,
          resource,
          action,
          scope,
          riskLevel,
          sensitivity,
        },
      }),
    ),
  );

  const company = await prisma.company.upsert({
    where: { taxId: '00.000.000/0001-00' },
    update: {
      legalName: 'Horizonte Serviços Empresariais Demonstrativos Ltda.',
      tradeName: 'Horizonte Demo',
      status: 'ACTIVE',
    },
    create: {
      id: '10000000-0000-4000-8000-000000000001',
      legalName: 'Horizonte Serviços Empresariais Demonstrativos Ltda.',
      tradeName: 'Horizonte Demo',
      taxId: '00.000.000/0001-00',
    },
  });

  await prisma.branch.upsert({
    where: { companyId_code: { companyId: company.id, code: 'MATRIZ-DEMO' } },
    update: { name: 'Matriz Horizonte Demonstrativa', status: 'ACTIVE' },
    create: {
      id: '30000000-0000-4000-8000-000000000001',
      companyId: company.id,
      code: 'MATRIZ-DEMO',
      name: 'Matriz Horizonte Demonstrativa',
      address: { city: 'Cidade Fictícia', state: 'DF' },
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
