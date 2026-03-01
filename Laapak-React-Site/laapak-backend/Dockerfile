FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Medusa V2 build
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 medusa

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.medusa/server ./.medusa/server
COPY --from=builder /app/medusa-config.ts ./medusa-config.ts

# Copy built admin if needed (Medusa V2 builds it into .medusa/admin)
COPY --from=builder /app/.medusa/admin ./.medusa/admin

USER medusa

EXPOSE 9000

ENV PORT=9000

CMD ["npm", "run", "start"]
