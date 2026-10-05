# Stage 1: Install all dependencies needed for the build
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci


# Stage 2: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


# Stage 3: Install production dependencies only
FROM node:20-alpine AS prod-deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev


# Stage 4: Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules

EXPOSE 3001

USER node

CMD ["npm", "run", "start:prod"]
