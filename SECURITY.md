# 🔒 Guía de Seguridad - MakerHUB by Dofer

## ✅ Protecciones Implementadas

### 1. Rate Limiting
- **APIs públicas**: 100 requests / 15 minutos
- **Suscripciones**: 5 intentos / 15 minutos
- **Analytics**: 200 eventos / 15 minutos
- **Subida de archivos**: 10 archivos / hora

### 2. Headers de Seguridad
- ✅ **Content-Security-Policy (CSP)**: Previene XSS
- ✅ **X-Frame-Options**: Previene clickjacking
- ✅ **X-Content-Type-Options**: Previene MIME sniffing
- ✅ **Referrer-Policy**: Controla información en referrer
- ✅ **Permissions-Policy**: Controla features del navegador
- ✅ **HSTS** (producción): Fuerza HTTPS

### 3. Validación de Archivos
- **Tamaño máximo**:
  - GCODE/3MF: 50 MB
  - STL: 100 MB
  - Imágenes: 5 MB
  - Logos: 2 MB
- **Extensiones permitidas**: `.gcode`, `.3mf`, `.stl`, `.jpg`, `.png`, `.webp`
- **Validación de MIME types**
- **Prevención de path traversal**
- **Sanitización de nombres de archivo**

### 4. CSRF Protection
- Validación de origen en peticiones mutantes
- Headers personalizados para APIs
- Comparación timing-safe de tokens

### 5. Protección de Base de Datos
- ✅ Prisma ORM (previene SQL injection)
- ✅ IPs hasheadas (no reversibles)
- ✅ Sessions anónimas
- ✅ Sin PII innecesaria

### 6. Sanitización de Inputs
- ✅ DOMPurify para prevenir XSS
- ✅ Zod para validación de esquemas
- ✅ Validación de emails y números

### 7. Protección contra Bots
- Detección de user-agents sospechosos
- Bloqueo en producción de scrapers y bots

---

## ⚠️ Checklist Pre-Producción

### Antes de Lanzar:

- [ ] **Configurar DATABASE_URL** en variables de entorno de producción
- [ ] **Activar HTTPS** (obligatorio - Let's Encrypt o Cloudflare)
- [ ] **Configurar dominio permitido** en `middleware.ts` (línea 51)
- [ ] **Agregar NEXTAUTH_SECRET** si usas autenticación
- [ ] **Revisar CSP** y ajustar según necesites
- [ ] **Configurar monitoreo** (Sentry, LogRocket, etc.)
- [ ] **Backup de base de datos** configurado
- [ ] **Configurar Redis** para rate limiting en producción (opcional pero recomendado)
- [ ] **SSL/TLS Certificate** válido
- [ ] **Firewall** configurado (Cloudflare WAF, AWS WAF, etc.)

### Variables de Entorno Requeridas:

```env
# Base de datos
DATABASE_URL="postgresql://..."

# App
NEXT_PUBLIC_APP_URL="https://tu-dominio.com"
NODE_ENV="production"

# Autenticación (si se implementa)
NEXTAUTH_SECRET="genera-un-secret-muy-seguro-aqui"
NEXTAUTH_URL="https://tu-dominio.com"
```

---

## 🚨 Vulnerabilidades Potenciales Restantes

### Nivel Medio:
1. **Rate limiting en memoria**: En producción con múltiples instancias, usar Redis/Upstash
2. **Sin logging de seguridad**: Implementar logs de intentos fallidos
3. **Sin monitoreo de anomalías**: Considerar Sentry o similar

### Nivel Bajo:
1. **Sin 2FA**: No crítico para una app pública sin autenticación
2. **Sin honeypots**: Protección adicional contra bots
3. **Sin CDN con WAF**: Cloudflare Pro ofrece protección adicional

---

## 📋 Mejores Prácticas

### Código Seguro:
```typescript
// ❌ MAL - Vulnerabile a XSS
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ BIEN - React escapa automáticamente
<div>{userInput}</div>

// ✅ BIEN - Con sanitización
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(userInput) }} />
```

### Validación de Inputs:
```typescript
// ✅ Siempre validar en el backend
const schema = z.object({
  email: z.string().email(),
  contact: z.string().min(3).max(100),
})

const validated = schema.parse(input)
```

### Rate Limiting:
```typescript
// ✅ Implementado en todos los endpoints críticos
const rateLimitResult = checkRateLimit(request, RATE_LIMITS.api)
if (!rateLimitResult.allowed) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
}
```

---

## 🔍 Monitoreo de Seguridad

### Logs a Revisar:
- Intentos de rate limit excedidos
- Validaciones de archivo fallidas
- Errores de CSRF
- User agents sospechosos bloqueados

### Métricas Importantes:
- Tasa de errores 4xx/5xx
- Tiempo de respuesta de APIs
- Intentos de suscripción fallidos
- Archivos subidos rechazados

---

## 🆘 Respuesta a Incidentes

### En caso de ataque:

1. **Rate Limiting Excedido**:
   - Revisar logs para identificar IP
   - Considerar blacklist temporal
   - Ajustar límites si es necesario

2. **Validación de Archivos Fallando**:
   - Revisar errores específicos
   - Puede ser ataque o user legítimo
   - Ajustar límites si muchos falsos positivos

3. **CSRF Detectado**:
   - Bloquear IP origen
   - Revisar logs de acceso
   - Considerar denuncia si es grave

---

## 📞 Contacto de Seguridad

Si encuentras una vulnerabilidad, por favor reporta a:
- Email: security@makerhub.com (cambiar por tu email)
- No publicar vulnerabilidades públicamente

---

## 🔄 Actualizaciones

- **Última revisión**: Enero 2026
- **Próxima auditoría**: Cada 3 meses o antes de cambios mayores
- **Dependencias**: Actualizar mensualmente

---

## 📚 Recursos Adicionales

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/security)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
