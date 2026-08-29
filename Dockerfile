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

# Instalar dependências adicionais
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# Copiar apenas arquivos do Composer primeiro para cachear as dependências
COPY --chown=www-data:www-data composer.json composer.lock ./

USER www-data

# Instalar pacotes com retry/prefer-dist para evitar timeouts de rede
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-progress --no-interaction

# Copiar código-fonte da aplicação
COPY --chown=www-data:www-data . .

# Copiar assets gerados pelo Vite
COPY --chown=www-data:www-data --from=frontend /app/public/build ./public/build

# Gerar autoload otimizado
RUN composer dump-autoload --optimize --no-dev

USER root
# Remover qualquer .env para forçar Laravel a usar variáveis de ambiente do Coolify
RUN rm -f .env .env.example .env.production

USER www-data
