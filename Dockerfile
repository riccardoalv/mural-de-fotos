# Escolhe a versão Alpine do Node.js para imagens menores
FROM node:20-alpine AS deps
WORKDIR /app

# Copia somente manifestos para instalar dependências de forma cacheável
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Build da aplicação Next.js
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN yarn build

# Imagem final “runner” só com o necessário para rodar em produção
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copia artefatos gerados pelo build
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Comando padrão para iniciar o servidor Next.js
CMD ["yarn", "start"]

