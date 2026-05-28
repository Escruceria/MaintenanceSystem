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

## Siguiente mejora recomendada

Agregar registro por invitacion:

- Tabla `UserInvitation`.
- Token aleatorio hasheado.
- Fecha de expiracion.
- Estado usado/no usado.
- Endpoint para aceptar invitacion.
- Envio futuro por correo.

