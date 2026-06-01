# Passgo en Railway — Guía rápida

## Pasos (15 minutos total)

### 1. Crear cuenta
- railway.app → "Login with GitHub"

### 2. Subir el proyecto
- En Railway: New Project → Deploy from GitHub repo
- O arrastrá la carpeta directamente (sin GitHub)

### 3. Agregar PostgreSQL
- En tu proyecto: + New → Database → PostgreSQL
- Railway crea la DB y agrega DATABASE_URL automáticamente

### 4. Configurar variables (backend)
Ir a: tu servicio backend → Variables → Add
```
NODE_ENV = production
JWT_SECRET = (cualquier string largo)
REFRESH_TOKEN_SECRET = (otro string largo diferente)
FRONTEND_URL = (URL que Railway te asigna al frontend)
CORS_ORIGIN = (misma URL del frontend)
```

### 5. Credenciales por defecto
- Admin: admin@passgo.app / Admin1234!
- Cambiarlo en Administración → Usuarios

## Estructura del proyecto
```
passgo-railway/
├── frontend/    → Deploy como servicio "Passgo Frontend"
├── backend/     → Deploy como servicio "Passgo API"  
└── database/    → schema.sql y seeds.sql (el backend los aplica automáticamente)
```
