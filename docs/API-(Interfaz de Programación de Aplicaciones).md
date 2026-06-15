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

Consultar historial del activo:

```powershell
curl.exe http://localhost:4000/api/assets/<assetId>/history -H "Authorization: Bearer <accessToken>"
```

El historial consolida:

- Datos generales y estado actual del activo.
- Ordenes asociadas al activo.
- Mantenimientos por tipo: correctivo, preventivo, predictivo e inspeccion.
- Evidencias registradas en las ordenes.
- Repuestos usados y cantidades acumuladas.
- Tecnicos que intervinieron y cantidad de ordenes asociadas.
- Fechas de programacion, inicio y cierre.
- Linea de tiempo operativa derivada de registros, inicios, cierres y estado actual.

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

Consultar checklist de la orden:

```powershell
curl.exe http://localhost:4000/api/work-orders/<workOrderId>/checklist -H "Authorization: Bearer <accessToken>"
```

Actualizar una tarea del checklist:

```powershell
curl.exe -X PATCH http://localhost:4000/api/work-orders/<workOrderId>/checklist/<checklistItemId> `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"status\":\"COMPLETED\",\"notes\":\"Tarea ejecutada sin novedad\"}"
```

Estados disponibles para tareas de checklist:

- `PENDING`: pendiente.
- `COMPLETED`: realizada.
- `NOT_COMPLETED`: no realizada.
- `NOT_APPLICABLE`: no aplica.

Cerrar orden:

```powershell
curl.exe -X PATCH http://localhost:4000/api/work-orders/<workOrderId>/close `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"finalNotes\":\"Activo probado y entregado operativo\",\"recommendations\":\"Revisar vibracion en el proximo preventivo\",\"spareParts\":[{\"sparePartId\":\"<sparePartId>\",\"quantity\":2}]}"
```

Registrar notas de ejecucion sin cerrar la orden:

```powershell
curl.exe -X PATCH http://localhost:4000/api/work-orders/<workOrderId>/execution-notes `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"finalNotes\":\"Se realizo limpieza y ajuste general\",\"recommendations\":\"Programar inspeccion termografica\"}"
```

Consultar evidencias:

```powershell
curl.exe http://localhost:4000/api/work-orders/<workOrderId>/evidences -H "Authorization: Bearer <accessToken>"
```

Registrar evidencia tipo observacion:

```powershell
curl.exe -X POST http://localhost:4000/api/work-orders/<workOrderId>/evidences `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"type\":\"NOTE\",\"title\":\"Observacion final\",\"description\":\"Equipo queda operativo y sin alarmas\"}"
```

Registrar evidencia tipo foto o documento:

```powershell
curl.exe -X POST http://localhost:4000/api/work-orders/<workOrderId>/evidences `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"type\":\"PHOTO\",\"title\":\"Foto posterior al mantenimiento\",\"description\":\"Estado final del activo\",\"fileUrl\":\"https://storage.local/work-orders/ot-0001/photo-1.jpg\",\"fileName\":\"photo-1.jpg\",\"mimeType\":\"image/jpeg\"}"
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
- Las ordenes generadas desde un plan copian el checklist vigente del plan.
- Cada tarea ejecutada registra estado, observacion opcional, usuario ejecutor y fecha de ejecucion.
- No se puede cerrar una orden si tiene tareas obligatorias pendientes, no realizadas o no aplicables.
- Las notas finales y recomendaciones pueden registrarse durante la ejecucion o al cerrar la orden.
- Las evidencias pueden ser `NOTE`, `PHOTO` o `DOCUMENT`.
- Las evidencias `PHOTO` y `DOCUMENT` requieren `fileUrl`; el almacenamiento fisico del archivo queda desacoplado para una integracion posterior con disco, MinIO, S3 u otro proveedor.
- Las evidencias conservan usuario que las registro y fecha de creacion.
- No se pueden agregar evidencias ni notas sobre ordenes canceladas.

## Inventario y repuestos

Los repuestos son elementos consumibles o piezas usadas por las ordenes de trabajo.

Crear repuesto:

```powershell
curl.exe -X POST http://localhost:4000/api/inventory/spare-parts `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"sku\":\"REP-0001\",\"name\":\"Rodamiento 6204\",\"unit\":\"UND\",\"stock\":10,\"minimumStock\":2}"
```

Listar repuestos:

```powershell
curl.exe http://localhost:4000/api/inventory/spare-parts -H "Authorization: Bearer <accessToken>"
```

Listar repuestos bajo minimo:

```powershell
curl.exe http://localhost:4000/api/inventory/spare-parts/low-stock -H "Authorization: Bearer <accessToken>"
```

Consultar repuesto:

```powershell
curl.exe http://localhost:4000/api/inventory/spare-parts/<sparePartId> -H "Authorization: Bearer <accessToken>"
```

Actualizar repuesto:

```powershell
curl.exe -X PATCH http://localhost:4000/api/inventory/spare-parts/<sparePartId> `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"name\":\"Rodamiento 6204 actualizado\",\"minimumStock\":5}"
```

Ajustar stock:

```powershell
curl.exe -X PATCH http://localhost:4000/api/inventory/spare-parts/<sparePartId>/stock `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"quantity\":5,\"reason\":\"Compra inicial\"}"
```

Eliminar repuesto:

```powershell
curl.exe -X DELETE http://localhost:4000/api/inventory/spare-parts/<sparePartId> -H "Authorization: Bearer <accessToken>"
```

Reglas:

- El SKU es unico y se normaliza en mayusculas.
- La unidad se normaliza en mayusculas.
- El stock y el stock minimo no pueden ser negativos.
- Los ajustes no pueden dejar el stock en negativo.
- No se puede eliminar un repuesto usado en ordenes de trabajo.

## Planes de mantenimiento

Los planes de mantenimiento permiten definir rutinas preventivas, predictivas o inspecciones periodicas, asociarlas a activos y generar ordenes de trabajo programadas.

Frecuencias disponibles:

- `DAILY`: diaria.
- `WEEKLY`: semanal.
- `MONTHLY`: mensual.
- `YEARLY`: anual.
- `ON_DATE`: por fecha unica.

Crear plan:

```powershell
curl.exe -X POST http://localhost:4000/api/maintenance-plans `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"code\":\"MP-BOMBA-MENSUAL\",\"name\":\"Mantenimiento mensual de bombas\",\"type\":\"PREVENTIVE\",\"frequencyType\":\"MONTHLY\",\"priority\":\"MEDIUM\",\"assetIds\":[\"<assetId>\"],\"tasks\":[{\"title\":\"Inspeccionar estado general\",\"sortOrder\":1},{\"title\":\"Verificar vibracion y ruido\",\"sortOrder\":2}]}"
```

Crear plan por fecha unica:

```powershell
curl.exe -X POST http://localhost:4000/api/maintenance-plans `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"code\":\"MP-INSPECCION-UNICA\",\"name\":\"Inspeccion unica de garantia\",\"type\":\"INSPECTION\",\"frequencyType\":\"ON_DATE\",\"nextDueAt\":\"2026-06-15T08:00:00.000Z\",\"assetIds\":[\"<assetId>\"]}"
```

Listar planes:

```powershell
curl.exe http://localhost:4000/api/maintenance-plans -H "Authorization: Bearer <accessToken>"
```

Consultar plan:

```powershell
curl.exe http://localhost:4000/api/maintenance-plans/<planId> -H "Authorization: Bearer <accessToken>"
```

Actualizar plan, tareas o activos asociados:

```powershell
curl.exe -X PATCH http://localhost:4000/api/maintenance-plans/<planId> `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"frequencyType\":\"WEEKLY\",\"assetIds\":[\"<assetId>\"],\"tasks\":[{\"title\":\"Inspeccion semanal\",\"sortOrder\":1}]}"
```

Agregar tarea al checklist:

```powershell
curl.exe -X POST http://localhost:4000/api/maintenance-plans/<planId>/tasks `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"title\":\"Verificar nivel de aceite\",\"description\":\"Registrar condicion encontrada\",\"sortOrder\":1,\"isRequired\":true}"
```

Reemplazar checklist completo:

```powershell
curl.exe -X PUT http://localhost:4000/api/maintenance-plans/<planId>/tasks `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"tasks\":[{\"title\":\"Inspeccionar estado general\",\"sortOrder\":1},{\"title\":\"Registrar evidencia\",\"sortOrder\":2}]}"
```

Actualizar una tarea del checklist:

```powershell
curl.exe -X PATCH http://localhost:4000/api/maintenance-plans/<planId>/tasks/<taskId> `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"title\":\"Verificar nivel de aceite y fugas\",\"isRequired\":true}"
```

Eliminar una tarea del checklist:

```powershell
curl.exe -X DELETE http://localhost:4000/api/maintenance-plans/<planId>/tasks/<taskId> `
  -H "Authorization: Bearer <accessToken>"
```

Asociar un activo al plan:

```powershell
curl.exe -X POST http://localhost:4000/api/maintenance-plans/<planId>/assets/<assetId> `
  -H "Authorization: Bearer <accessToken>"
```

Reemplazar todos los activos asociados al plan:

```powershell
curl.exe -X PUT http://localhost:4000/api/maintenance-plans/<planId>/assets `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"assetIds\":[\"<assetId1>\",\"<assetId2>\"]}"
```

Quitar un activo del plan:

```powershell
curl.exe -X DELETE http://localhost:4000/api/maintenance-plans/<planId>/assets/<assetId> `
  -H "Authorization: Bearer <accessToken>"
```

Activar o desactivar plan:

```powershell
curl.exe -X PATCH http://localhost:4000/api/maintenance-plans/<planId>/activate -H "Authorization: Bearer <accessToken>"
curl.exe -X PATCH http://localhost:4000/api/maintenance-plans/<planId>/deactivate -H "Authorization: Bearer <accessToken>"
```

Generar ordenes de trabajo desde un plan:

```powershell
curl.exe -X POST http://localhost:4000/api/maintenance-plans/<planId>/generate-work-orders `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"scheduledAt\":\"2026-06-15T08:00:00.000Z\"}"
```

Generar solo para un activo asociado:

```powershell
curl.exe -X POST http://localhost:4000/api/maintenance-plans/<planId>/generate-work-orders `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <accessToken>" `
  -d "{\"assetId\":\"<assetId>\"}"
```

Eliminar plan:

```powershell
curl.exe -X DELETE http://localhost:4000/api/maintenance-plans/<planId> -H "Authorization: Bearer <accessToken>"
```

Reglas:

- El codigo del plan es unico y se normaliza en mayusculas.
- La frecuencia operativa se define con `frequencyType`; `frequency` queda como etiqueta legible.
- Si no se envia `frequency`, la API la deriva de `frequencyType`.
- Si no se envia `intervalDays`, la API asigna 1, 7, 30, 365 o 0 segun la frecuencia.
- Los planes `ON_DATE` requieren `nextDueAt` y no calculan una siguiente fecha despues de generar orden.
- Un plan puede tener varias tareas/checklist.
- El checklist puede administrarse desde el CRUD del plan o desde rutas dedicadas.
- Cada tarea tiene titulo, descripcion opcional, orden y marca de obligatoriedad.
- Un plan puede estar asociado a varios activos.
- La asociacion plan-activo puede administrarse desde el CRUD del plan o desde rutas dedicadas.
- Solo se generan ordenes para activos en estado `ACTIVE`.
- No se genera una nueva orden si ya existe una orden activa para el mismo plan y activo.
- Las tareas del plan se copian como checklist ejecutable en cada orden generada.
- Al generar ordenes se actualiza `lastGeneratedAt` y se calcula `nextDueAt` segun la frecuencia.
- No se puede generar desde un plan inactivo.
- No se puede eliminar un plan que ya genero ordenes de trabajo.

## Dashboard y reportes

El dashboard consume datos reales desde PostgreSQL mediante el endpoint protegido `GET /api/reports/summary`.

Consultar resumen:

```powershell
curl.exe http://localhost:4000/api/reports/summary -H "Authorization: Bearer <accessToken>"
```

Respuesta esperada:

```json
{
  "metrics": {
    "openWorkOrders": 0,
    "criticalWorkOrders": 0,
    "preventiveCompliance": 100,
    "assetsActive": 0,
    "assetsInMaintenance": 0,
    "lowStockItems": 0,
    "urgentLowStockItems": 0,
    "overdueMaintenancePlans": 0,
    "upcomingMaintenancePlans": 0
  },
  "upcomingMaintenance": [
    {
      "id": "...",
      "code": "MP-BOMBA-MENSUAL",
      "name": "Mantenimiento mensual de bombas",
      "frequency": "Mensual",
      "frequencyType": "MONTHLY",
      "priority": "MEDIUM",
      "nextDueAt": "2026-06-15T08:00:00.000Z",
      "assetsCount": 2,
      "status": "UPCOMING"
    }
  ],
  "recentWorkOrders": [],
  "priorities": [
    {
      "title": "Operacion estable",
      "detail": "No hay prioridades criticas segun los datos actuales.",
      "severity": "normal"
    }
  ]
}
```

Metricas calculadas:

- Ordenes abiertas: ordenes en estado `OPEN`, `ASSIGNED`, `IN_PROGRESS` u `ON_HOLD`.
- Ordenes criticas: ordenes abiertas con prioridad `CRITICAL`.
- Cumplimiento preventivo: ordenes preventivas completadas contra ordenes preventivas creadas en el mes.
- Equipos activos: activos en estado `ACTIVE`.
- Equipos en mantenimiento: activos en estado `IN_MAINTENANCE`.
- Repuestos bajos: repuestos con `stock <= minimumStock`.
- Repuestos agotados: repuestos con `stock = 0`.
- Planes vencidos: planes activos con `nextDueAt` anterior a la fecha actual.
- Proximos mantenimientos: planes activos con `nextDueAt` dentro de los proximos 30 dias.
- Vencimientos del dashboard: listado de hasta 8 planes activos vencidos o proximos, ordenados por `nextDueAt`.

En Docker, el frontend usa `API_INTERNAL_URL=http://api:4000/api` para consultar la API desde la red interna de contenedores. Las variables `DASHBOARD_ADMIN_EMAIL` y `DASHBOARD_ADMIN_PASSWORD` solo son una ayuda de desarrollo para obtener un JWT y consumir el endpoint protegido. En produccion el dashboard debe usar la sesion real del usuario autenticado.

## Auditoria y trazabilidad

La auditoria registra eventos operativos sensibles con actor, accion, entidad, id de entidad, fecha y metadatos.

Consultar auditoria:

```powershell
curl.exe "http://localhost:4000/api/audit?page=1&limit=50" -H "Authorization: Bearer <accessToken>"
```

Filtros disponibles:

- `actorId`: usuario que ejecuto la accion.
- `action`: accion auditada, por ejemplo `WORK_ORDER_CLOSED`.
- `entityType`: entidad afectada, por ejemplo `WorkOrder`, `Asset` o `SparePart`.
- `entityId`: id de la entidad afectada.
- `from`: fecha inicial ISO.
- `to`: fecha final ISO.
- `page`: pagina, por defecto `1`.
- `limit`: registros por pagina, maximo `100`.

Eventos automaticos iniciales:

- Activos: creacion, actualizacion, activacion, retiro y eliminacion.
- Ordenes de trabajo: creacion, actualizacion, asignacion, cambio de estado, repuestos, checklist, notas de ejecucion, evidencias, cierre y cancelacion.
- Inventario: creacion de repuesto, actualizacion, ajuste de stock y eliminacion.

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
- `GET /api/assets/:id/history`
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
- `GET /api/work-orders/:id/checklist`
- `PATCH /api/work-orders/:id/checklist/:itemId`
- `PATCH /api/work-orders/:id/execution-notes`
- `GET /api/work-orders/:id/evidences`
- `POST /api/work-orders/:id/evidences`
- `PATCH /api/work-orders/:id/close`
- `PATCH /api/work-orders/:id/cancel`
- `POST /api/maintenance-plans`
- `GET /api/maintenance-plans`
- `GET /api/maintenance-plans/:id`
- `PATCH /api/maintenance-plans/:id`
- `PATCH /api/maintenance-plans/:id/activate`
- `PATCH /api/maintenance-plans/:id/deactivate`
- `POST /api/maintenance-plans/:id/tasks`
- `PUT /api/maintenance-plans/:id/tasks`
- `PATCH /api/maintenance-plans/:id/tasks/:taskId`
- `DELETE /api/maintenance-plans/:id/tasks/:taskId`
- `POST /api/maintenance-plans/:id/assets/:assetId`
- `PUT /api/maintenance-plans/:id/assets`
- `DELETE /api/maintenance-plans/:id/assets/:assetId`
- `POST /api/maintenance-plans/:id/generate-work-orders`
- `DELETE /api/maintenance-plans/:id`
- `GET /api/requests`
- `POST /api/inventory/spare-parts`
- `GET /api/inventory/spare-parts`
- `GET /api/inventory/spare-parts/low-stock`
- `GET /api/inventory/spare-parts/:id`
- `PATCH /api/inventory/spare-parts/:id`
- `PATCH /api/inventory/spare-parts/:id/stock`
- `DELETE /api/inventory/spare-parts/:id`
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
