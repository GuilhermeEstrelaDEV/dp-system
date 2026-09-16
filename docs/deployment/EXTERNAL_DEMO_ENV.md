# External demo environment matrix

No value in this document is a deployable secret. Values marked `Render input` must be entered in
the Render dashboard and must never be copied into GitHub, a commit, a PR, or a log.

## API web service

| Name                              | Secret? | Source                    | Non-secret example or rule                                                                    |
| --------------------------------- | ------- | ------------------------- | --------------------------------------------------------------------------------------------- |
| `NODE_ENV`                        | No      | Blueprint                 | `production` (Node runtime optimization only)                                                 |
| `DEPLOYMENT_ENV`                  | No      | Blueprint                 | `external-demo`                                                                               |
| `EXTERNAL_DEMO_MODE`              | No      | Blueprint                 | `true`                                                                                        |
| `EXTERNAL_DEMO_CONFIRM_DATABASE`  | No      | Blueprint                 | `dp_system_external_demo`                                                                     |
| `DEMO_ENV`                        | No      | Blueprint                 | `external-demo`                                                                               |
| `DEMO_MODE`                       | No      | Blueprint                 | `true`                                                                                        |
| `DEMO_SEED_ENABLED`               | No      | Blueprint                 | `true`                                                                                        |
| `DATABASE_URL`                    | Yes     | Render database reference | Managed private `connectionString`; no example value                                          |
| `JWT_SECRET`                      | Yes     | Render generated value    | Random 256-bit provider value                                                                 |
| `JWT_EXPIRES_IN`                  | No      | Blueprint                 | `15m`                                                                                         |
| `API_PREFIX`                      | No      | Blueprint                 | `api`                                                                                         |
| `API_VERSION`                     | No      | Blueprint                 | `1`                                                                                           |
| `SWAGGER_ENABLED`                 | No      | Blueprint                 | `false`                                                                                       |
| `CORS_ORIGINS`                    | No      | Render input              | Exact real frontend HTTPS origin; initial creation may use `https://placeholder.invalid` only |
| `TRUST_PROXY`                     | No      | Blueprint                 | `true`                                                                                        |
| `HTTP_BODY_LIMIT`                 | No      | Blueprint                 | `1mb`                                                                                         |
| `RATE_LIMIT_TTL_MS`               | No      | Blueprint                 | `60000`                                                                                       |
| `RATE_LIMIT_MAX_REQUESTS`         | No      | Blueprint                 | `100`                                                                                         |
| `LOG_LEVEL`                       | No      | Blueprint                 | `log`                                                                                         |
| `EMERGENCY_ACCESS_MAX_HOURS`      | No      | Blueprint                 | `8`                                                                                           |
| `EXTERNAL_DEMO_REVIEWER_EMAIL`    | No      | Render input              | A distinct fictitious address ending in `@dp-system.local`                                    |
| `EXTERNAL_DEMO_REVIEWER_PASSWORD` | Yes     | Render input              | Unique value of at least 16 characters, shared only through a private channel                 |
| `PORT`                            | No      | Render runtime            | Injected dynamically by Render; do not set manually                                           |

`API_PORT` and `CORS_ORIGIN` are not required externally. `CORS_ORIGINS` is the single external
allowlist source.

## Static web service

| Name             | Secret? | Source       | Non-secret example or rule                                                                                 |
| ---------------- | ------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`   | No      | Render input | Exact real API HTTPS URL ending in `/api`; initial creation may use `https://placeholder.invalid/api` only |
| `VITE_DEMO_MODE` | No      | Blueprint    | `true`                                                                                                     |
| `VITE_DEMO_ENV`  | No      | Blueprint    | `external-demo`                                                                                            |

Vite embeds its variables at build time. If the API URL changes, update `VITE_API_URL` and rebuild
the static site. A value containing `localhost`, plain HTTP, or a guessed hostname is invalid.

The placeholder values are allowed only during initial Blueprint creation, before Render assigns
the real service URLs. Replace both placeholders immediately with the real HTTPS values and
redeploy the API and static site before sharing the demo. Never use a wildcard CORS origin.

## PostgreSQL

| Property                 | Source    | Required value                                                                   |
| ------------------------ | --------- | -------------------------------------------------------------------------------- |
| Service name             | Blueprint | `dp-system-external-demo-db`                                                     |
| Database name            | Blueprint | `dp_system_external_demo`                                                        |
| PostgreSQL major version | Blueprint | `16`                                                                             |
| Public inbound access    | Blueprint | Disabled with an empty IP allowlist                                              |
| Credentials              | Render    | Provider generated and exposed only through the private `DATABASE_URL` reference |

No Redis or other data service is required.

All resources are free. Free PostgreSQL expires 30 days after creation and has no managed backup.
The dataset is fictitious and disposable; this database must never be treated as durable or
production storage.
