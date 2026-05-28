# Arquitectura Inicial

## Decision tecnica

MaintenanceSystem se construye como un monorepo con dos aplicaciones principales:

- API NestJS en `apps/api`
- Web Next.js en `apps/web`

PostgreSQL es la fuente de verdad y Prisma define el modelo de datos inicial.

## Principios

- API modular por dominio.
- Validacion de entrada en DTOs.
- Autenticacion JWT con refresh tokens.
- Roles y permisos desde el inicio.
- Auditoria de acciones criticas.
- Reportes desacoplados de la logica transaccional.
- UI operativa, responsive y orientada a productividad.

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

