# ===== Build =====
FROM node:22-slim AS build
WORKDIR /app

# Evita chamadas de rede do Prisma (checagem de versão/telemetria) que podem travar
# o `prisma generate`/`migrate` em redes restritas.
ENV CHECKPOINT_DISABLE=1
ENV PRISMA_HIDE_UPDATE_MESSAGE=1

# openssl é exigido pelo Prisma Engine
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ===== Runtime =====
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV CHECKPOINT_DISABLE=1
ENV PRISMA_HIDE_UPDATE_MESSAGE=1

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 3333

# Aplica migrations, popula dados de demonstração e sobe a API
# (o seed é idempotente; falha nele não impede a API de subir)
CMD ["sh", "-c", "npx prisma migrate deploy && (node prisma/seed.mjs || true) && node dist/index.js"]
