# Base de Datos

## Motor

PostgreSQL es la base de datos principal.

Entornos:

- PostgreSQL local Windows: `localhost:5432`
- PostgreSQL Docker: `localhost:5433`

## ORM

Prisma define el modelo en:

```txt
apps/api/prisma/schema.prisma
```

Las migraciones viven en:

```txt
apps/api/prisma/migrations
```

## Base principal

```txt
maintenance_system
```

## Modelos actuales

- `User`
- `Role`
- `Permission`
- `UserRole`
- `RolePermission`
- `RefreshToken`
- `Location`
- `Asset`
- `WorkOrder`
- `MaintenancePlan`
- `ServiceRequest`
- `SparePart`
- `InventoryMovement`
- `WorkOrderPart`
- `Supplier`
- `AssetWarranty`
- `AuditEvent`

Notas recientes:

- `WorkOrderEvidence` conserva anulaciones mediante `voidedAt`, `voidedById` y `voidReason`.
- La anulacion de evidencias es logica para mantener trazabilidad; si existe archivo local, la API intenta eliminar el archivo fisico.
- `ServiceRequest` maneja flujo operativo con `status`, `priority`, fechas de revision/aprobacion/rechazo/cierre/conversion y referencia opcional a `workOrderId`.
- `InventoryMovement` registra Kardex de repuestos con tipo, cantidad, stock anterior, stock nuevo, motivo, referencia, orden relacionada y usuario que ejecuta el movimiento.
- `Asset` puede tener `supplierId` como proveedor principal.
- `AssetWarranty` registra garantias por activo, proveedor opcional, vigencia, poliza, estado y terminos.

## Crear migracion en desarrollo

```powershell
npm run db:migrate -w apps/api -- --name nombre_de_la_migracion
```

## Aplicar migraciones en Docker/produccion

```powershell
docker compose exec api npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
```

## Generar cliente Prisma

```powershell
npm run prisma:generate
```

## Ejecutar seed

Local:

```powershell
npm run db:seed -w apps/api
```

Docker:

```powershell
docker compose exec api sh -c "cd apps/api && npm run db:seed"
```

## Convenciones

- No editar la base manualmente si el cambio pertenece al modelo.
- Todo cambio estructural debe quedar como migracion Prisma.
- No subir passwords reales en `.env`.
- `pws_bd.txt` es local y esta ignorado por Git.
