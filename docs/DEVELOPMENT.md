# Desarrollo Local

## Requisitos

- Node.js 22 o superior.
- npm.
- PostgreSQL 18 local o Docker Desktop.
- Git.

## Instalacion inicial

Desde PowerShell:

```powershell
cd C:\proyectos\MaintenanceSystem
npm install
```

## Ejecutar con PostgreSQL local

PostgreSQL local corre en `localhost:5432`.

El archivo local `apps/api/.env` no se sube a Git y debe contener:

```txt
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/maintenance_system?schema=public"
JWT_ACCESS_SECRET="local-maintenance-access-secret"
JWT_REFRESH_SECRET="local-maintenance-refresh-secret"
PORT=4000
WEB_ORIGIN=http://localhost:3000
```

Generar Prisma:

```powershell
npm run prisma:generate
```

Aplicar migraciones:

```powershell
npm run db:migrate -w apps/api
```

Ejecutar seed:

```powershell
npm run db:seed -w apps/api
```

Levantar API y Web en modo desarrollo:

```powershell
npm run dev
```

## Ejecutar con Docker

Ver `DOCKER_RUNBOOK.md` en la raiz del proyecto.

Comando principal:

```powershell
docker compose up -d --build
```

## Builds de verificacion

API:

```powershell
npm run build -w apps/api
```

Web:

```powershell
npm run build -w apps/web
```

## Archivos que no deben subirse

- `.env`
- `.env.local`
- `pws_bd.txt`
- `node_modules`
- `.next`
- `dist`
- `archivo_historico`
- `img`

