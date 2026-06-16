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
- CRUD jerarquico de ubicaciones.
- CRUD real de activos/equipos.
- Ordenes de trabajo operativas.
- CRUD de inventario/repuestos.
- Dashboard conectado a datos reales desde API.
- Planes de mantenimiento preventivo operativos.
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
- Dashboard gerencial avanzado con graficas, filtros y exportaciones.

## Orden de implementacion aprobado

El desarrollo operativo continuara en este orden:

1. Invitaciones de usuario: registro seguro por token, sin registro publico.
2. Roles y permisos reales: guards por permiso, no solo JWT.
3. CRUD de usuarios: crear, listar, activar/desactivar y asignar roles. Estado: implementado.
4. CRUD de ubicaciones: sedes, areas y jerarquias. Estado: implementado.
5. CRUD de activos/equipos: codigo, nombre, serial, marca, modelo, estado y ubicacion. Estado: implementado.
6. Ordenes de trabajo: crear, asignar, cambiar estados y cerrar. Estado: implementado.
7. Dashboard conectado a datos reales desde API. Estado: implementado.

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
- `GET /api/assets`. Estado: implementado.
- `POST /api/assets`. Estado: implementado.
- `GET /api/assets/:id`. Estado: implementado.
- `PATCH /api/assets/:id`. Estado: implementado.
- `GET /api/assets/:id/history`

## Fase 3.1 - CRUD de activos/equipos

Objetivo: administrar activos reales conectados a PostgreSQL, asociados a ubicaciones y preparados para ordenes de trabajo.

Entregables:

- Crear activo/equipo. Estado: implementado.
- Listar activos/equipos. Estado: implementado.
- Consultar activo por id. Estado: implementado.
- Consultar historial avanzado del activo. Estado: implementado.
- Actualizar codigo, nombre, descripcion, serial, marca, modelo, QR, estado y ubicacion. Estado: implementado.
- Activar activo. Estado: implementado.
- Retirar activo. Estado: implementado.
- Eliminar activo sin ordenes ni solicitudes asociadas. Estado: implementado.

Reglas implementadas:

- Codigo unico normalizado en mayusculas.
- QR unico y generado automaticamente si no se envia.
- Validacion de ubicacion existente.
- Bloqueo de eliminacion cuando existan ordenes o solicitudes asociadas.
- Respuesta con conteo de ordenes, solicitudes y ubicacion resumida.
- El historial del activo consolida ordenes, tipos de mantenimiento, evidencias, repuestos, tecnicos, fechas y linea de tiempo operativa.

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

## Fase 4.2 - CRUD de ubicaciones

Objetivo: administrar sedes, edificios, pisos, areas, almacenes y puntos tecnicos de forma jerarquica.

Entregables:

- Crear ubicacion. Estado: implementado.
- Listar ubicaciones. Estado: implementado.
- Consultar ubicacion por id. Estado: implementado.
- Ver arbol jerarquico. Estado: implementado.
- Actualizar nombre, codigo, descripcion, tipo, estado y padre. Estado: implementado.
- Activar ubicacion. Estado: implementado.
- Desactivar ubicacion. Estado: implementado.
- Eliminar ubicacion sin hijos ni activos. Estado: implementado.

Reglas implementadas:

- Codigo unico normalizado en mayusculas.
- Padre obligatorio solo cuando se requiere jerarquia.
- Validacion de padre existente.
- Prevencion de ciclos jerarquicos.
- Bloqueo de eliminacion cuando existan sububicaciones o activos asociados.

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

- Crear orden. Estado: implementado.
- Asignar tecnico. Estado: implementado.
- Cambiar estado. Estado: implementado.
- Registrar tiempos de inicio y cierre. Estado: implementado.
- Asociar repuestos. Estado: implementado.
- Checklist ejecutable por orden. Estado: implementado.
- Marcar tarea realizada, no realizada o no aplica. Estado: implementado.
- Registrar observacion, usuario ejecutor y fecha por tarea. Estado: implementado.
- Registrar notas finales y recomendaciones de ejecucion. Estado: implementado.
- Registrar evidencias de mantenimiento como observaciones, fotos o documentos. Estado: implementado.
- Subir archivos reales como evidencias de ordenes. Estado: implementado.
- Descargar archivos de evidencias locales. Estado: implementado.
- Anular evidencias con trazabilidad y auditoria. Estado: implementado.
- Cerrar orden. Estado: implementado.
- Auditar cambios operativos de ordenes. Estado: implementado.

Reglas implementadas:

- Generacion automatica de numero de orden.
- Validacion de activo existente.
- Validacion de tecnico activo.
- Validacion de repuestos existentes.
- Descuento de stock al cerrar.
- Bloqueo de modificaciones en ordenes completadas o canceladas.
- Bloqueo de cierre cuando no hay stock suficiente.
- Las ordenes generadas desde planes copian las tareas del plan como checklist ejecutable.
- El cierre valida que todas las tareas obligatorias esten completadas.
- Las notas finales y recomendaciones pueden guardarse durante la ejecucion o al cerrar.
- Las evidencias `PHOTO` y `DOCUMENT` pueden registrarse con `fileUrl` externo o mediante carga real de archivo.
- La carga real guarda archivos en `storage/evidences/work-orders/<workOrderId>` o en `UPLOAD_ROOT`.
- Docker persiste las evidencias en el volumen `evidence-storage`.
- La API publica archivos cargados bajo `/uploads/...`.
- La carga real acepta imagenes `jpg`, `png`, `webp`, documentos `pdf`, Word y Excel, con limite de 10 MB.
- Las evidencias conservan tipo, titulo, descripcion, archivo relacionado, usuario que registra y fecha.
- La descarga de evidencias locales registra evento de auditoria `WORK_ORDER_EVIDENCE_DOWNLOADED`.
- La anulacion de evidencias conserva el registro en base de datos con usuario, fecha y motivo.
- La anulacion de evidencias locales intenta retirar el archivo fisico del almacenamiento.
- Las evidencias anuladas no se pueden descargar.
- No se registran notas ni evidencias sobre ordenes canceladas.
- Las acciones operativas sensibles generan eventos de auditoria con actor, accion, entidad, id y metadatos.
- La carga real de archivos genera evento de auditoria `WORK_ORDER_EVIDENCE_FILE_UPLOADED`.
- La anulacion de evidencias genera evento de auditoria `WORK_ORDER_EVIDENCE_VOIDED`.

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

- CRUD de planes de mantenimiento. Estado: implementado.
- Plan asociado a uno o varios activos. Estado: implementado.
- Endpoints dedicados para asociar, reemplazar y quitar activos de un plan. Estado: implementado.
- Frecuencia tipada diaria, semanal, mensual, anual o por fecha. Estado: implementado.
- Tareas/checklist del plan. Estado: implementado.
- Endpoints dedicados para agregar, reemplazar, actualizar y eliminar tareas del checklist. Estado: implementado.
- Generacion de ordenes preventivas desde un plan. Estado: implementado.
- Prevencion de orden duplicada activa por plan y activo. Estado: implementado.
- Calculo de proxima fecha `nextDueAt` con `intervalDays`. Estado: implementado.
- Calendario de proximos mantenimientos. Estado: implementado en dashboard.

Reglas implementadas:

- Codigo unico normalizado en mayusculas.
- Frecuencia controlada con `frequencyType`.
- Planes por fecha requieren `nextDueAt`.
- Solo generar ordenes desde planes activos.
- Solo generar ordenes para activos activos.
- Bloquear eliminacion de planes con ordenes generadas.
- Mantener trazabilidad de la orden generada mediante `maintenancePlanId`.

## Fase 8 - Inventario y proveedores

Objetivo: controlar repuestos, consumibles y proveedores.

Entregables:

- CRUD de repuestos. Estado: implementado.
- Stock minimo. Estado: implementado.
- Ajustes de stock. Estado: implementado.
- Movimientos de inventario y Kardex por repuesto. Estado: implementado.
- Stock inicial como movimiento `INITIAL`. Estado: implementado.
- Salida por orden de trabajo como movimiento `WORK_ORDER_CONSUMPTION`. Estado: implementado.
- Proveedores.
- Costos.
- Alertas de inventario por bajo stock. Estado: implementado como endpoint.

Reglas implementadas:

- SKU unico normalizado en mayusculas.
- Unidad normalizada en mayusculas.
- Stock y stock minimo sin valores negativos.
- Ajustes de stock sin permitir inventario negativo.
- Todo movimiento conserva stock anterior, cantidad, stock nuevo, motivo, referencia, usuario y fecha.
- Los movimientos manuales permitidos son entrada, salida y ajuste.
- Los consumos de ordenes generan movimiento automatico `WORK_ORDER_CONSUMPTION`.
- Bloqueo de eliminacion cuando el repuesto ya fue usado en ordenes.

## Fase 8.1 - Solicitudes de servicio

Objetivo: registrar necesidades de mantenimiento antes de crear ordenes de trabajo y convertir solicitudes aprobadas en ordenes reales.

Estado actual:

- Crear solicitudes asociadas opcionalmente a activos. Estado: implementado.
- Listar y consultar solicitudes. Estado: implementado.
- Actualizar solicitudes no terminales. Estado: implementado.
- Marcar solicitudes en revision. Estado: implementado.
- Aprobar, rechazar y cerrar solicitudes. Estado: implementado.
- Convertir solicitudes aprobadas en ordenes de trabajo. Estado: implementado.
- Auditar creacion, actualizacion, cambios de estado y conversion. Estado: implementado.

Reglas implementadas:

- Estados: `OPEN`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `CONVERTED`, `CLOSED`.
- Estados terminales: `REJECTED`, `CONVERTED`, `CLOSED`.
- Solo solicitudes aprobadas pueden convertirse en orden.
- La conversion exige activo activo asociado.
- La conversion crea orden y actualiza solicitud en una misma transaccion.
- La solicitud convertida conserva referencia a la orden generada.

## Fase 9 - Dashboard e indicadores

Objetivo: mostrar indicadores reales desde PostgreSQL.

Indicadores:

- Ordenes abiertas. Estado: implementado.
- Ordenes criticas. Estado: implementado.
- Cumplimiento preventivo mensual. Estado: implementado.
- Equipos activos. Estado: implementado.
- Equipos en mantenimiento. Estado: implementado.
- Repuestos bajo minimo. Estado: implementado.
- Repuestos agotados. Estado: implementado.
- Ordenes recientes. Estado: implementado.
- Prioridades operativas derivadas de los datos. Estado: implementado.
- Planes de mantenimiento vencidos. Estado: implementado.
- Proximos mantenimientos a 30 dias. Estado: implementado.
- Tabla de vencimientos y proximos mantenimientos. Estado: implementado.
- Activos por categoria.
- Activos criticos.
- Activos fuera de servicio.
- Ordenes vencidas.
- MTTR.
- MTBF.
- Disponibilidad.
- Costos por activo.

Entregables implementados:

- Servicio `ReportsService` con consultas Prisma reales.
- Endpoint `GET /api/reports/summary` protegido por `reports:read`.
- Dashboard Next.js consumiendo la API.
- Conexion interna Docker entre `web` y `api` mediante `API_INTERNAL_URL`.

Pendiente futuro:

- Usar sesion real del usuario autenticado en frontend.
- Agregar graficas, filtros por sede, fechas, categoria y criticidad.
- Exportacion de reportes.
- Indicadores avanzados cuando existan planes, medidores, costos e historial suficiente.

## Fase 10 - Produccion

Objetivo: endurecer plataforma para uso real.

Entregables:

- Variables por entorno.
- Backups.
- Rate limit.
- Logs estructurados.
- Auditoria completa. Estado: implementado inicialmente para activos, ordenes e inventario.
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
