#!/bin/sh
set -e

# O bind mount do código-fonte pode esconder o vendor da imagem.
# Garante as dependências antes de subir o PHP-FPM/nginx ou o artisan.
if [ ! -f /var/www/html/vendor/autoload.php ]; then
  echo "vendor/ ausente — instalando dependências Composer..."
  composer config audit.block-insecure false
  composer config policy.advisories.block false
  composer install --no-dev --no-scripts --prefer-dist --ignore-platform-reqs
fi

# Worker não precisa de php-fpm/nginx
case "$1" in
  php|composer)
    exec "$@"
    ;;
esac

php-fpm -D
exec "$@"
