

FROM node:18-alpine AS base

ARG NEXT_TELEMETRY_DISABLED
ENV NEXT_TELEMETRY_DISABLED=${NEXT_TELEMETRY_DISABLED:-1}

ARG NEXT_PUBLIC_DEBUG
ENV NEXT_PUBLIC_DEBUG=${NEXT_PUBLIC_DEBUG:-false}

ARG NEXT_PUBLIC_REPORT_ISSUE_URL
ENV NEXT_PUBLIC_REPORT_ISSUE_URL=${NEXT_PUBLIC_REPORT_ISSUE_URL:-"https://forms.office.com/Pages/ResponsePage.aspx?id=7aW1GIYd00GUoLwn2uMqsn9SKTgKSYtCg4t0B9x4uyJURE5HSkFCTkZHUEQyWkxJVElMODdFQ09HUCQlQCN0PWcu&r5a19e9d47d9f4ac497fb974c192da4b3=%22Fertiscan%22"}

ARG BACKEND_URL
ENV BACKEND_URL=${BACKEND_URL:-"http://localhost:5000"}

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN npm ci


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 fertiscangroup
RUN adduser --system --uid 1001 fertiscanuser

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=fertiscanuser:fertiscangroup /app/.next/standalone ./
COPY --from=builder --chown=fertiscanuser:fertiscangroup /app/.next/static ./.next/static

USER fertiscanuser

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
