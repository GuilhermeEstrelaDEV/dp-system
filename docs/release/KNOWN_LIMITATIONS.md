# Known Limitations

## Release Candidate blockers

### 1. Dependency advisories requiring major remediation

After compatible transitive patches, `pnpm audit --prod` still reports one high and three moderate
advisories:

- `deepmerge-ts` stack exhaustion through Prisma 6 configuration tooling; patched only in major 8;
- two React Router advisories patched in 7.18 or later;
- one React Router DOM open-redirect/XSS advisory with no patched version reported for the current
  line.

No major upgrade or forced incompatible transitive override was applied. Release Candidate
promotion requires a reviewed upgrade plan or an explicit, time-bounded security risk acceptance.
The detailed decision package is
[SECURITY_DEPENDENCY_RISK_DECISION.md](SECURITY_DEPENDENCY_RISK_DECISION.md).

The high advisory is not loaded by the current API runtime and has no HTTP input path; it is
reachable by the trusted Prisma CLI configuration loader. This lowers observed application
reachability without changing its advisory severity. Two React Router open-redirect findings have
a potentially reachable post-login return-path flow and therefore cannot be dismissed solely from
the Prisma analysis.

### 2. Visual and responsive evidence unavailable

The application, API and frontend were healthy, but no controllable browser was connected to this
execution. Static inspection and all frontend tests passed; however, desktop/notebook/tablet/mobile
screenshots and keyboard/dialog execution were not produced. Human homologation must execute the
viewport matrix in [HOMOLOGATION_VISUAL_EVIDENCE.md](HOMOLOGATION_VISUAL_EVIDENCE.md) and the
keyboard script in
[HOMOLOGATION_ACCESSIBILITY_EVIDENCE.md](HOMOLOGATION_ACCESSIBILITY_EVIDENCE.md).

## Non-blocking technical limitations

- the frontend bundle emits a known 554.64 kB chunk warning; code splitting is a future hardening
  item and was not introduced without an approved architecture change;
- the local web container uses the Vite development server and is not a production-serving design;
- success feedback is primarily represented by disabled pending actions and refreshed visible data;
  a centralized notification system does not exist;
- development logs may include diagnostic stack traces locally; client responses remain generic;
- list pagination follows the existing module contracts and was not redesigned in this hardening
  pass;
- production backup, restore, monitoring, capacity and high-availability evidence do not exist in
  this local-only initiative.

## Governance boundaries

- pending BDP, legal and business decisions remain unresolved;
- labor, payroll, benefit, time, vacation and compensation policy is not completed by this work;
- Production: `NOT AUTHORIZED`;
- Cloud: `NOT AUTHORIZED`;
- Deploy: `NOT AUTHORIZED`;
- Gate D: `NOT STARTED`;
- ETP-015.10: `NOT COMPLETED`;
- external integrations: `NOT AUTHORIZED`.

No item in this document authorizes production or represents legal compliance approval.
