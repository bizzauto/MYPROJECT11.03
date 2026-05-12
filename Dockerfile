FROM node:22-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci && npx prisma generate

COPY . .
RUN npm run build

FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/api/health || exit 1

CMD npx prisma migrate deploy 2>/dev/null || true && node dist/server/index.js

RUN npm install
RUN npx prisma generate
RUN npm run build
# Install tsx for running TypeScript directly
RUN npm install -g tsx

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy || true && tsx src/server/index.ts"]

