# External demo runbook

## Preconditions

1. Confirm `demo/external-review` exists in `GuilhermeEstrelaDEV/dp-system` and all checks pass.
2. Confirm the reviewer will use fictitious data only.
3. Confirm the operator can manage a Render Blueprint and its three isolated resources.
4. Prepare a unique reviewer password in a private password-sharing channel. Never paste it into a
   terminal command, issue, PR, CI variable, or documentation.

## Connect and create the Render Blueprint

No authorized Render session was available while this package was prepared. A human operator must:

1. connect the authorized GitHub account in Render;
2. select `GuilhermeEstrelaDEV/dp-system`;
3. select the `demo/external-review` branch;
4. create/apply the root `render.yaml` Blueprint;
5. enter the `sync: false` values listed below;
6. trigger deployment only after reviewing the generated plan.

Required inputs:

- API `CORS_ORIGINS`: use `https://placeholder.invalid` only for initial creation, then replace it
  with the exact real HTTPS origin assigned to the static site;
- web `VITE_API_URL`: use `https://placeholder.invalid/api` only for initial creation, then replace
  it with the exact real HTTPS API URL followed by `/api`;
- API `EXTERNAL_DEMO_REVIEWER_EMAIL`: a distinct fictitious `@dp-system.local` identity;
- API `EXTERNAL_DEMO_REVIEWER_PASSWORD`: a unique secret of at least 16 characters.

If service-name availability changes either hostname, use the URLs actually displayed by Render.
Do not infer or publish a URL before it exists. After changing a Vite variable, redeploy the web
service so the value is embedded in the build.

## First deployment

The Free API start command applies all existing migrations through `prisma migrate deploy` before
starting NestJS. It never runs a development migration and does not modify migration history. This
idempotent step also runs after a free instance restart.

After the first successful API deploy, Render runs this `initialDeployHook` once for that service
instance:

```text
pnpm external-demo:seed
pnpm external-demo:reviewer:provision
pnpm external-demo:access:grant
pnpm external-demo:reviewer:status
pnpm external-demo:access:status
```

Do not run these commands from a Render Shell: Free web services have no Dashboard Shell or SSH,
and one-off jobs are billable. Confirm the hook result only through the initial deploy logs. A
failure in any command fails the hook and must block sharing the demo.

The seed runs the canonical catalog/base seed and then the external dataset seed. Both are
idempotent. The external seed fails unless every external-demo gate and the exact exclusive
database name are present. It does not accept localhost and creates zero capability assignments.

The reviewer command does not print a password or hash. It fails if the fictitious two-company
baseline is absent, if the email belongs to another identity, or if a known local demo credential
is supplied.

## Verify before sharing

Record the real HTTPS frontend and API URLs privately, then verify:

1. `GET <API HTTPS URL>/api/v1/health/live` returns a successful minimal response.
2. The frontend root and direct refreshes of `/employees`, `/companies`, and `/contracts` load the
   SPA rather than a provider 404.
3. The browser sends API traffic only to the exact `VITE_API_URL` value.
4. The exact frontend origin is accepted by CORS and a different origin is rejected.
5. Reviewer login and `/auth/me` succeed without logging the token.
6. The reviewer can select only the two fictitious companies.
7. Same-company access succeeds, cross-company access returns 404, and missing capability returns 403.
8. `pnpm external-demo:access:status` reports 35 active `MANUAL` assignments with a future
   `validTo` no more than 8 hours from grant time.
9. A database query or controlled verification confirms zero non-`MANUAL` active
   `RolePermission` assignments.
10. Logs contain no password, token, Authorization header, complete CPF, phone, address, birth date,
    personal email payload, or stack trace exposed to the client.

Perform visual review at 1440×900, 1366×768, 768×1024, and 390×844. Until a controllable browser
and real URL are available, the status is `HUMAN VISUAL REVIEW REQUIRED`.

## Renew access

Grants expire after at most 8 hours. The fully free topology has no supported in-place command
channel for renewal, and a normal redeploy does not rerun `initialDeployHook`. Treat expiration as
the end of the review window. To open another window, destroy the disposable external demo and
recreate the Blueprint under the reset procedure so a new API service instance runs the hook.

Never lengthen the TTL, create a permanent grant, or move grant creation into application startup.

## Revoke and disable the reviewer

Free services have no remote shell for an immediate database-level revoke. For immediate containment,
suspend or delete the API service so no login or API request remains reachable, then destroy the
disposable database under the reset procedure. The local tools continue to preserve assignment
history when exercised in controlled local validation, but that does not create a free Render shell.

## Reset fictitious data

There is intentionally no unattended destructive reset command. For an approved reset:

1. revoke reviewer access and disable the reviewer;
2. confirm the target resource is exactly `dp-system-external-demo-db` and contains no real data;
3. capture any required non-sensitive evidence;
4. delete only that database from the Render Blueprint/dashboard;
5. recreate/sync the Blueprint;
6. recreate the Blueprint; the start command applies migrations and the new API service instance
   runs the first-deploy hook.

Never point a reset or seed command at another database.

## Stop or destroy the environment

To suspend access, revoke grants, disable the reviewer, and suspend the two Render services. To
destroy the demo, remove the static site and API service, then delete only
`dp-system-external-demo-db`. Confirm deletion in the Render dashboard. These operations do not
change `develop`, production, or any local demo volume.

## Free-plan operational limits

- The API spins down after 15 minutes without inbound traffic; allow about one minute for a cold
  first request.
- Free web services provide no Dashboard Shell or SSH.
- One-off jobs are billable and are not part of this fully free topology.
- Free PostgreSQL expires after 30 days and has no managed backups.
- The environment is disposable, contains only fictitious data, and is never production.

## Incident stop conditions

Immediately revoke access and suspend the services on any unexpected 5xx burst, authentication
bypass, cross-company data leak, secret/PII log entry, non-fictitious record, or unexplained
automatic grant. Preserve sanitized evidence and do not resume until reviewed.
