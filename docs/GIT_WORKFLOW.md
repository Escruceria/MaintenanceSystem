# Flujo Git

## Repositorio remoto

```txt
https://github.com/Escruceria/MaintenanceSystem.git
```

## Rama principal

```txt
main
```

## Ver estado

```powershell
git status --short --branch
```

## Ver ultimos commits

```powershell
git log --oneline --decorate -5
```

## Crear commit

```powershell
git add .
git commit -m "Mensaje claro del cambio"
```

## Subir cambios

```powershell
git push
```

## Traer cambios

```powershell
git pull
```

## Reglas del proyecto

- No subir `.env`.
- No subir `pws_bd.txt`.
- No subir `node_modules`.
- No subir capturas de `img`.
- Hacer commits pequenos y descriptivos.
- Verificar build antes de cambios grandes.

## Commits iniciales

- `576a1c3 Initial MaintenanceSystem scaffold`
- `3bff04e Configure Docker stack`
- `149d9fa Add Docker runbook`
- `8e0c780 Document Docker validation commands`
- `1bbf83e Fix bcryptjs seed in Docker`

