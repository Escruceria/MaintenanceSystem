# Roles y Permisos

## Enfoque

MaintenanceSystem usa autenticacion JWT y autorizacion por permisos.

Tener un token valido no es suficiente para ejecutar acciones operativas. Cada endpoint protegido debe declarar el permiso requerido mediante `@Permissions(...)` y usar `PermissionsGuard`.

## Roles iniciales

### ADMIN

Administrador total del sistema.

Permisos: todos.

### MAINTENANCE_MANAGER

Responsable de mantenimiento. Puede gestionar la operacion principal.

Permisos principales:

- Usuarios: lectura.
- Ubicaciones: lectura y escritura.
- Activos: lectura y escritura.
- Ordenes de trabajo: lectura, escritura, asignacion y cierre.
- Ejecucion de ordenes: checklist, notas operativas y evidencias.
- Planes de mantenimiento: lectura y escritura.
- Solicitudes: lectura, escritura, revision y conversion a orden.
- Inventario: lectura.
- Proveedores: lectura.
- Garantias: lectura y escritura.
- Reportes: lectura.

### TECHNICIAN

Tecnico de mantenimiento.

Permisos principales:

- Ubicaciones: lectura.
- Activos: lectura.
- Ordenes de trabajo: lectura, ejecucion operativa y evidencias.
- Solicitudes: lectura.
- Inventario: lectura.

### REQUESTER

Usuario solicitante.

Permisos principales:

- Activos: lectura.
- Solicitudes: lectura y escritura.

### INVENTORY_MANAGER

Responsable de inventario.

Permisos principales:

- Inventario: lectura y escritura.
- Kardex: ajustes y movimientos.
- Proveedores: lectura y escritura.
- Garantias: lectura y escritura.
- Reportes: lectura.

### AUDITOR

Usuario auditor.

Permisos principales:

- Lectura transversal de usuarios, ubicaciones, activos, ordenes, planes, solicitudes, inventario, proveedores y reportes.
- Lectura de garantias.
- Auditoria: lectura.

### REPORT_VIEWER

Usuario de consulta gerencial.

Permisos principales:

- Reportes: lectura.
- Activos: lectura.
- Ordenes de trabajo: lectura.

## Permisos iniciales

| Permiso                   | Uso                                                       |
| ------------------------- | --------------------------------------------------------- |
| `users:read`              | Leer usuarios e invitaciones                              |
| `users:write`             | Crear, actualizar, activar, desactivar e invitar usuarios |
| `roles:read`              | Leer roles y permisos                                     |
| `roles:write`             | Administrar roles y permisos                              |
| `locations:read`          | Leer sedes, areas y ubicaciones                           |
| `locations:write`         | Crear y actualizar sedes, areas y ubicaciones             |
| `assets:read`             | Leer activos, equipos e historial                         |
| `assets:write`            | Crear y actualizar activos y equipos                      |
| `work-orders:read`        | Leer ordenes de trabajo, checklist y evidencias           |
| `work-orders:write`       | Crear, actualizar ordenes, ejecutar checklist y registrar evidencias |
| `work-orders:assign`      | Asignar ordenes de trabajo                                |
| `work-orders:execute`     | Ejecutar checklist, notas y avance operativo de ordenes   |
| `work-orders:close`       | Cerrar ordenes de trabajo                                 |
| `work-orders:evidences:read` | Leer y descargar evidencias de ordenes de trabajo      |
| `work-orders:evidences:write` | Registrar y cargar evidencias de ordenes de trabajo    |
| `work-orders:evidences:void` | Anular evidencias de ordenes de trabajo                  |
| `maintenance-plans:read`  | Leer planes de mantenimiento                              |
| `maintenance-plans:write` | Crear y actualizar planes de mantenimiento                |
| `requests:read`           | Leer solicitudes de servicio                              |
| `requests:write`          | Crear y actualizar solicitudes de servicio                |
| `requests:review`         | Revisar, aprobar, rechazar y cerrar solicitudes de servicio |
| `requests:convert`        | Convertir solicitudes aprobadas en ordenes de trabajo     |
| `inventory:read`          | Leer inventario y repuestos                               |
| `inventory:write`         | Crear y actualizar inventario y repuestos                 |
| `inventory:adjust`        | Ajustar existencias de inventario                         |
| `inventory:move`          | Registrar movimientos de Kardex                           |
| `suppliers:read`          | Leer proveedores                                          |
| `suppliers:write`         | Crear y actualizar proveedores                            |
| `warranties:read`         | Leer garantias de activos                                 |
| `warranties:write`        | Crear, actualizar y cancelar garantias de activos         |
| `reports:read`            | Leer reportes e indicadores                               |
| `reports:export`          | Exportar reportes                                         |
| `audit:read`              | Leer auditoria del sistema con filtros y paginacion       |
| `settings:manage`         | Administrar configuracion del sistema                     |

## Matriz por rol

| Modulo / capacidad | ADMIN | MAINTENANCE_MANAGER | TECHNICIAN | REQUESTER | INVENTORY_MANAGER | AUDITOR | REPORT_VIEWER |
| ------------------ | ----- | ------------------- | ---------- | --------- | ----------------- | ------- | ------------- |
| Usuarios lectura | Si | Si | No | No | No | Si | No |
| Usuarios escritura | Si | No | No | No | No | No | No |
| Roles lectura/escritura | Si | No | No | No | No | No | No |
| Ubicaciones lectura | Si | Si | Si | No | No | Si | No |
| Ubicaciones escritura | Si | Si | No | No | No | No | No |
| Activos lectura | Si | Si | Si | Si | No | Si | Si |
| Activos escritura | Si | Si | No | No | No | No | No |
| Ordenes lectura | Si | Si | Si | No | No | Si | Si |
| Ordenes creacion/edicion | Si | Si | No | No | No | No | No |
| Ordenes asignacion | Si | Si | No | No | No | No | No |
| Ordenes ejecucion | Si | Si | Si | No | No | No | No |
| Ordenes cierre | Si | Si | No | No | No | No | No |
| Evidencias lectura/carga | Si | Si | Si | No | No | No | No |
| Evidencias anulacion | Si | Si | No | No | No | No | No |
| Planes lectura | Si | Si | No | No | No | Si | No |
| Planes escritura | Si | Si | No | No | No | No | No |
| Solicitudes lectura | Si | Si | Si | Si | No | Si | No |
| Solicitudes creacion/edicion | Si | Si | No | Si | No | No | No |
| Solicitudes revision/conversion | Si | Si | No | No | No | No | No |
| Inventario lectura | Si | Si | Si | No | Si | Si | No |
| Inventario escritura | Si | No | No | No | Si | No | No |
| Inventario ajustes/Kardex | Si | No | No | No | Si | No | No |
| Proveedores lectura | Si | Si | No | No | Si | Si | No |
| Proveedores escritura | Si | No | No | No | Si | No | No |
| Garantias lectura | Si | Si | No | No | Si | Si | No |
| Garantias escritura | Si | Si | No | No | Si | No | No |
| Reportes lectura | Si | Si | No | No | Si | Si | Si |
| Auditoria lectura | Si | No | No | No | No | Si | No |
| Configuracion | Si | No | No | No | No | No | No |

## Endpoints protegidos actualmente

| Endpoint                                               | Permiso requerido                               |
| ------------------------------------------------------ | ----------------------------------------------- |
| `POST /api/users`                                      | `users:write`                                   |
| `GET /api/users`                                       | `users:read`                                    |
| `GET /api/users/roles`                                 | `roles:read`                                    |
| `GET /api/users/:id`                                   | `users:read`                                    |
| `PATCH /api/users/:id`                                 | `users:write`                                   |
| `PATCH /api/users/:id/activate`                        | `users:write`                                   |
| `PATCH /api/users/:id/deactivate`                      | `users:write`                                   |
| `PUT /api/users/:id/roles`                             | `users:write`                                   |
| `GET /api/invitations`                                 | `users:read`                                    |
| `POST /api/invitations`                                | `users:write`                                   |
| `POST /api/invitations/:id/cancel`                     | `users:write`                                   |
| `POST /api/locations`                                  | `locations:write`                               |
| `GET /api/locations`                                   | `locations:read`                                |
| `GET /api/locations/tree`                              | `locations:read`                                |
| `GET /api/locations/:id`                               | `locations:read`                                |
| `PATCH /api/locations/:id`                             | `locations:write`                               |
| `PATCH /api/locations/:id/activate`                    | `locations:write`                               |
| `PATCH /api/locations/:id/deactivate`                  | `locations:write`                               |
| `DELETE /api/locations/:id`                            | `locations:write`                               |
| `POST /api/assets`                                     | `assets:write`                                  |
| `GET /api/assets`                                      | `assets:read`                                   |
| `GET /api/assets/:id`                                  | `assets:read`                                   |
| `GET /api/assets/:id/history`                          | `assets:read`                                   |
| `PATCH /api/assets/:id`                                | `assets:write`                                  |
| `PATCH /api/assets/:id/activate`                       | `assets:write`                                  |
| `PATCH /api/assets/:id/retire`                         | `assets:write`                                  |
| `DELETE /api/assets/:id`                               | `assets:write`                                  |
| `POST /api/work-orders`                                | `work-orders:write`                             |
| `GET /api/work-orders`                                 | `work-orders:read`                              |
| `GET /api/work-orders/:id`                             | `work-orders:read`                              |
| `PATCH /api/work-orders/:id`                           | `work-orders:write`                             |
| `PATCH /api/work-orders/:id/assign`                    | `work-orders:assign`                            |
| `PATCH /api/work-orders/:id/status`                    | `work-orders:execute`                           |
| `PUT /api/work-orders/:id/spare-parts`                 | `work-orders:write`                             |
| `GET /api/work-orders/:id/checklist`                   | `work-orders:read`                              |
| `PATCH /api/work-orders/:id/checklist/:itemId`         | `work-orders:execute`                           |
| `PATCH /api/work-orders/:id/execution-notes`           | `work-orders:execute`                           |
| `GET /api/work-orders/:id/evidences`                   | `work-orders:evidences:read`                    |
| `GET /api/work-orders/:id/evidences/:evidenceId/download` | `work-orders:evidences:read`                 |
| `POST /api/work-orders/:id/evidences`                  | `work-orders:evidences:write`                   |
| `POST /api/work-orders/:id/evidences/upload`           | `work-orders:evidences:write`                   |
| `DELETE /api/work-orders/:id/evidences/:evidenceId`    | `work-orders:evidences:void`                    |
| `PATCH /api/work-orders/:id/close`                     | `work-orders:close`                             |
| `PATCH /api/work-orders/:id/cancel`                    | `work-orders:write`                             |
| `POST /api/maintenance-plans`                          | `maintenance-plans:write`                       |
| `GET /api/maintenance-plans`                           | `maintenance-plans:read`                        |
| `GET /api/maintenance-plans/:id`                       | `maintenance-plans:read`                        |
| `PATCH /api/maintenance-plans/:id`                     | `maintenance-plans:write`                       |
| `PATCH /api/maintenance-plans/:id/activate`            | `maintenance-plans:write`                       |
| `PATCH /api/maintenance-plans/:id/deactivate`          | `maintenance-plans:write`                       |
| `POST /api/maintenance-plans/:id/tasks`                | `maintenance-plans:write`                       |
| `PUT /api/maintenance-plans/:id/tasks`                 | `maintenance-plans:write`                       |
| `PATCH /api/maintenance-plans/:id/tasks/:taskId`       | `maintenance-plans:write`                       |
| `DELETE /api/maintenance-plans/:id/tasks/:taskId`      | `maintenance-plans:write`                       |
| `POST /api/maintenance-plans/:id/assets/:assetId`      | `maintenance-plans:write`                       |
| `PUT /api/maintenance-plans/:id/assets`                | `maintenance-plans:write`                       |
| `DELETE /api/maintenance-plans/:id/assets/:assetId`    | `maintenance-plans:write`                       |
| `POST /api/maintenance-plans/:id/generate-work-orders` | `maintenance-plans:write` y `work-orders:write` |
| `DELETE /api/maintenance-plans/:id`                    | `maintenance-plans:write`                       |
| `POST /api/requests`                                   | `requests:write`                                |
| `GET /api/requests`                                    | `requests:read`                                 |
| `GET /api/requests/:id`                                | `requests:read`                                 |
| `PATCH /api/requests/:id`                              | `requests:write`                                |
| `PATCH /api/requests/:id/review`                       | `requests:review`                               |
| `PATCH /api/requests/:id/approve`                      | `requests:review`                               |
| `PATCH /api/requests/:id/reject`                       | `requests:review`                               |
| `PATCH /api/requests/:id/close`                        | `requests:review`                               |
| `POST /api/requests/:id/convert-to-work-order`         | `requests:convert` y `work-orders:write`        |
| `POST /api/inventory/spare-parts`                      | `inventory:write`                               |
| `GET /api/inventory/spare-parts`                       | `inventory:read`                                |
| `GET /api/inventory/spare-parts/low-stock`             | `inventory:read`                                |
| `GET /api/inventory/spare-parts/:id`                   | `inventory:read`                                |
| `PATCH /api/inventory/spare-parts/:id`                 | `inventory:write`                               |
| `PATCH /api/inventory/spare-parts/:id/stock`           | `inventory:adjust`                              |
| `POST /api/inventory/spare-parts/:id/movements`        | `inventory:move`                                |
| `GET /api/inventory/spare-parts/:id/movements`         | `inventory:read`                                |
| `DELETE /api/inventory/spare-parts/:id`                | `inventory:write`                               |
| `POST /api/suppliers`                                  | `suppliers:write`                               |
| `GET /api/suppliers`                                   | `suppliers:read`                                |
| `GET /api/suppliers/:id`                               | `suppliers:read`                                |
| `PATCH /api/suppliers/:id`                             | `suppliers:write`                               |
| `PATCH /api/suppliers/:id/activate`                    | `suppliers:write`                               |
| `PATCH /api/suppliers/:id/deactivate`                  | `suppliers:write`                               |
| `POST /api/suppliers/warranties`                       | `warranties:write`                              |
| `GET /api/suppliers/warranties`                        | `warranties:read`                               |
| `GET /api/suppliers/warranties/expiring`               | `warranties:read`                               |
| `GET /api/suppliers/assets/:assetId/warranties`        | `warranties:read`                               |
| `PATCH /api/suppliers/warranties/:id`                  | `warranties:write`                              |
| `PATCH /api/suppliers/warranties/:id/cancel`           | `warranties:write`                              |
| `GET /api/reports/summary`                             | `reports:read`                                  |
| `GET /api/audit`                                       | `audit:read`                                    |

La ruta `GET /api/audit` permite filtrar por `actorId`, `action`, `entityType`, `entityId`, `from`, `to`, `page` y `limit`.

## Preparacion para frontend

El login y `GET /api/auth/me` devuelven el usuario autenticado con:

```json
{
  "sub": "...",
  "email": "admin@maintenance.local",
  "name": "Administrador",
  "roles": ["ADMIN"],
  "permissions": ["assets:read", "work-orders:read"]
}
```

El frontend debe:

- Usar `permissions` para mostrar u ocultar menus, botones y acciones.
- No confiar solo en el frontend: el backend siempre valida con `PermissionsGuard`.
- Usar el catalogo tipado `apps/web/src/lib/permissions.ts` para evitar strings duplicados.
- Tratar permisos compuestos como reglas `AND` cuando el endpoint declare mas de un permiso, por ejemplo convertir solicitudes requiere `requests:convert` y `work-orders:write`.
- Refrescar permisos despues de cambios de rol cerrando sesion o consultando nuevamente `GET /api/auth/me`.

## Reglas de implementacion

- Todo endpoint operativo protegido debe usar `JwtAuthGuard` y `PermissionsGuard`.
- Todo endpoint operativo debe declarar al menos un permiso con `@Permissions(...)`.
- Los permisos deben estar en el seed para que sean reproducibles en cualquier ambiente.
- Los roles deben ser configurables en base de datos, pero el seed mantiene una matriz inicial segura.
- Un usuario sin rol puede autenticarse, pero no debe poder acceder a rutas operativas.
- Las rutas publicas deben ser excepciones explicitas, por ejemplo `POST /api/auth/login`, `POST /api/auth/refresh` y `POST /api/invitations/accept`.
