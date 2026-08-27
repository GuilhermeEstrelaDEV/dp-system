# Human Homologation Script

## Execution rules

- target: local Release Candidate only;
- use exclusively fictitious Horizon and Atlas data;
- begin with `pnpm demo:reset -- --confirm-reset`, then grant the documented temporary demo access;
- record `PASS` or `FAIL` and attach a screenshot, correlation ID or observation in every row;
- stop on unexpected 5xx, data leakage, authorization bypass or cross-company visibility;
- revoke demo access after the session.

## Journey

|   # | Journey                | Precondition                                                       | Action                                                         | Expected result                                                                      | PASS/FAIL | Evidence |
| --: | ---------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------- | -------- |
|   1 | Login                  | Local services healthy; fictitious Administrator account available | Authenticate with the documented demo account                  | Login succeeds without exposing token details                                        | `PENDING` |          |
|   2 | Select company         | Authenticated without active company                               | Select Horizonte Demo                                          | New context is loaded and Horizonte appears in the header                            | `PENDING` |          |
|   3 | Dashboard              | Horizonte active                                                   | Open the dashboard                                             | Authorized summary and activity load without foreign-company data                    | `PENDING` |          |
|   4 | Company                | `company.read/manage` temporary grant active                       | List, inspect and edit a fictitious company field              | Projection is minimal; success is visible; action respects pending state             | `PENDING` |          |
|   5 | Employee               | Horizonte active                                                   | Create a fictitious employee, edit and inspect it              | Form validation is clear; list/detail refresh; no Atlas employee appears             | `PENDING` |          |
|   6 | Contract               | Fictitious employee and organization records available             | Create or edit a contract                                      | Related entities belong to Horizonte and the history updates                         | `PENDING` |          |
|   7 | Organization           | Horizonte active                                                   | Browse and edit branch, department, position and cost center   | Shared table layout remains readable and actions are capability-aware                | `PENDING` |          |
|   8 | Admission              | Eligible fictitious contract available                             | Create an admission, checklist and document action             | State changes are understandable and invalid transitions are rejected                | `PENDING` |          |
|   9 | Parameters and rubrics | Horizonte active                                                   | Create/edit a parameter and rubric using non-legal demo values | Validity conflicts show a recoverable error and preserve form values                 | `PENDING` |          |
|  10 | Time                   | Fictitious contract available                                      | Create schedule/time entry and inspect balance                 | Entries remain company-scoped and duplicate submit is prevented                      | `PENDING` |          |
|  11 | Benefits               | Fictitious contract available                                      | Create benefit/plan/enrollment and change enrollment           | Status and errors are visible without sensitive overexposure                         | `PENDING` |          |
|  12 | Vacation               | Eligible contract available                                        | Create period/request and execute an allowed action            | Buttons reflect capability and pending state; status is not color-only               | `PENDING` |          |
|  13 | Variable compensation  | Horizonte active                                                   | Create a fictitious event and inspect the list                 | No formula or legal policy is inferred; projection remains restricted                | `PENDING` |          |
|  14 | Payroll input          | Open fictitious period available                                   | Create and edit an input                                       | Related IDs are validated inside Horizonte and errors are actionable                 | `PENDING` |          |
|  15 | Payroll run            | Valid period/input available                                       | Start a run and inspect messages                               | Run is created once and technical status is understandable                           | `PENDING` |          |
|  16 | Payroll review         | Completed run available                                            | Start review, manage a finding and submit                      | Invalid transitions and blocking findings are explained                              | `PENDING` |          |
|  17 | Readiness              | Approved review fixture available                                  | Open closure readiness                                         | `isReady` and each blocker/remediation are readable                                  | `PENDING` |          |
|  18 | Close                  | Readiness is true                                                  | Close the period and repeat the same request                   | One version is created; replay returns the same evidence                             | `PENDING` |          |
|  19 | History                | Closed period exists                                               | Open public history/timeline                                   | Append-only version, manifest and timestamps are coherent                            | `PENDING` |          |
|  20 | Reopen                 | Closed period exists                                               | Reopen with a clear fictitious reason and replay               | Successor OPEN version is created once; previous evidence is preserved               | `PENDING` |          |
|  21 | Company switch         | Horizonte detail/list is open                                      | Switch to Atlas and revisit the previous route                 | Cache is cleared; foreign detail is unavailable; Atlas lists contain only Atlas data | `PENDING` |          |
|  22 | Negative permission    | Fictitious HR account has no temporary grants                      | Login as HR and attempt a protected read/write                 | UI hides unauthorized actions and direct request returns 403                         | `PENDING` |          |

## Responsive and accessibility evidence

Repeat representative dashboard, list, long table, form and dialog journeys at approximately:

- large desktop: 1440 × 900;
- notebook: 1366 × 768;
- tablet: 768 × 1024;
- mobile sanity: 390 × 844.

For each size, record keyboard focus, visible labels, error association, action spacing, horizontal
table overflow and absence of critical hidden controls. This visual evidence remains mandatory
before the checklist can be promoted to ready.

## Exit

1. Record every result and evidence reference.
2. Confirm zero unexpected 5xx and zero cross-company disclosure.
3. Run `pnpm demo:access:revoke` and confirm zero active demonstration grants.
4. Do not authorize production, cloud, deployment, Gate D or ETP-015.10 from this script.
