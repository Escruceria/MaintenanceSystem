# MaintenanceSystem

Plataforma moderna de gestion de mantenimiento construida con NestJS, Next.js, PostgreSQL, Prisma y Docker.

## Arquitectura

- `apps/api`: backend NestJS con API REST, Prisma, autenticacion y modulos del dominio.
- `apps/web`: frontend Next.js con TypeScript.
- `packages`: espacio reservado para librerias compartidas.
- `docker-compose.yml`: PostgreSQL y servicios de desarrollo.

## Base de datos local

El proyecto esta configurado para usar PostgreSQL local en `localhost:5432`.
La base inicial es `maintenance_system` y las migraciones viven en `apps/api/prisma/migrations`.

Docker queda como opcion para entornos aislados, pero no es obligatorio si PostgreSQL ya esta instalado localmente.

## Primeros comandos

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
