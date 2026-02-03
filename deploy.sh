#!/bin/bash

# Script para deployment en producción
echo "🚀 Iniciando deployment de MakerHub..."

# 1. Detener contenedores existentes
echo "📦 Deteniendo contenedores..."
docker-compose down

# 2. Pull de cambios (si usas git)
# git pull origin main

# 3. Construir imágenes
echo "🔨 Construyendo imágenes Docker..."
docker-compose build --no-cache

# 4. Levantar servicios
echo "🎯 Levantando servicios..."
docker-compose up -d

# 5. Esperar a que la base de datos esté lista
echo "⏳ Esperando base de datos..."
sleep 10

# 6. Ejecutar migraciones
echo "💾 Ejecutando migraciones de Prisma..."
docker-compose exec app npx prisma migrate deploy

# 7. Verificar estado
echo "✅ Verificando estado de servicios..."
docker-compose ps

echo ""
echo "✨ Deployment completado!"
echo "🌐 Sitio disponible en: https://makerhub.dofer.com.mx"
echo ""
echo "📊 Para ver logs: docker-compose logs -f app"
echo "🔍 Para verificar base de datos: docker-compose exec db psql -U postgres -d makerhub"
