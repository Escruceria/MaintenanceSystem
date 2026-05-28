# Autenticacion y Usuarios

## Enfoque

MaintenanceSystem no debe permitir registro publico libre.

El flujo recomendado es:

1. Un administrador crea o invita un usuario.
2. El sistema genera un token de invitacion.
3. El usuario completa su registro con ese token.
4. El token expira y no puede reutilizarse.

Este flujo evita cuentas no autorizadas.

## Implementado actualmente

Endpoints:

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/invitations`
- `GET /api/invitations`
- `POST /api/invitations/accept`
- `POST /api/invitations/:id/cancel`

## Usuario administrador inicial

Credenciales de desarrollo:

```txt
Email: admin@maintenance.local
Password: Admin123*
```

Estas credenciales solo son para desarrollo. En produccion deben cambiarse.

## Tokens

El login devuelve:

- `accessToken`: token JWT de corta duracion.
- `refreshToken`: token seguro para renovar sesion.
- `tokenType`: `Bearer`.
- `expiresIn`: duracion en segundos del access token.

Las rutas protegidas requieren:

```txt
Authorization: Bearer <accessToken>
```

## Refresh token

Los refresh tokens se guardan hasheados en la tabla `RefreshToken`.

Cuando se usa `/api/auth/refresh`:

- El refresh token anterior se revoca.
- Se genera un nuevo access token.
- Se genera un nuevo refresh token.

## Logout

`POST /api/auth/logout` revoca el refresh token recibido.

## Registro seguro por invitacion

El registro seguro por invitacion ya cuenta con:

- Tabla `UserInvitation`.
- Token aleatorio hasheado.
- Fecha de expiracion.
- Estados `PENDING`, `ACCEPTED`, `CANCELLED` y `EXPIRED`.
- Endpoint protegido para crear invitacion.
- Endpoint publico para aceptar una invitacion valida.
- Creacion de password por el usuario invitado.
- Asignacion opcional de rol inicial.

Reglas:

- No existe endpoint de registro publico libre.
- El token plano solo se entrega al crear la invitacion y no se guarda en base de datos.
- Si se crea una nueva invitacion para el mismo correo, las invitaciones pendientes anteriores se cancelan.
- Una invitacion aceptada, cancelada o expirada no puede reutilizarse.
- En produccion, el token debe enviarse por correo mediante un servicio transaccional.

## Permisos actuales

Las invitaciones protegidas usan:

- `users:write` para crear y cancelar invitaciones.
- `users:read` para listar invitaciones.

Los modulos operativos usan `JwtAuthGuard` y `PermissionsGuard`.

Regla general:

- Sin token: `401 Unauthorized`.
- Con token valido pero sin permiso: `403 Forbidden`.
- Con token valido y permiso requerido: acceso permitido.

La matriz completa esta documentada en `docs/PERMISSIONS.md`.
