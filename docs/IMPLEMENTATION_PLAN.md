# Plan de Implementacion - MaintenanceSystem

## Objetivo

Convertir MaintenanceSystem en una plataforma CMMS/EAM general, modular y escalable para la gestion de mantenimiento de cualquier tipo de activo fisico, tecnologico, operativo o de infraestructura.

La implementacion debe hacerse por fases, evitando cambios destructivos sobre lo que ya funciona.

## Estado actual

Ya existe:

- Monorepo con NestJS y Next.js.
- PostgreSQL.
- Prisma.
- Docker Compose.
- Autenticacion JWT.
- Refresh token.
- Usuario administrador inicial.
- Registro seguro por invitacion.
- Guard base por permisos.
- CRUD administrativo de usuarios.
- Modulos base del backend.
- Documentacion inicial.
- Repositorio GitHub.

## Brechas actuales

Faltan:

- Categorias de activos.
- Tipos de activos.
- Criticidad.
- Campos personalizados.
- Garantias.
- Documentos.
- Fotos.
- Proveedores asociados a activos.
- Responsables de activos.
- Planes asociados a activos.
- CRUDs completos.
- Dashboard conectado a datos reales.

## Orden de implementacion aprobado

El desarrollo operativo continuara en este orden:

1. Invitaciones de usuario: registro seguro por token, sin registro publico.
2. Roles y permisos reales: guards por permiso, no solo JWT.
3. CRUD de usuarios: crear, listar, activar/desactivar y asignar roles. Estado: implementado.
4. CRUD de ubicaciones: sedes, areas y jerarquias.
5. CRUD de activos/equipos: codigo, nombre, serial, marca, modelo, estado y ubicacion.
6. Ordenes de trabajo: crear, asignar, cambiar estados y cerrar.

## Fase 1 - Documentacion del dominio

Objetivo: dejar clara la vision amplia de la plataforma.

Entregables:

- `docs/DOMAIN_MODEL.md`.
- `docs/IMPLEMENTATION_PLAN.md`.
- Actualizacion de `README.md`.
- Actualizacion de `docs/ROADMAP.md`.

Estado: en progreso.

## Fase 2 - Modelo flexible de activos

Objetivo: ampliar el modelo sin romper lo existente.

Cambios propuestos:

- Agregar `AssetCategory`.
- Agregar `AssetType`.
- Agregar `AssetCustomFieldDefinition`.
- Agregar `AssetCustomFieldValue`.
- Agregar `AssetDocument`.
- Agregar `AssetPhoto`.
- Agregar `AssetWarranty`.
- Agregar `AssetMeter`.
- Agregar criticidad en `Asset`.
- Agregar fecha de adquisicion y vida util.
- Relacionar activo con proveedor y responsable.

Regla: mantener `Asset` como entidad central.

## Fase 3 - Backend de activos

Objetivo: construir CRUD real de activos generales.

Entregables:

- Endpoints de categorias.
- Endpoints de tipos.
- Endpoints de activos.
- Endpoints de campos personalizados.
- Validaciones con DTOs.
- Swagger actualizado.
- Tests basicos de servicios criticos.

Endpoints esperados:

- `GET /api/asset-categories`
- `POST /api/asset-categories`
- `GET /api/asset-types`
- `POST /api/asset-types`
- `GET /api/assets`
- `POST /api/assets`
- `GET /api/assets/:id`
- `PATCH /api/assets/:id`
- `GET /api/assets/:id/history`

## Fase 4 - Roles y permisos reales

Objetivo: pasar de JWT simple a autorizacion por permisos.

Roles propuestos:

- `ADMIN`
- `MAINTENANCE_MANAGER`
- `TECHNICIAN`
- `REQUESTER`
- `INVENTORY_MANAGER`
- `AUDITOR`
- `REPORT_VIEWER`

Permisos propuestos:

- `assets:read`
- `assets:create`
- `assets:update`
- `assets:delete`
- `asset-types:manage`
- `work-orders:read`
- `work-orders:create`
- `work-orders:assign`
- `work-orders:close`
- `work-orders:cancel`
- `maintenance-plans:manage`
- `requests:create`
- `requests:approve`
- `requests:reject`
- `inventory:read`
- `inventory:write`
- `inventory:issue`
- `suppliers:manage`
- `reports:read`
- `reports:export`
- `audit:read`
- `settings:manage`

Entregables:

- Decorador `@Permissions`. Estado: base implementada.
- Guard de permisos. Estado: base implementada.
- Seed ampliado de roles y permisos. Estado: implementado.
- Documentacion de permisos. Estado: implementado.
- Aplicacion en endpoints operativos actuales. Estado: implementado.

Pendiente futuro:

- CRUD de roles.
- CRUD de permisos.
- Politicas por sede o alcance organizacional.

## Fase 4.1 - CRUD de usuarios

Objetivo: administrar usuarios internos sin registro publico libre.

Entregables:

- Crear usuario administrativo. Estado: implementado.
- Listar usuarios. Estado: implementado.
- Consultar usuario por id. Estado: implementado.
- Actualizar nombre, correo y estado. Estado: implementado.
- Activar usuario. Estado: implementado.
- Desactivar usuario y revocar refresh tokens. Estado: implementado.
- Listar roles disponibles. Estado: implementado.
- Asignar roles reemplazando la matriz actual del usuario. Estado: implementado.

Reglas implementadas:

- No devolver `passwordHash`.
- No permitir que un usuario se desactive a si mismo.
- No permitir que un administrador se quite a si mismo el rol `ADMIN`.

## Fase 5 - Invitaciones de usuario

Objetivo: evitar registro publico libre.

Entregables:

- Modelo `UserInvitation`. Estado: implementado.
- Token seguro hasheado. Estado: implementado.
- Expiracion. Estado: implementado.
- Estados pendiente, aceptada, cancelada y expirada. Estado: implementado.
- Endpoint para crear invitacion. Estado: implementado.
- Endpoint para aceptar invitacion. Estado: implementado.
- Endpoint para cancelar invitacion pendiente. Estado: implementado.
- Creacion de password por el usuario invitado. Estado: implementado.

Pendiente futuro:

- Envio real de correos.
- Pantalla frontend para aceptar invitaciones.
- Politica avanzada de contrasenas.

## Fase 6 - Ordenes de trabajo

Objetivo: crear el ciclo operativo de mantenimiento.

Entregables:

- Crear orden.
- Asignar tecnico.
- Cambiar estado.
- Registrar tiempos.
- Asociar repuestos.
- Registrar evidencias.
- Cerrar orden.
- Auditar cambios.

Estados:

- `DRAFT`
- `OPEN`
- `ASSIGNED`
- `IN_PROGRESS`
- `ON_HOLD`
- `COMPLETED`
- `CANCELLED`

Tipos:

- Correctivo.
- Preventivo.
- Predictivo.
- Inspeccion.

## Fase 7 - Planes de mantenimiento

Objetivo: programar mantenimiento preventivo e inspecciones.

Frecuencias soportadas:

- Por fecha.
- Por periodicidad.
- Por horas de operacion.
- Por kilometraje.
- Por ciclos.
- Por lectura de medidor.

Entregables:

- Plan por activo.
- Tareas del plan.
- Generacion de ordenes.
- Calendario de proximos mantenimientos.

## Fase 8 - Inventario y proveedores

Objetivo: controlar repuestos, consumibles y proveedores.

Entregables:

- CRUD de repuestos.
- Stock minimo.
- Entradas y salidas.
- Salida por orden de trabajo.
- Proveedores.
- Costos.
- Alertas de inventario.

## Fase 9 - Dashboard e indicadores

Objetivo: mostrar indicadores reales desde PostgreSQL.

Indicadores:

- Activos por categoria.
- Activos criticos.
- Activos fuera de servicio.
- Ordenes abiertas.
- Ordenes vencidas.
- Cumplimiento preventivo.
- MTTR.
- MTBF.
- Disponibilidad.
- Costos por activo.
- Repuestos bajo minimo.

## Fase 10 - Produccion

Objetivo: endurecer plataforma para uso real.

Entregables:

- Variables por entorno.
- Backups.
- Rate limit.
- Logs estructurados.
- Auditoria completa.
- CI/CD.
- Estrategia de despliegue.
- Politica de seguridad.

## Reglas de implementacion

- No hacer cambios destructivos sin migracion clara.
- No subir secretos.
- Mantener commits pequenos.
- Actualizar documentacion con cada cambio relevante.
- Verificar build de API y Web antes de push.
- Probar migraciones y seed en Docker.
