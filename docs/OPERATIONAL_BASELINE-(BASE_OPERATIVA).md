# Base Operativa - MaintenanceSystem

Fecha de revision: 2026-06-16.

Este documento resume la validacion diaria de la base operativa del proyecto y el estado de los bloques funcionales ya construidos.

## Estado actual validado

- API NestJS: operativa en `http://localhost:4000`.
- Health API: `GET /api/health` responde `status: ok`.
- Endpoint raiz API: `GET /` responde estado operativo y enlaces a health y Swagger.
- Swagger UI: disponible en `http://localhost:4000/docs`.
- OpenAPI JSON: disponible en `http://localhost:4000/docs-json`.
- Docker: servicios `api`, `web` y `postgres` levantados.
- PostgreSQL Docker: servicio `postgres` saludable en `localhost:5433`.
- Prisma schema: valido.
- Migraciones Prisma: base de datos al dia, sin migraciones pendientes.
- Frontend Next.js: disponible en `http://localhost:3000`.
- Git: cambios del usuario en `README.md` deben mantenerse fuera de commits automaticos.

## Validaciones ejecutadas

```powershell
docker compose ps
docker compose exec api npx prisma migrate status --schema=apps/api/prisma/schema.prisma
docker compose exec api npx prisma validate --schema=apps/api/prisma/schema.prisma
Invoke-RestMethod -Uri http://localhost:4000/
Invoke-RestMethod -Uri http://localhost:4000/api/health
Invoke-WebRequest -Uri http://localhost:4000/docs -UseBasicParsing
Invoke-WebRequest -Uri http://localhost:4000/docs-json -UseBasicParsing
npm run build -w apps/api
npm run build -w apps/web
```

Resultado esperado:

- `docker compose ps`: `api`, `web` y `postgres` en estado `Up`; `postgres` debe mostrar `healthy`.
- `prisma migrate status`: `Database schema is up to date!`.
- `prisma validate`: `The schema ... is valid`.
- API y Swagger: HTTP 200.
- Builds: sin errores.

## Checklist diaria

1. Confirmar estado de Git:

```powershell
git status --short
```

2. Levantar o reconstruir el stack:

```powershell
docker compose up -d --build
```

3. Confirmar contenedores:

```powershell
docker compose ps
```

4. Revisar migraciones:

```powershell
docker compose exec api npx prisma migrate status --schema=apps/api/prisma/schema.prisma
```

5. Validar schema Prisma:

```powershell
docker compose exec api npx prisma validate --schema=apps/api/prisma/schema.prisma
```

6. Validar API:

```powershell
Invoke-RestMethod -Uri http://localhost:4000/
Invoke-RestMethod -Uri http://localhost:4000/api/health
```

7. Validar Swagger:

```powershell
Invoke-WebRequest -Uri http://localhost:4000/docs -UseBasicParsing
Invoke-WebRequest -Uri http://localhost:4000/docs-json -UseBasicParsing
```

8. Validar frontend:

```powershell
Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing
```

9. Compilar antes de cerrar bloque:

```powershell
npm run build -w apps/api
npm run build -w apps/web
```

10. Revisar cambios para commit selectivo:

```powershell
git status --short
git diff --stat
```

## Bloques funcionales revisados

### Archivos y evidencias

Estado: implementado.

Alcance actual:

- Evidencias por orden de trabajo.
- Tipos de evidencia: foto, documento y nota.
- Carga de archivos reales en almacenamiento local.
- Descarga de evidencias.
- Anulacion logica de evidencias con motivo, usuario y fecha.
- Auditoria de carga, descarga y anulacion.

Pendiente futuro:

- Politica avanzada de retencion.
- Almacenamiento externo opcional tipo S3/Blob.
- Antivirus o validacion profunda de archivos.

### Historial avanzado del activo

Estado: implementado inicialmente.

Alcance actual:

- Historial por activo con ordenes asociadas.
- Tipos de mantenimiento: preventivo, correctivo, predictivo e inspeccion.
- Evidencias registradas por orden.
- Repuestos usados.
- Tecnicos asignados.
- Fechas de inicio, cierre y actualizacion.
- Estado historico del activo desde ordenes, evidencias y movimientos relacionados.

Pendiente futuro:

- Linea de tiempo visual en frontend.
- Historial de cambios de campos del activo.
- Indicadores MTTR, MTBF y disponibilidad.

### Solicitudes de servicio

Estado: implementado.

Alcance actual:

- Creacion, consulta y actualizacion de solicitudes.
- Flujo de estados: abierta, en revision, aprobada, rechazada, convertida y cerrada.
- Asociacion opcional con activo y solicitante.
- Conversion de solicitud aprobada a orden de trabajo.
- Auditoria del flujo.

Pendiente futuro:

- Portal de solicitante.
- Notificaciones por cambio de estado.
- SLA por tipo de solicitud.

### Flujo completo de ordenes

Estado: implementado.

Alcance actual:

- Crear, listar, consultar y actualizar ordenes.
- Asignar tecnico.
- Cambiar estados.
- Cerrar orden con notas finales y recomendaciones.
- Asociar activo.
- Asociar repuestos y consumir inventario al cierre.
- Ejecutar checklist.
- Adjuntar evidencias.
- Relacion con planes de mantenimiento y solicitudes.

Pendiente futuro:

- Reglas SLA.
- Firma digital de cierre.
- Costos de mano de obra y repuestos por orden.

### Inventario avanzado

Estado: implementado.

Alcance actual:

- CRUD de repuestos.
- Stock minimo.
- Ajustes de stock.
- Kardex con movimientos `INITIAL`, `IN`, `OUT`, `ADJUSTMENT` y `WORK_ORDER_CONSUMPTION`.
- Consumo automatico de repuestos al cerrar ordenes.
- Auditoria de movimientos.

Pendiente futuro:

- Bodegas multiples.
- Costos promedio y valorizacion.
- Compras y recepciones.

### Proveedores y garantias

Estado: implementado.

Alcance actual:

- CRUD de proveedores.
- Activacion y desactivacion de proveedores.
- Asociacion de proveedor principal a activos.
- Garantias por activo con proveedor opcional.
- Consulta de garantias por activo.
- Garantias proximas a vencer.
- Cancelacion de garantias.
- Auditoria del flujo.

Pendiente futuro:

- Adjuntos de polizas.
- Alertas automaticas de vencimiento.
- Contactos multiples por proveedor.

### Planes de mantenimiento avanzados

Estado: implementado.

Alcance actual:

- CRUD de planes.
- Asociacion de planes a activos.
- Frecuencias diaria, semanal, mensual, anual y por fecha.
- Tareas/checklist del plan.
- Generacion de ordenes preventivas desde el plan.
- Prevencion de duplicados activos por plan y activo.
- Vencimientos y proximos mantenimientos visibles en dashboard.

Pendiente futuro:

- Calendario dedicado.
- Generacion automatica programada.
- Ventanas de mantenimiento y excepciones.

### Dashboard gerencial

Estado: implementado y ampliado.

Alcance actual:

- Datos reales desde `GET /api/reports/summary`.
- Ordenes abiertas, criticas, totales y cerradas del mes.
- Cumplimiento preventivo.
- Activos activos, en mantenimiento, fuera de servicio y retirados.
- Inventario bajo, agotado, total de items y unidades.
- Solicitudes abiertas y pendientes.
- Proveedores activos.
- Garantias vigentes, proximas y vencidas.
- Distribuciones por estado/tipo.
- Proximos mantenimientos.
- Garantias proximas.
- Movimientos recientes de inventario.

Pendiente futuro:

- Graficas visuales.
- Filtros por sede, categoria, criticidad y rango de fechas.
- Exportaciones gerenciales.
- Indicadores MTTR, MTBF, disponibilidad y costos.

## Criterios para continuar desarrollo

- No avanzar a un nuevo bloque si hay migraciones pendientes.
- No hacer commits con `README.md` si contiene cambios del usuario.
- No subir `.env`, `pws_bd.txt`, `storage`, `img`, `dist`, `.next` ni `node_modules`.
- Todo cambio estructural de base de datos debe tener migracion Prisma.
- Todo endpoint sensible debe estar protegido por JWT y permiso especifico.
- Todo bloque terminado debe quedar documentado y validado con build antes del commit.
