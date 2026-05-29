# MANUAL DE EJECUCIÓN DE DOCKER

# MaintenanceSystem

Plataforma moderna de gestion de mantenimiento construida con NestJS, Next.js, PostgreSQL, Prisma y Docker.

## Estado actual

- Backend NestJS con modulos base.
- Frontend Next.js con dashboard inicial.
- PostgreSQL local y PostgreSQL Docker soportados.
- Prisma con migraciones versionadas.
- Autenticacion JWT con refresh token.
- Usuario administrador inicial.
- Docker Compose funcional.
- Repositorio remoto configurado en GitHub.

## Arquitectura

- `apps/api`: backend NestJS con API REST, Prisma, autenticacion y modulos del dominio.
- `apps/web`: frontend Next.js con TypeScript.
- `packages`: espacio reservado para librerias compartidas.
- `docker-compose.yml`: PostgreSQL y servicios de desarrollo.

## Documentacion

- [Docker Runbook](<DOCKER%20_RUNBOOK-(MANUAL%20DE%20EJECUCIÓN%20DE%20DOCKER).md>)
- [Arquitectura](<docs/ARCHITECTURE-(ARQUITECTURA).md>)
- [Modelo de dominio](<docs/DOMAIN_MODEL-(MODELO%20DE%20DOMINIO).md>)
- [Plan de implementacion](<docs/IMPLEMENTATION_PLAN-(PLAN%20DE%20IMPLEMENTACIÓN).md>)
- [Desarrollo local](<docs/DEVELOPMENT-(DESARROLLO).md>)
- [API](<docs/API-(Interfaz%20de%20Programación%20de%20Aplicaciones).md>)
- [Autenticacion y usuarios](<docs/AUTHENTICATION-(AUTENTICACIÓN).md>)
- [Roles y permisos](<docs/PERMISSIONS-(PERMISOS).md>)
- [Base de datos](<docs/DATABASE-(BASE%20DE%20DATOS).md>)
- [Seguridad](<docs/SECURITY-(SEGURIDAD).md>)
- [Flujo Git](<docs/GIT_WORKFLOW-(FLUJO%20DE%20TRABAJO%20DE%20GIT).md>)
- [Roadmap](<docs/ROADMAP-(MAPA%20DE%20RUTA).md>)

## Ejecucion rapida con Docker

```bash
docker compose up -d --build
```

Servicios:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- Swagger: `http://localhost:4000/docs`
- Health: `http://localhost:4000/api/health`
- PostgreSQL Docker: `localhost:5433`

## Base de datos

El proyecto puede usar:

- PostgreSQL local en `localhost:5432`
- PostgreSQL Docker en `localhost:5433`

La base inicial es `maintenance_system` y las migraciones viven en `apps/api/prisma/migrations`.

## Primeros comandos sin Docker

```bash
npm install
npm run prisma:generate
npm run db:migrate -- --name nombre_de_la_migracion
npm run dev
```

## Modulos iniciales

- Auth y usuarios
- Roles y permisos
- Activos/equipos
- Ubicaciones
- Ordenes de trabajo
- Planes preventivos
- Solicitudes de servicio
- Repuestos e inventario
- Proveedores
- Reportes
- Auditoria

## Autenticacion inicial

Usuario administrador de desarrollo:

- Email: `admin@maintenance.local`
- Password: `Admin123*`

Endpoints principales:

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Las rutas operativas quedan protegidas con `Authorization: Bearer <accessToken>`.
En produccion se debe cambiar la clave inicial y configurar secretos fuertes en `.env`.

## Git

Repositorio remoto:

```txt
https://github.com/Escruceria/MaintenanceSystem.git
```

Subir cambios:

```bash
git push
```
