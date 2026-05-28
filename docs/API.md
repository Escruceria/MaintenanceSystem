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

## Rutas protegidas actuales

- `GET /api/users`
- `GET /api/assets`
- `GET /api/locations`
- `GET /api/work-orders`
- `GET /api/maintenance-plans`
- `GET /api/requests`
- `GET /api/inventory/spare-parts`
- `GET /api/suppliers`
- `GET /api/reports/summary`
- `GET /api/audit`

Sin token deben responder `401`.

## Convenciones futuras

- Usar DTOs con `class-validator`.
- Documentar endpoints con Swagger.
- Validar permisos por accion antes de exponer operaciones de escritura.
- No devolver `passwordHash` ni tokens hasheados.

