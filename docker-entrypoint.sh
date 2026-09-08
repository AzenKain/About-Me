#!/bin/sh
set -e


mkdir -p /app/data
chown -R nextjs:bun /app/data
chmod -R 775 /app/data

exec su-exec nextjs "$@"
