# API

## Base URL local

```txt
http://localhost:4000/api
```

## Swagger

```txt
http://localhost:4000/docs
```

## Health check

```powershell
curl.exe http://localhost:4000/api/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "service": "MaintenanceSystem API",
  "timestamp": "..."
}
```

## Login

PowerShell:

```powershell
curl.exe -X POST http://localhost:4000/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"admin@maintenance.local\",\"password\":\"Admin123*\"}"
```

## Usuario actual

```powershell
curl.exe http://localhost:4000/api/auth/me -H "Authorization: Bearer <accessToken>"
```

## Invitaciones de usuario

MaintenanceSystem no tiene registro publico libre. Los usuarios nuevos ingresan por invitacion generada por un usuario con permiso `users:write`.

Crear invitacion:

```powershell
curl.exe -X POST http://localhost:4000/api/invitations `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"email\":\"tecnico@empresa.com\",\"name\":\"Tecnico de mantenimiento\",\"roleId\":\"<roleId>\",\"expiresInDays\":7}"
```

La respuesta devuelve el `token` una sola vez para pruebas/desarrollo. En produccion este token debe enviarse por correo y nunca almacenarse en texto plano.

Listar invitaciones:

```powershell
curl.exe http://localhost:4000/api/invitations -H "Authorization: Bearer <accessToken>"
```

Aceptar invitacion:

```powershell
curl.exe -X POST http://localhost:4000/api/invitations/accept `
  -H "Content-Type: application/json" `
  -d "{\"token\":\"<token>\",\"password\":\"NuevaClave123*\"}"
```

Cancelar invitacion pendiente:

```powershell
curl.exe -X POST http://localhost:4000/api/invitations/<invitationId>/cancel `
  -H "Authorization: Bearer <accessToken>"
```

## CRUD de usuarios

Crear usuario administrativo:

```powershell
curl.exe -X POST http://localhost:4000/api/users `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"email\":\"operador@empresa.com\",\"name\":\"Operador de mantenimiento\",\"password\":\"Usuario123*\",\"roleIds\":[\"<roleId>\"]}"
```

Listar usuarios:

```powershell
curl.exe http://localhost:4000/api/users -H "Authorization: Bearer <accessToken>"
```

Consultar usuario:

```powershell
curl.exe http://localhost:4000/api/users/<userId> -H "Authorization: Bearer <accessToken>"
```

Actualizar usuario:

```powershell
curl.exe -X PATCH http://localhost:4000/api/users/<userId> `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"name\":\"Nombre actualizado\",\"status\":\"ACTIVE\"}"
```

Activar o desactivar usuario:

```powershell
curl.exe -X PATCH http://localhost:4000/api/users/<userId>/activate -H "Authorization: Bearer <accessToken>"
curl.exe -X PATCH http://localhost:4000/api/users/<userId>/deactivate -H "Authorization: Bearer <accessToken>"
```

Listar roles disponibles:

```powershell
curl.exe http://localhost:4000/api/users/roles -H "Authorization: Bearer <accessToken>"
```

Asignar roles:

```powershell
curl.exe -X PUT http://localhost:4000/api/users/<userId>/roles `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"roleIds\":[\"<roleId>\"]}"
```

Reglas:

- Las respuestas no devuelven `passwordHash`.
- Un usuario administrador no puede desactivar su propia cuenta.
- Un usuario administrador no puede quitarse a si mismo el rol `ADMIN`.
- Al desactivar un usuario se revocan sus refresh tokens activos.

## CRUD de ubicaciones

Las ubicaciones representan sedes, edificios, pisos, areas, almacenes, cuartos o puntos tecnicos donde viven los activos.

Tipos disponibles:

- `SITE`
- `BUILDING`
- `FLOOR`
- `AREA`
- `ROOM`
- `WAREHOUSE`
- `POINT`
- `OTHER`

Crear ubicacion:

```powershell
curl.exe -X POST http://localhost:4000/api/locations `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"code\":\"HQ-01\",\"name\":\"Sede principal\",\"type\":\"SITE\"}"
```

Crear sububicacion:

```powershell
curl.exe -X POST http://localhost:4000/api/locations `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"code\":\"HQ-01-AREA-01\",\"name\":\"Area administrativa\",\"type\":\"AREA\",\"parentId\":\"<locationId>\"}"
```

Listar ubicaciones:

```powershell
curl.exe http://localhost:4000/api/locations -H "Authorization: Bearer <accessToken>"
```

Ver arbol jerarquico:

```powershell
curl.exe http://localhost:4000/api/locations/tree -H "Authorization: Bearer <accessToken>"
```

Consultar ubicacion:

```powershell
curl.exe http://localhost:4000/api/locations/<locationId> -H "Authorization: Bearer <accessToken>"
```

Actualizar ubicacion:

```powershell
curl.exe -X PATCH http://localhost:4000/api/locations/<locationId> `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"name\":\"Area administrativa actualizada\",\"parentId\":\"<parentId>\"}"
```

Activar o desactivar ubicacion:

```powershell
curl.exe -X PATCH http://localhost:4000/api/locations/<locationId>/activate -H "Authorization: Bearer <accessToken>"
curl.exe -X PATCH http://localhost:4000/api/locations/<locationId>/deactivate -H "Authorization: Bearer <accessToken>"
```

Eliminar ubicacion:

```powershell
curl.exe -X DELETE http://localhost:4000/api/locations/<locationId> -H "Authorization: Bearer <accessToken>"
```

Reglas:

- El codigo es unico y se normaliza en mayusculas.
- Una ubicacion puede tener padre para construir jerarquias.
- Una ubicacion no puede ser padre de si misma.
- Una ubicacion no puede moverse dentro de una sububicacion propia.
- No se puede eliminar una ubicacion con sububicaciones o activos asociados.
- La desactivacion mantiene historia y relaciones.

## CRUD de activos/equipos

Los activos/equipos representan cualquier elemento fisico, tecnologico, operativo o de infraestructura que requiere seguimiento y mantenimiento.

Estados disponibles:

- `ACTIVE`
- `IN_MAINTENANCE`
- `OUT_OF_SERVICE`
- `RETIRED`

Crear activo:

```powershell
curl.exe -X POST http://localhost:4000/api/assets `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"code\":\"EQ-0001\",\"name\":\"Bomba centrifuga linea 2\",\"serialNumber\":\"SN-001\",\"brand\":\"Siemens\",\"model\":\"XPTO-500\",\"locationId\":\"<locationId>\"}"
```

Si no se envia `qrCode`, la API genera uno con el formato `MS-ASSET:<CODE>`.

Listar activos:

```powershell
curl.exe http://localhost:4000/api/assets -H "Authorization: Bearer <accessToken>"
```

Consultar activo:

```powershell
curl.exe http://localhost:4000/api/assets/<assetId> -H "Authorization: Bearer <accessToken>"
```

Actualizar activo:

```powershell
curl.exe -X PATCH http://localhost:4000/api/assets/<assetId> `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"name\":\"Bomba centrifuga actualizada\",\"status\":\"IN_MAINTENANCE\"}"
```

Activar o retirar activo:

```powershell
curl.exe -X PATCH http://localhost:4000/api/assets/<assetId>/activate -H "Authorization: Bearer <accessToken>"
curl.exe -X PATCH http://localhost:4000/api/assets/<assetId>/retire -H "Authorization: Bearer <accessToken>"
```

Eliminar activo:

```powershell
curl.exe -X DELETE http://localhost:4000/api/assets/<assetId> -H "Authorization: Bearer <accessToken>"
```

Reglas:

- El codigo es unico y se normaliza en mayusculas.
- El QR es unico. Si no se envia, se genera automaticamente desde el codigo.
- La ubicacion debe existir cuando se asigna `locationId`.
- Las respuestas incluyen la ubicacion resumida.
- No se puede eliminar un activo con ordenes o solicitudes asociadas.
- Para conservar historia operativa, un activo con trazabilidad debe retirarse usando estado `RETIRED`.

## Ordenes de trabajo

Las ordenes de trabajo conectan un activo con un tipo de mantenimiento, prioridad, tecnico asignado, estado operativo y repuestos utilizados.

Crear orden:

```powershell
curl.exe -X POST http://localhost:4000/api/work-orders `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"title\":\"Reparar bomba\",\"type\":\"CORRECTIVE\",\"priority\":\"HIGH\",\"assetId\":\"<assetId>\",\"assignedTechnicianId\":\"<userId>\"}"
```

Listar ordenes:

```powershell
curl.exe http://localhost:4000/api/work-orders -H "Authorization: Bearer <accessToken>"
```

Consultar orden:

```powershell
curl.exe http://localhost:4000/api/work-orders/<workOrderId> -H "Authorization: Bearer <accessToken>"
```

Actualizar datos de la orden:

```powershell
curl.exe -X PATCH http://localhost:4000/api/work-orders/<workOrderId> `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"priority\":\"CRITICAL\",\"status\":\"IN_PROGRESS\"}"
```

Asignar tecnico:

```powershell
curl.exe -X PATCH http://localhost:4000/api/work-orders/<workOrderId>/assign `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"technicianId\":\"<userId>\"}"
```

Cambiar estado:

```powershell
curl.exe -X PATCH http://localhost:4000/api/work-orders/<workOrderId>/status `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"status\":\"IN_PROGRESS\"}"
```

Asociar repuestos:

```powershell
curl.exe -X PUT http://localhost:4000/api/work-orders/<workOrderId>/spare-parts `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"spareParts\":[{\"sparePartId\":\"<sparePartId>\",\"quantity\":2}]}"
```

Cerrar orden:

```powershell
curl.exe -X PATCH http://localhost:4000/api/work-orders/<workOrderId>/close `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"spareParts\":[{\"sparePartId\":\"<sparePartId>\",\"quantity\":2}]}"
```

Cancelar orden:

```powershell
curl.exe -X PATCH http://localhost:4000/api/work-orders/<workOrderId>/cancel -H "Authorization: Bearer <accessToken>"
```

Reglas:

- Si no se envia numero, la API genera un numero `OT-YYYYMMDD-0001`.
- El activo asociado debe existir.
- El tecnico asignado debe ser un usuario activo.
- Los repuestos asociados deben existir.
- Al cerrar la orden se descuenta stock de los repuestos asociados.
- No se puede modificar una orden completada o cancelada.
- No se puede cerrar una orden si algun repuesto no tiene stock suficiente.

## Rutas protegidas actuales

- `POST /api/users`
- `GET /api/users`
- `GET /api/users/roles`
- `GET /api/users/:id`
- `PATCH /api/users/:id`
- `PATCH /api/users/:id/activate`
- `PATCH /api/users/:id/deactivate`
- `PUT /api/users/:id/roles`
- `GET /api/invitations`
- `POST /api/invitations`
- `POST /api/invitations/:id/cancel`
- `POST /api/locations`
- `GET /api/locations`
- `GET /api/locations/tree`
- `GET /api/locations/:id`
- `PATCH /api/locations/:id`
- `PATCH /api/locations/:id/activate`
- `PATCH /api/locations/:id/deactivate`
- `DELETE /api/locations/:id`
- `POST /api/assets`
- `GET /api/assets`
- `GET /api/assets/:id`
- `PATCH /api/assets/:id`
- `PATCH /api/assets/:id/activate`
- `PATCH /api/assets/:id/retire`
- `DELETE /api/assets/:id`
- `POST /api/work-orders`
- `GET /api/work-orders`
- `GET /api/work-orders/:id`
- `PATCH /api/work-orders/:id`
- `PATCH /api/work-orders/:id/assign`
- `PATCH /api/work-orders/:id/status`
- `PUT /api/work-orders/:id/spare-parts`
- `PATCH /api/work-orders/:id/close`
- `PATCH /api/work-orders/:id/cancel`
- `GET /api/maintenance-plans`
- `GET /api/requests`
- `GET /api/inventory/spare-parts`
- `GET /api/suppliers`
- `GET /api/reports/summary`
- `GET /api/audit`

Sin token deben responder `401`.
Con token valido pero sin permiso deben responder `403`.

La matriz de permisos esta documentada en `docs/PERMISSIONS-(PERMISOS).md`.

## Convenciones futuras

- Usar DTOs con `class-validator`.
- Documentar endpoints con Swagger.
- Validar permisos por accion antes de exponer operaciones de escritura.
- No devolver `passwordHash` ni tokens hasheados.
