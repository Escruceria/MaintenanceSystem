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

## Rutas protegidas actuales

- `GET /api/users`
- `GET /api/invitations`
- `POST /api/invitations`
- `POST /api/invitations/:id/cancel`
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
Con token valido pero sin permiso deben responder `403`.

La matriz de permisos esta documentada en `docs/PERMISSIONS.md`.

## Convenciones futuras

- Usar DTOs con `class-validator`.
- Documentar endpoints con Swagger.
- Validar permisos por accion antes de exponer operaciones de escritura.
- No devolver `passwordHash` ni tokens hasheados.
