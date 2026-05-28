# Roadmap Funcional

## Vision de producto

MaintenanceSystem debe ser una plataforma CMMS/EAM general para gestionar mantenimiento de cualquier activo fisico, tecnologico, operativo o de infraestructura.

El concepto "equipo" se entiende como cualquier activo que requiera seguimiento, mantenimiento, inspeccion, reparacion, control documental y trazabilidad historica.

## Fase 1 - Base tecnica

Estado: completada como base inicial.

- Monorepo con NestJS y Next.js.
- PostgreSQL y Prisma.
- Docker Compose.
- Autenticacion JWT.
- Refresh token.
- Usuario administrador inicial.
- Documentacion operativa.

## Fase 2 - Usuarios, roles e invitaciones

Estado: siguiente bloque recomendado junto con modelo flexible de activos.

- CRUD de usuarios.
- Roles administrativos.
- Permisos por accion.
- Registro por invitacion con token.
- Cambio de password.
- Recuperacion de password.

## Fase 3 - Activos/equipos generales

- CRUD de activos.
- Categorias de activos.
- Tipos de activos.
- Campos personalizados por tipo.
- Criticidad.
- Responsable.
- Ubicaciones jerarquicas.
- Estados operativos.
- Fotos/documentos.
- Garantias.
- Proveedores asociados.
- Codigo QR.
- Historial del activo.

## Fase 4 - Ordenes de trabajo

- Crear orden.
- Asignar tecnico.
- Estados de ciclo de vida.
- Prioridades.
- Evidencias.
- Cierre tecnico.
- Repuestos usados.

## Fase 5 - Mantenimiento preventivo

- Planes preventivos.
- Frecuencias.
- Generacion automatica de ordenes.
- Calendario de proximos mantenimientos.

## Fase 6 - Inventario

- Repuestos.
- Entradas y salidas.
- Stock minimo.
- Alertas.
- Costos.

## Fase 7 - Reportes

- Dashboard real.
- Cumplimiento preventivo.
- Ordenes vencidas.
- Costos por activo.
- MTTR.
- MTBF.
- Exportacion Excel/PDF.

## Fase 8 - Produccion

- Variables por entorno.
- Backups.
- Observabilidad.
- Logs centralizados.
- Hardening de seguridad.
- CI/CD.
