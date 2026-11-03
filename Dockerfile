# syntax=docker/dockerfile:1

# Production image of the web. It is built in GitHub Actions and published to
# GHCR: the server never compiles. The web is a static SPA, so the runtime is
# nginx serving the build (deploy/nginx.conf), which also forwards /api to the
# Orbita API container (sign-in goes straight to the auth API).

# ---- Build ----
FROM node:24-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
# Public settings are baked into the static build (see .env.example).
ARG PUBLIC_AUTH_API_URL
ARG PUBLIC_GOOGLE_CLIENT_ID
ENV PUBLIC_AUTH_API_URL=$PUBLIC_AUTH_API_URL PUBLIC_GOOGLE_CLIENT_ID=$PUBLIC_GOOGLE_CLIENT_ID
RUN pnpm build

# ---- Runtime ----
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/security-headers.inc /etc/nginx/security-headers.inc
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
