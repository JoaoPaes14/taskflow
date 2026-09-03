# Estagio 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Copiar arquivos de configuracao
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm ci

# Copiar codigo fonte
COPY . .

# Build de producao
RUN npm run build

# Estagio 2: Runtime (servir o build com nginx)
FROM nginx:1.27-alpine

# Copiar build do Angular
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Copiar configuracao do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
