#!/bin/sh
set -e

# Esperar a que la base de datos esté lista
echo "Esperando a que PostgreSQL esté listo..."
sleep 5

# Ejecutar migraciones de Prisma
echo "Ejecutando migraciones de Prisma..."
npx prisma db push --accept-data-loss || echo "Migraciones fallaron o ya están aplicadas"

# Iniciar la aplicación
echo "Iniciando servidor Next.js..."
exec node server.js
