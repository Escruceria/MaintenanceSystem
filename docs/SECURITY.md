# Seguridad

## Principios

- No registro publico libre.
- Passwords hasheados.
- Refresh tokens hasheados y revocables.
- Rutas protegidas por JWT.
- Configuracion sensible fuera de Git.
- Auditoria para acciones criticas.

## Secretos

No subir:

- `.env`
- `.env.local`
- `pws_bd.txt`
- dumps con datos reales
- capturas con datos sensibles

## Passwords

Los passwords se guardan con hash usando `bcryptjs`.

Nunca se debe devolver `passwordHash` desde endpoints.

## Tokens

Access token:

- Corta duracion.
- Se envia como Bearer token.

Refresh token:

- Mayor duracion.
- Se guarda hasheado.
- Se revoca en logout.
- Se rota en cada refresh.

## Roles iniciales

Rol actual:

- `ADMIN`

Permisos iniciales:

- `users:read`
- `users:write`
- `assets:read`
- `assets:write`
- `work-orders:read`
- `work-orders:write`
- `inventory:read`
- `inventory:write`
- `reports:read`
- `settings:manage`

## Pendientes de seguridad

- Registro por invitacion.
- Guard de permisos por endpoint.
- Politica de cambio de password.
- Recuperacion de password por token.
- Auditoria de login/logout.
- Rate limit para auth.
- Configuracion CORS por entorno.

