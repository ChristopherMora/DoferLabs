# 🐳 Guía de Deployment con Docker

## 📋 Requisitos previos

- Docker y Docker Compose instalados
- Dominio configurado: makerhub.dofer.com.mx apuntando a tu servidor
- Certificados SSL (Let's Encrypt recomendado)

## 🚀 Deployment Rápido

### 1. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.production.example .env

# Editar con tus valores
nano .env
```

**Variables importantes a configurar:**
- `POSTGRES_PASSWORD`: Contraseña segura para la base de datos
- `DATABASE_URL`: URL de conexión a PostgreSQL
- `SECRET_KEY`: Clave secreta para sesiones

### 2. Ejecutar deployment

```bash
# Opción 1: Script automático (recomendado)
./deploy.sh

# Opción 2: Manual
docker-compose up -d --build
docker-compose exec app npx prisma migrate deploy
```

### 3. Verificar servicios

```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f app

# Verificar base de datos
docker-compose exec db psql -U postgres -d makerhub
```

## 🔧 Comandos útiles

### Gestión de contenedores

```bash
# Detener servicios
docker-compose down

# Reiniciar servicios
docker-compose restart

# Reconstruir y reiniciar
docker-compose up -d --build --force-recreate

# Ver logs
docker-compose logs -f [service]
```

### Base de datos

```bash
# Ejecutar migraciones
docker-compose exec app npx prisma migrate deploy

# Resetear base de datos (CUIDADO: Borra todos los datos)
docker-compose exec app npx prisma migrate reset

# Abrir consola de PostgreSQL
docker-compose exec db psql -U postgres -d makerhub

# Backup de base de datos
docker-compose exec db pg_dump -U postgres makerhub > backup.sql

# Restaurar backup
docker-compose exec -T db psql -U postgres makerhub < backup.sql
```

### Mantenimiento

```bash
# Limpiar imágenes no usadas
docker system prune -a

# Ver uso de recursos
docker stats

# Acceder al contenedor
docker-compose exec app sh
```

## 🔐 Configurar SSL con Let's Encrypt

### Opción 1: Con Certbot (recomendado)

```bash
# Instalar certbot
sudo apt install certbot

# Obtener certificados
sudo certbot certonly --standalone \
  -d makerhub.dofer.com.mx \
  --email hola@dofer.com.mx \
  --agree-tos

# Copiar certificados al proyecto
sudo cp /etc/letsencrypt/live/makerhub.dofer.com.mx/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/makerhub.dofer.com.mx/privkey.pem ./ssl/

# Renovación automática (cron)
sudo certbot renew --quiet
```

### Opción 2: Sin SSL (desarrollo)

Comentar el servicio nginx en `docker-compose.yml` y acceder directamente al puerto 3000.

## 📊 Monitoreo

### Logs de aplicación
```bash
# Ver logs de Next.js
docker-compose logs -f app

# Ver logs de base de datos
docker-compose logs -f db

# Ver logs de nginx
docker-compose logs -f nginx
```

### Analytics

Los eventos se guardan automáticamente en PostgreSQL. Para ver estadísticas:

```sql
-- Conectarse a la base de datos
docker-compose exec db psql -U postgres -d makerhub

-- Ver eventos recientes
SELECT * FROM "Event" ORDER BY "createdAt" DESC LIMIT 10;

-- Estadísticas de herramientas más usadas
SELECT "toolId", COUNT(*) as total 
FROM "Event" 
WHERE "eventType" = 'executed' 
GROUP BY "toolId" 
ORDER BY total DESC;
```

## 🔄 Actualizar a nueva versión

```bash
# 1. Pull de cambios (si usas git)
git pull origin main

# 2. Reconstruir
docker-compose build --no-cache

# 3. Reiniciar servicios
docker-compose up -d

# 4. Ejecutar migraciones (si hay)
docker-compose exec app npx prisma migrate deploy
```

## ⚠️ Troubleshooting

### El contenedor no inicia

```bash
# Ver logs detallados
docker-compose logs app

# Verificar variables de entorno
docker-compose exec app env
```

### Error de base de datos

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps db

# Ver logs de PostgreSQL
docker-compose logs db

# Reiniciar base de datos
docker-compose restart db
```

### Error de permisos

```bash
# Cambiar permisos de archivos
sudo chown -R 1001:1001 .next
```

## 🏗️ Arquitectura

```
┌─────────────────┐
│   makerhub.     │
│  dofer.com.mx   │
└────────┬────────┘
         │ HTTPS (443)
         ▼
┌─────────────────┐
│  Nginx (Proxy)  │
│   Port 80/443   │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│   Next.js App   │
│    Port 3000    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│    Port 5432    │
└─────────────────┘
```

## 📞 Soporte

Para problemas o dudas:
- Email: hola@dofer.com.mx
- Logs: Revisar `docker-compose logs`
