# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Note: I completed the partial line COPY --from=build /app/di from your input
COPY nginx.conf /etc/nginx/conf.d/default.conf 
# Copia os arquivos estáticos do build
COPY --from=build /app/dist /usr/share/nginx/html