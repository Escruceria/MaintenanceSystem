# Docker Runbook - MaintenanceSystem

## Levantar stack completo

```bash
docker compose up -d --build
```

## Ver estado de servicios

```bash
docker compose ps
```

## Ver logs

```bash
docker compose logs -f
```

Logs solo de la API:

```bash
docker logs -f maintenance-api
```

Logs solo del frontend:

```bash
docker logs -f maintenance-web
```

Logs solo de PostgreSQL:

```bash
docker logs -f maintenance-postgres
```

## URLs locales

- Frontend: `http://localhost:3000`
- API: `http://localhost:4000`
- Swagger: `http://localhost:4000/docs`
- Health check: `http://localhost:4000/api/health`
- PostgreSQL Docker: `localhost:5433`

PostgreSQL del contenedor usa el puerto `5433` en Windows para no chocar con PostgreSQL local, que usa `5432`.

## Credenciales de desarrollo

Usuario administrador:

```txt
Email: admin@maintenance.local
Password: Admin123*
```

Base de datos Docker:

```txt
Host: localhost
Port: 5433
Database: maintenance_system
User: maintenance
Password: maintenance
```

## Ejecutar seed inicial

```bash
$env:DATABASE_URL="postgresql://maintenance:maintenance@localhost:5433/maintenance_system?schema=public"
npm run db:seed -w apps/api
```

## Aplicar migraciones manualmente

```bash
docker compose exec api npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
```

## Detener stack

```bash
docker compose down
```

## Detener y borrar volumen de base de datos

Advertencia: esto borra los datos de PostgreSQL del contenedor.

```bash
docker compose down -v
```

## Reconstruir solo API

```bash
docker compose up -d --build api
```

## Reconstruir solo frontend

```bash
docker compose up -d --build web
```

## Probar login desde PowerShell

```powershell
$body = @{ email = "admin@maintenance.local"; password = "Admin123*" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:4000/api/auth/login -Method Post -ContentType "application/json" -Body $body
```

