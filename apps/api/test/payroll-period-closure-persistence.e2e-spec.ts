import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.PAYROLL_CLOSURE_TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

describeDatabase('payroll period closure persistence on PostgreSQL', () => {
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  const ids = {
    company: '10000000-0000-4000-8000-000000000001',
    otherCompany: '10000000-0000-4000-8000-000000000002',
    user: '20000000-0000-4000-8000-000000000001',
    calendar: '30000000-0000-4000-8000-000000000001',
    otherCalendar: '30000000-0000-4000-8000-000000000002',
    period: '40000000-0000-4000-8000-000000000001',
    otherPeriod: '40000000-0000-4000-8000-000000000002',
    run: '50000000-0000-4000-8000-000000000001',
    review: '60000000-0000-4000-8000-000000000001',
    closure: '70000000-0000-4000-8000-000000000001',
    manifest: '80000000-0000-4000-8000-000000000001',
    event: '90000000-0000-4000-8000-000000000001',
    warning: 'a0000000-0000-4000-8000-000000000001',
  } as const;

  beforeAll(async () => {
    await prisma.$connect();
    const setupStatements = [
      `INSERT INTO "companies" ("id", "legal_name", "trade_name", "tax_id", "status", "created_at", "updated_at") VALUES
      ('${ids.company}', 'Company One', 'One', '100000000001', 'ACTIVE', now(), now()),
      ('${ids.otherCompany}', 'Company Two', 'Two', '100000000002', 'ACTIVE', now(), now())`,
      `INSERT INTO "users" ("id", "email", "display_name", "status", "mfa_enabled", "created_at", "updated_at")
      VALUES ('${ids.user}', 'closure-test@example.test', 'Closure Test', 'ACTIVE', false, now(), now())`,
      `INSERT INTO "payroll_calendars" ("id", "company_id", "name", "status", "created_at", "updated_at") VALUES
      ('${ids.calendar}', '${ids.company}', 'Calendar One', 'ACTIVE', now(), now()),
      ('${ids.otherCalendar}', '${ids.otherCompany}', 'Calendar Two', 'ACTIVE', now(), now())`,
      `INSERT INTO "payroll_periods" ("id", "company_id", "payroll_calendar_id", "reference_date", "type", "status", "engine_version", "opened_at", "created_at", "updated_at") VALUES
      ('${ids.period}', '${ids.company}', '${ids.calendar}', '2026-07-01', 'REGULAR', 'OPEN', 'foundation-1', now(), now(), now()),
      ('${ids.otherPeriod}', '${ids.otherCompany}', '${ids.otherCalendar}', '2026-07-01', 'REGULAR', 'OPEN', 'foundation-1', now(), now(), now())`,
      `INSERT INTO "payroll_runs" ("id", "payroll_period_id", "sequence", "status", "engine_version", "created_at")
      VALUES ('${ids.run}', '${ids.period}', 1, 'COMPLETED', 'foundation-1', now())`,
      `INSERT INTO "payroll_review_cycles" ("id", "company_id", "payroll_run_id", "status", "created_by", "trace_id", "created_at", "submission_number", "current_approval_stage", "review_round")
      VALUES ('${ids.review}', '${ids.company}', '${ids.run}', 'CLOSED', '${ids.user}', 'trace-seed', now(), 1, 2, 1)`,
    ];
    for (const statement of setupStatements) await prisma.$executeRawUnsafe(statement);
  });

  afterAll(async () => prisma.$disconnect());

  it('enforces company scope, version uniqueness and one active version', async () => {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "payroll_period_closure_versions"
      ("id", "company_id", "payroll_period_id", "version", "status", "selected_payroll_run_id", "linked_review_cycle_id", "linked_review_round", "consistency_token", "optimistic_version", "created_by", "created_at", "updated_at")
      VALUES ('${ids.closure}', '${ids.company}', '${ids.period}', 1, 'OPEN', '${ids.run}', '${ids.review}', 1, 'token-1', 1, '${ids.user}', now(), now())
    `);

    await expect(
      prisma.$executeRawUnsafe(`
        INSERT INTO "payroll_period_closure_versions"
        ("id", "company_id", "payroll_period_id", "version", "status", "consistency_token", "created_by", "created_at", "updated_at")
        VALUES ('70000000-0000-4000-8000-000000000002', '${ids.company}', '${ids.period}', 2, 'OPEN', 'token-2', '${ids.user}', now(), now())
      `),
    ).rejects.toThrow();

    await expect(
      prisma.$executeRawUnsafe(`
        INSERT INTO "payroll_period_closure_versions"
        ("id", "company_id", "payroll_period_id", "version", "status", "consistency_token", "created_by", "created_at", "updated_at")
        VALUES ('70000000-0000-4000-8000-000000000003', '${ids.otherCompany}', '${ids.period}', 3, 'OPEN', 'token-3', '${ids.user}', now(), now())
      `),
    ).rejects.toThrow('payroll period closure company mismatch');
  });

  it.each([
    ['payroll_period_closure_manifests', ids.manifest],
    ['payroll_period_closure_events', ids.event],
    ['payroll_period_closure_warning_acknowledgements', ids.warning],
  ])('prevents UPDATE and DELETE on append-only table %s', async (table, id) => {
    if (table === 'payroll_period_closure_manifests') {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "${table}" ("id", "company_id", "payroll_period_closure_id", "manifest_version", "payload", "payload_hash", "hash_algorithm_version", "created_by", "trace_id") VALUES ('${id}', '${ids.company}', '${ids.closure}', 1, '{}', '${'a'.repeat(64)}', 'sha256-canonical-json-v1', '${ids.user}', 'trace-1')`,
      );
    } else if (table === 'payroll_period_closure_events') {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "${table}" ("id", "company_id", "payroll_period_closure_id", "event_type", "payload", "actor_user_id", "trace_id") VALUES ('${id}', '${ids.company}', '${ids.closure}', 'PERIOD_READINESS_EVALUATED', '{}', '${ids.user}', 'trace-1')`,
      );
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "${table}" ("id", "company_id", "payroll_period_closure_id", "warning_code", "acknowledgement_payload", "acknowledged_by", "trace_id") VALUES ('${id}', '${ids.company}', '${ids.closure}', 'VARIABLE_PAY_PENDING', '{}', '${ids.user}', 'trace-1')`,
      );
    }
    await expect(
      prisma.$executeRawUnsafe(
        `UPDATE "${table}" SET "company_id" = "company_id" WHERE "id" = '${id}'`,
      ),
    ).rejects.toThrow('append-only');
    await expect(
      prisma.$executeRawUnsafe(`DELETE FROM "${table}" WHERE "id" = '${id}'`),
    ).rejects.toThrow('append-only');
  });

  it('rejects evidence and idempotency records with a mismatched company', async () => {
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "payroll_period_closure_events" ("id", "company_id", "payroll_period_closure_id", "event_type", "payload", "actor_user_id", "trace_id") VALUES ('90000000-0000-4000-8000-000000000009', '${ids.otherCompany}', '${ids.closure}', 'PERIOD_READINESS_EVALUATED', '{}', '${ids.user}', 'trace-mismatch')`,
      ),
    ).rejects.toThrow('evidence company mismatch');
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "payroll_period_closure_idempotencies" ("id", "company_id", "payroll_period_id", "operation_type", "idempotency_key_hash", "request_fingerprint") VALUES ('b0000000-0000-4000-8000-000000000009', '${ids.otherCompany}', '${ids.period}', 'CLOSE', '${'d'.repeat(64)}', '${'e'.repeat(64)}')`,
      ),
    ).rejects.toThrow('idempotency company mismatch');
  });

  it('scopes idempotency and makes completed records immutable', async () => {
    const keyHash = 'b'.repeat(64);
    const fingerprint = 'c'.repeat(64);
    await prisma.$executeRawUnsafe(
      `INSERT INTO "payroll_period_closure_idempotencies" ("id", "company_id", "payroll_period_id", "operation_type", "idempotency_key_hash", "request_fingerprint") VALUES ('b0000000-0000-4000-8000-000000000001', '${ids.company}', '${ids.period}', 'CLOSE', '${keyHash}', '${fingerprint}')`,
    );
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "payroll_period_closure_idempotencies" ("id", "company_id", "payroll_period_id", "operation_type", "idempotency_key_hash", "request_fingerprint") VALUES ('b0000000-0000-4000-8000-000000000002', '${ids.company}', '${ids.period}', 'CLOSE', '${keyHash}', '${fingerprint}')`,
      ),
    ).rejects.toThrow();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "payroll_period_closure_idempotencies" ("id", "company_id", "payroll_period_id", "operation_type", "idempotency_key_hash", "request_fingerprint") VALUES ('b0000000-0000-4000-8000-000000000003', '${ids.company}', '${ids.period}', 'REOPEN', '${keyHash}', '${fingerprint}')`,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "payroll_period_closure_idempotencies" ("id", "company_id", "payroll_period_id", "operation_type", "idempotency_key_hash", "request_fingerprint") VALUES ('b0000000-0000-4000-8000-000000000004', '${ids.otherCompany}', '${ids.otherPeriod}', 'CLOSE', '${keyHash}', '${fingerprint}')`,
    );
    await prisma.$executeRawUnsafe(
      `UPDATE "payroll_period_closure_idempotencies" SET "status" = 'COMPLETED', "response_reference" = '${ids.closure}', "completed_at" = now() WHERE "id" = 'b0000000-0000-4000-8000-000000000001'`,
    );
    await expect(
      prisma.$executeRawUnsafe(
        `UPDATE "payroll_period_closure_idempotencies" SET "response_reference" = 'changed' WHERE "id" = 'b0000000-0000-4000-8000-000000000001'`,
      ),
    ).rejects.toThrow('immutable');
    await expect(
      prisma.$executeRawUnsafe(
        `DELETE FROM "payroll_period_closure_idempotencies" WHERE "id" = 'b0000000-0000-4000-8000-000000000001'`,
      ),
    ).rejects.toThrow('cannot be deleted');
  });

  it('rolls back an event when the audit write in the same transaction fails', async () => {
    const before = await prisma.payrollPeriodClosureEvent.count();
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.payrollPeriodClosureEvent.create({
          data: {
            companyId: ids.company,
            payrollPeriodClosureId: ids.closure,
            eventType: 'PERIOD_CLOSURE_STARTED',
            payload: {},
            actorUserId: ids.user,
            traceId: 'trace-rollback',
          },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: ids.user,
            companyId: ids.company,
            entityType: 'PayrollPeriodClosureVersion',
            entityId: ids.closure,
            action: 'X'.repeat(51),
            traceId: 'trace-rollback',
          },
        });
      }),
    ).rejects.toThrow();
    await expect(prisma.payrollPeriodClosureEvent.count()).resolves.toBe(before);
  });
});
