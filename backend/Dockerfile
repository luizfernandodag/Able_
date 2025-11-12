FROM node:20-alpine AS builder
# FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
# Remove RUN npm ci --production from final stage, it's not needed if you copy node_modules or just run the app
COPY package*.json ./
# RUN npm ci --only=production # Install only production dependencies for the final stage
RUN npm ci --only=production --legacy-peer-deps 

COPY --from=builder /app/dist ./dist
# Copy env in case you want it available in container (but prefer env_file in compose)
COPY .env ./
# Persisted sqlite path: /app/data/hourly.sqlite (compose maps ./backend/data -> /app/data)
VOLUME ["/app/data"]
EXPOSE 3001 4000
CMD ["node", "dist/main.js"]