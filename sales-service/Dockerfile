FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json ./
# Packagist bloqueia laravel/framework 11.x por advisories sem patch na linha 11.
# Desativa o block do resolver só neste build didático.
RUN composer config audit.block-insecure false \
    && composer config policy.advisories.block false \
    && composer install \
        --no-dev \
        --no-scripts \
        --prefer-dist \
        --ignore-platform-reqs

FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    nginx \
    postgresql-dev \
    libzip-dev \
    icu-dev \
    linux-headers \
    $PHPIZE_DEPS \
    && docker-php-ext-install pdo pdo_pgsql pcntl \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS

WORKDIR /var/www/html

COPY --from=vendor /app/vendor ./vendor
COPY . .

RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
