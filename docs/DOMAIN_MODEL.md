# Modelo de Dominio - MaintenanceSystem

## Vision general

MaintenanceSystem debe ser una plataforma profesional de gestion integral de mantenimiento, aplicable a empresas, instituciones educativas, entidades publicas, hospitales, talleres, industrias, edificios, municipios y cualquier organizacion que necesite controlar sus activos y reducir fallas operativas.

La plataforma no debe limitarse al mantenimiento de equipos de computo. Debe servir para administrar mantenimiento preventivo, correctivo, predictivo e inspecciones periodicas sobre cualquier activo fisico, tecnologico, operativo o de infraestructura.

## Definicion de equipo/activo

En MaintenanceSystem, un "equipo" no representa unicamente un computador o dispositivo tecnologico.

Un equipo representa cualquier activo fisico, tecnologico, operativo, biomedico, vehicular, industrial, locativo o de infraestructura que requiera seguimiento, mantenimiento, inspeccion, reparacion, control documental y trazabilidad historica.

## Entidad tecnica central

La entidad tecnica central del sistema debe ser:

```txt
Asset
```

En la interfaz se puede usar el texto "Activos/Equipos" para facilitar la comprension del usuario final, pero a nivel de modelo, servicios y API el concepto principal debe ser `Asset`.

## Tipos de activos soportados

La plataforma debe poder representar, entre otros:

- Equipos de computo y tecnologia.
- Servidores, redes, impresoras y perifericos.
- Equipos electricos y electronicos.
- Maquinaria industrial.
- Herramientas y equipos operativos.
- Equipos biomedicos o de laboratorio.
- Vehiculos.
- Infraestructura fisica, locativa o institucional.
- Sistemas de iluminacion.
- Sistemas de climatizacion.
- Sistemas de seguridad.
- Sistemas de bombeo.
- Sistemas de energia.
- Otros activos tecnicos configurables.

## Campos comunes de un activo

Todo activo debe poder manejar campos comunes como:

- Codigo.
- Nombre.
- Descripcion.
- Categoria.
- Tipo.
- Ubicacion.
- Responsable.
- Estado operativo.
- Fabricante.
- Modelo.
- Numero de serie.
- Fecha de adquisicion.
- Vida util estimada.
- Criticidad.
- Proveedor.
- Garantia.
- Documentos asociados.
- Fotografias.
- Historial de mantenimientos.
- Planes de mantenimiento.
- Ordenes de trabajo relacionadas.

## Campos personalizados por tipo de activo

La plataforma debe permitir definir campos personalizados por tipo de activo, sin modificar el nucleo del sistema.

Ejemplos:

### Equipo de computo

- Procesador.
- Memoria RAM.
- Sistema operativo.
- Capacidad de disco.
- Direccion IP.

### Vehiculo

- Placa.
- Kilometraje.
- Tipo de combustible.
- Numero de motor.
- Numero de chasis.

### Maquina industrial

- Horas de operacion.
- Potencia.
- Capacidad.
- Parametros tecnicos.
- Ciclos de trabajo.

### Equipo biomedico

- Registro sanitario.
- Riesgo biomedico.
- Calibracion requerida.
- Ultima calibracion.

### Infraestructura

- Area.
- Material principal.
- Capacidad instalada.
- Condicion estructural.

## Clasificacion flexible

La clasificacion debe soportar:

- `AssetCategory`: agrupacion amplia, por ejemplo tecnologia, vehiculos, infraestructura, maquinaria, biomedico.
- `AssetType`: tipo especifico dentro de una categoria, por ejemplo laptop, bomba, luminaria, ambulancia, aire acondicionado.
- `AssetCustomFieldDefinition`: definicion de campos configurables por tipo.
- `AssetCustomFieldValue`: valores reales por activo.

## Historial y trazabilidad

Todo activo debe conservar trazabilidad historica:

- Ordenes de trabajo.
- Solicitudes de servicio.
- Mantenimientos preventivos.
- Correctivos.
- Predictivos.
- Inspecciones.
- Cambios de estado.
- Cambio de ubicacion.
- Cambio de responsable.
- Evidencias fotograficas.
- Documentos.
- Repuestos utilizados.
- Costos.
- Auditoria de acciones.

## Mantenimiento soportado

MaintenanceSystem debe soportar:

- Mantenimiento preventivo.
- Mantenimiento correctivo.
- Mantenimiento predictivo.
- Inspecciones periodicas.
- Calibraciones.
- Revisiones normativas.
- Actividades por uso, tiempo, kilometraje, horas o ciclos.

## Principios de diseno del dominio

- No crear modelos rigidos por cada tipo de activo.
- No limitar el lenguaje del sistema a soporte tecnico de computadores.
- Mantener `Asset` como nucleo transversal.
- Usar categorias, tipos y campos personalizados para adaptarse a diferentes sectores.
- Mantener historial y auditoria como capacidades transversales.
- Permitir crecimiento futuro hacia IoT, indicadores, alertas y automatizacion.

## Lenguaje recomendado

Usar:

- Activos.
- Equipos.
- Infraestructura.
- Ordenes de trabajo.
- Planes de mantenimiento.
- Inspecciones.
- Solicitudes.
- Inventario.
- Trazabilidad.

Evitar lenguaje limitado como:

- Soporte tecnico.
- Hardware solamente.
- Computadores solamente.
- Tickets de TI como concepto central.

