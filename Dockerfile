# ==========================================
# 1. Build Frontend Assets (Vite)
# ==========================================
FROM node:18-alpine AS frontend
WORKDIR /app

# Copiar arquivos de dependência e instalar
COPY package.json package-lock.json ./
RUN npm install

# Copiar resto do código frontend
COPY . .

# Compilar ativos do Vite
RUN npm run build


# ==========================================
# 2. Build PHP e Servir (Production)
# ==========================================
FROM serversideup/php:8.2-fpm-nginx
EXPOSE 8080
WORKDIR /var/www/html

USER root

# Instalar dependências adicionais se necessário (ex: postgres)
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# Copiar código-fonte da aplicação
COPY --chown=www-data:www-data . .

# Copiar assets gerados pelo Vite no stage anterior (Isso corrige o erro do mix-manifest)
COPY --chown=www-data:www-data --from=frontend /app/public/build ./public/build

USER www-data

# Instalar dependências PHP e otimizar
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts
