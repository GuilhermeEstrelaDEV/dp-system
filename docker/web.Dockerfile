FROM node:20-bookworm-slim

WORKDIR /workspace
RUN corepack enable

COPY package.json pnpm-workspace.yaml turbo.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @dp-system/web build

EXPOSE 5173
CMD ["pnpm", "--filter", "@dp-system/web", "dev", "--host", "0.0.0.0"]
