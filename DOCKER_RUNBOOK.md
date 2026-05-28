# Docker Runbook - MaintenanceSystem

## Levantar stack completo

Desde PowerShell, primero ubicarse en la carpeta del proyecto:

```powershell
cd C:\proyectos\MaintenanceSystem
```

Luego levantar el stack:

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

Para salir de los logs en vivo, presionar `Ctrl + C`.

Logs solo de la API:

```bash
docker compose logs -f api
```

Logs solo del frontend:

```bash
docker compose logs -f web
```

Logs solo de PostgreSQL:

```bash
docker compose logs -f postgres
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

Desde el contenedor API:

```bash
docker compose exec api npm run db:seed -w apps/api
```

Desde Windows/PowerShell contra PostgreSQL Docker:

```powershell
$env:DATABASE_URL="postgresql://maintenance:maintenance@localhost:5433/maintenance_system?schema=public"
npm run db:seed -w apps/api
```

## Aplicar migraciones manualmente

```bash
docker compose exec api npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
```

Forma equivalente:

```bash
docker compose exec api npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
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

Probar health API:

```powershell
curl.exe http://localhost:4000/api/health
```

Login administrador en varias lineas:

```powershell
curl.exe -X POST http://localhost:4000/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"admin@maintenance.local\",\"password\":\"Admin123*\"}"
```

Login administrador en una sola linea:

```powershell
curl.exe -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@maintenance.local\",\"password\":\"Admin123*\"}"
```

Alternativa con `Invoke-RestMethod`:

```powershell
$body = @{ email = "admin@maintenance.local"; password = "Admin123*" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:4000/api/auth/login -Method Post -ContentType "application/json" -Body $body
```

Nota para PowerShell: para partir comandos en varias lineas se usa backtick `` ` ``, no barra invertida `\`.
