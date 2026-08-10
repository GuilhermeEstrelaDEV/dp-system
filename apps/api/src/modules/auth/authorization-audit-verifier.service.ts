import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { AUDIT_EVENT_CATALOG, type AuditEventCode } from './audit-event.catalog';

export interface AuthorizationAuditViolation {
  readonly file: string;
  readonly line: number;
  readonly reason: string;
}

export const AUTHORIZATION_AUDIT_PRODUCER_MANIFEST = Object.freeze({
  'src/modules/auth/auth.controller.ts': [
    'AUTH_LOGIN_SUCCEEDED',
    'AUTH_COMPANY_SELECTED',
    'AUTH_LOGOUT_SUCCEEDED',
  ],
  'src/modules/auth/assignment-governance.service.ts': [
    'ROLE_PERMISSION_ASSIGNED',
    'ROLE_PERMISSION_REVOKED',
    'USER_COMPANY_ROLE_ASSIGNED',
    'USER_COMPANY_ROLE_REVOKED',
  ],
  'src/modules/auth/access-grants.service.ts': [
    'ACCESS_GRANTS_VIEWED',
    'SUBSTITUTION_CREATED',
    'SUBSTITUTION_REVOKED',
    'SUBSTITUTION_EXPIRED',
    'EMERGENCY_ACCESS_GRANTED',
    'EMERGENCY_ACCESS_REVOKED',
    'EMERGENCY_ACCESS_EXPIRED',
  ],
  'src/modules/payroll-reviews/payroll-reviews.service.ts': [
    'PAYROLL_REVIEW_CYCLE_OPENED',
    'PAYROLL_REVIEW_FINDING_OPENED',
    'PAYROLL_REVIEW_STARTED',
    'PAYROLL_REVIEW_SUBMITTED',
    'PAYROLL_REVIEW_APPROVED',
    'PAYROLL_REVIEW_REJECTED',
    'PAYROLL_REVIEW_CLOSED',
    'PAYROLL_REVIEW_REOPENED',
    'PAYROLL_REVIEW_FINDING_RESOLVED',
    'PAYROLL_REVIEW_FINDING_REOPENED',
  ],
  'src/modules/payroll-periods/payroll-period-closure-persistence.service.ts': [
    'PAYROLL_PERIOD_CLOSURE_FOUNDATION_CREATED',
  ],
  'src/modules/payroll-periods/payroll-period-operational-closure.service.ts': [
    'PAYROLL_PERIOD_CLOSED',
  ],
  'src/modules/payroll-periods/payroll-period-controlled-reopening.service.ts': [
    'PAYROLL_PERIOD_REOPENED',
  ],
} satisfies Record<string, readonly AuditEventCode[]>);

export class AuthorizationAuditVerifierService {
  verify(root = process.cwd()): AuthorizationAuditViolation[] {
    const sourceRoot = resolve(root, 'src');
    const files = this.sourceFiles(sourceRoot);
    return files.flatMap((file) => this.inspectFile(root, file));
  }

  assertComplete(root = process.cwd()): void {
    const violations = this.verify(root);
    if (violations.length > 0) {
      throw new Error(
        `Authorization audit verification failed:\n${violations
          .map(({ file, line, reason }) => `${file}:${line} ${reason}`)
          .join('\n')}`,
      );
    }
    const manifested = new Set(Object.values(AUTHORIZATION_AUDIT_PRODUCER_MANIFEST).flat());
    const cataloged = new Set(Object.keys(AUDIT_EVENT_CATALOG));
    const missing = [...cataloged].filter((code) => !manifested.has(code as AuditEventCode));
    if (missing.length > 0)
      throw new Error(`Audit catalog events lack producers: ${missing.join(', ')}`);
  }

  private inspectFile(root: string, absoluteFile: string): AuthorizationAuditViolation[] {
    const file = relative(root, absoluteFile).replaceAll('\\', '/');
    const source = readFileSync(absoluteFile, 'utf8');
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const violations: AuthorizationAuditViolation[] = [];
    const eventMaps = this.eventMaps(sourceFile);
    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node)) {
        this.inspectDirectAuditWrite(node, sourceFile, file, violations);
        this.inspectAppend(node, sourceFile, file, eventMaps, violations);
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return violations;
  }

  private inspectDirectAuditWrite(
    node: ts.CallExpression,
    sourceFile: ts.SourceFile,
    file: string,
    violations: AuthorizationAuditViolation[],
  ): void {
    if (!ts.isPropertyAccessExpression(node.expression)) return;
    const operation = node.expression.name.text;
    const receiver = node.expression.expression.getText(sourceFile);
    if (!receiver.endsWith('.auditLog')) return;
    if (operation !== 'create' || !file.endsWith('audit-writer.service.ts')) {
      violations.push(
        this.violation(sourceFile, file, node, `direct AuditLog.${operation} is forbidden`),
      );
    }
  }

  private inspectAppend(
    node: ts.CallExpression,
    sourceFile: ts.SourceFile,
    file: string,
    eventMaps: ReadonlyMap<string, readonly AuditEventCode[]>,
    violations: AuthorizationAuditViolation[],
  ): void {
    if (!ts.isPropertyAccessExpression(node.expression) || node.expression.name.text !== 'append')
      return;
    const receiver = node.expression.expression.getText(sourceFile);
    if (!/(audit|writer)/iu.test(receiver)) return;
    const envelope = node.arguments[0];
    if (!envelope || !ts.isObjectLiteralExpression(envelope)) {
      violations.push(
        this.violation(sourceFile, file, node, 'audit envelope must be an object literal'),
      );
      return;
    }
    const action = envelope.properties.find(
      (property): property is ts.PropertyAssignment =>
        ts.isPropertyAssignment(property) && property.name.getText(sourceFile) === 'action',
    );
    if (!action) {
      violations.push(this.violation(sourceFile, file, node, 'audit event code is missing'));
      return;
    }
    const codes = this.resolveCodes(action.initializer, sourceFile, eventMaps);
    if (codes.length === 0) {
      violations.push(
        this.violation(sourceFile, file, action, 'audit event code is dynamic or unknown'),
      );
      return;
    }
    for (const code of codes) {
      const descriptor = AUDIT_EVENT_CATALOG[code];
      if (!descriptor) {
        violations.push(this.violation(sourceFile, file, action, `unknown audit event ${code}`));
      } else if (descriptor.atomicity === 'REQUIRED' && node.arguments.length < 2) {
        violations.push(
          this.violation(
            sourceFile,
            file,
            node,
            `${code} must receive the business transaction client`,
          ),
        );
      }
    }
    const metadata = envelope.properties.find(
      (property): property is ts.PropertyAssignment =>
        ts.isPropertyAssignment(property) && property.name.getText(sourceFile) === 'metadata',
    );
    if (metadata && !ts.isObjectLiteralExpression(metadata.initializer)) {
      violations.push(
        this.violation(sourceFile, file, metadata, 'audit metadata must be an explicit object'),
      );
    }
  }

  private resolveCodes(
    node: ts.Expression,
    sourceFile: ts.SourceFile,
    eventMaps: ReadonlyMap<string, readonly AuditEventCode[]>,
  ): AuditEventCode[] {
    if (ts.isStringLiteral(node) && node.text in AUDIT_EVENT_CATALOG) {
      return [node.text as AuditEventCode];
    }
    if (ts.isElementAccessExpression(node) && ts.isIdentifier(node.expression)) {
      return [...(eventMaps.get(node.expression.text) ?? [])];
    }
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)) {
      return [...(eventMaps.get(node.expression.text) ?? [])];
    }
    void sourceFile;
    return [];
  }

  private eventMaps(sourceFile: ts.SourceFile): Map<string, readonly AuditEventCode[]> {
    const maps = new Map<string, readonly AuditEventCode[]>();
    for (const statement of sourceFile.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
        let initializer: ts.Expression = declaration.initializer;
        while (ts.isAsExpression(initializer) || ts.isSatisfiesExpression(initializer)) {
          initializer = initializer.expression;
        }
        if (!ts.isObjectLiteralExpression(initializer)) continue;
        const codes = initializer.properties.flatMap((property) => {
          if (!ts.isPropertyAssignment(property) || !ts.isStringLiteral(property.initializer))
            return [];
          return property.initializer.text in AUDIT_EVENT_CATALOG
            ? [property.initializer.text as AuditEventCode]
            : [];
        });
        if (codes.length > 0) maps.set(declaration.name.text, codes);
      }
    }
    return maps;
  }

  private sourceFiles(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return this.sourceFiles(path);
      return entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')
        ? [path]
        : [];
    });
  }

  private violation(
    sourceFile: ts.SourceFile,
    file: string,
    node: ts.Node,
    reason: string,
  ): AuthorizationAuditViolation {
    return {
      file,
      line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
      reason,
    };
  }
}
