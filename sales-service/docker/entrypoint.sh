#!/bin/sh
set -e

php-fpm -D
exec "$@"
