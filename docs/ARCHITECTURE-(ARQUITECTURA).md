# Arquitectura - MaintenanceSystem

## Vision

MaintenanceSystem es una plataforma CMMS moderna para gestionar activos, ordenes de trabajo, mantenimiento preventivo, inventario, proveedores, usuarios, roles, reportes y auditoria.

El objetivo tecnico es mantener una arquitectura modular, segura y facil de evolucionar.

## Decision tecnica principal

El sistema se construye como un monorepo con dos aplicaciones principales:

- API NestJS en `apps/api`
- Web Next.js en `apps/web`

PostgreSQL es la fuente de verdad y Prisma define el modelo de datos inicial.

Docker Compose permite levantar un entorno aislado con PostgreSQL, API y frontend.

El almacenamiento de evidencias usa disco local del API para el entorno actual. La ruta base se define con `UPLOAD_ROOT`, se expone bajo `/uploads/` y en Docker se persiste mediante el volumen `evidence-storage`. Esta decision mantiene el ciclo operativo completo sin bloquear una evolucion futura hacia MinIO, S3 u otro proveedor compatible.

## Principios

- API modular por dominio.
- Validacion de entrada en DTOs.
- Autenticacion JWT con refresh tokens.
- Roles y permisos desde el inicio.
- Auditoria de acciones criticas.
- Reportes desacoplados de la logica transaccional.
- UI operativa, responsive y orientada a productividad.
- Configuracion por variables de entorno.
- Migraciones versionadas con Prisma.
- Documentacion operativa desde el inicio.

## Dominio base

- Usuarios, roles y permisos
- Ubicaciones
- Activos/equipos
- Ordenes de trabajo
- Planes preventivos
- Solicitudes de servicio
- Inventario de repuestos
- Proveedores
- Auditoria

## Capas del backend

Cada modulo del API debe evolucionar con esta estructura:

- `controller`: expone rutas HTTP y documentacion Swagger.
- `service`: concentra reglas de negocio.
- `dto`: valida entrada de datos.
- `guards`: protege rutas cuando aplique.
- `prisma`: persiste datos mediante modelos versionados.

## Modulos actuales del API

- `auth`: login, refresh token, logout y usuario actual.
- `users`: usuarios y consulta protegida.
- `assets`: activos/equipos.
- `locations`: ubicaciones.
- `work-orders`: ordenes de trabajo.
- `maintenance-plans`: planes preventivos.
- `requests`: solicitudes de servicio.
- `inventory`: repuestos e inventario.
- `suppliers`: proveedores.
- `reports`: reportes y metricas.
- `audit`: auditoria.
- `health`: verificacion de vida del API.

## Puertos locales

- Web: `3000`
- API: `4000`
- PostgreSQL local: `5432`
- PostgreSQL Docker: `5433`

El puerto `5433` evita conflicto con PostgreSQL instalado localmente en Windows.
