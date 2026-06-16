import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const permissions = {
  "users:read": "Leer usuarios e invitaciones",
  "users:write": "Crear, actualizar, activar, desactivar e invitar usuarios",
  "roles:read": "Leer roles y permisos",
  "roles:write": "Administrar roles y permisos",
  "locations:read": "Leer sedes, areas y ubicaciones",
  "locations:write": "Crear y actualizar sedes, areas y ubicaciones",
  "assets:read": "Leer activos y equipos",
  "assets:write": "Crear y actualizar activos y equipos",
  "work-orders:read": "Leer ordenes de trabajo",
  "work-orders:write": "Crear y actualizar ordenes de trabajo",
  "work-orders:assign": "Asignar ordenes de trabajo",
  "work-orders:execute": "Ejecutar checklist, notas y avance operativo de ordenes",
  "work-orders:close": "Cerrar ordenes de trabajo",
  "work-orders:evidences:read": "Leer y descargar evidencias de ordenes de trabajo",
  "work-orders:evidences:write": "Registrar y cargar evidencias de ordenes de trabajo",
  "work-orders:evidences:void": "Anular evidencias de ordenes de trabajo",
  "maintenance-plans:read": "Leer planes de mantenimiento",
  "maintenance-plans:write": "Crear y actualizar planes de mantenimiento",
  "requests:read": "Leer solicitudes de servicio",
  "requests:write": "Crear y actualizar solicitudes de servicio",
  "requests:review": "Revisar, aprobar, rechazar y cerrar solicitudes de servicio",
  "requests:convert": "Convertir solicitudes aprobadas en ordenes de trabajo",
  "inventory:read": "Leer inventario y repuestos",
  "inventory:write": "Crear y actualizar inventario y repuestos",
  "inventory:adjust": "Ajustar existencias de inventario",
  "inventory:move": "Registrar movimientos de Kardex",
  "suppliers:read": "Leer proveedores",
  "suppliers:write": "Crear y actualizar proveedores",
  "warranties:read": "Leer garantias de activos",
  "warranties:write": "Crear, actualizar y cancelar garantias de activos",
  "reports:read": "Leer reportes e indicadores",
  "reports:export": "Exportar reportes",
  "audit:read": "Leer auditoria del sistema",
  "settings:manage": "Administrar configuracion del sistema",
};

const roleDefinitions = {
  ADMIN: {
    description: "Administrador total del sistema",
    permissions: Object.keys(permissions),
  },
  MAINTENANCE_MANAGER: {
    description: "Responsable de mantenimiento",
    permissions: [
      "users:read",
      "locations:read",
      "locations:write",
      "assets:read",
      "assets:write",
      "work-orders:read",
      "work-orders:write",
      "work-orders:assign",
      "work-orders:execute",
      "work-orders:close",
      "work-orders:evidences:read",
      "work-orders:evidences:write",
      "work-orders:evidences:void",
      "maintenance-plans:read",
      "maintenance-plans:write",
      "requests:read",
      "requests:write",
      "requests:review",
      "requests:convert",
      "inventory:read",
      "suppliers:read",
      "warranties:read",
      "warranties:write",
      "reports:read",
    ],
  },
  TECHNICIAN: {
    description: "Tecnico de mantenimiento",
    permissions: [
      "locations:read",
      "assets:read",
      "work-orders:read",
      "work-orders:execute",
      "work-orders:evidences:read",
      "work-orders:evidences:write",
      "requests:read",
      "inventory:read",
    ],
  },
  REQUESTER: {
    description: "Usuario solicitante",
    permissions: ["assets:read", "requests:read", "requests:write"],
  },
  INVENTORY_MANAGER: {
    description: "Responsable de inventario",
    permissions: [
      "inventory:read",
      "inventory:write",
      "inventory:adjust",
      "inventory:move",
      "suppliers:read",
      "suppliers:write",
      "warranties:read",
      "warranties:write",
      "reports:read",
    ],
  },
  AUDITOR: {
    description: "Auditor del sistema",
    permissions: [
      "users:read",
      "locations:read",
      "assets:read",
      "work-orders:read",
      "maintenance-plans:read",
      "requests:read",
      "inventory:read",
      "suppliers:read",
      "warranties:read",
      "reports:read",
      "audit:read",
    ],
  },
  REPORT_VIEWER: {
    description: "Usuario de consulta de reportes",
    permissions: ["reports:read", "assets:read", "work-orders:read"],
  },
};

async function main() {
  const permissionRecords = await Promise.all(
    Object.entries(permissions).map(([key, description]) =>
      prisma.permission.upsert({
        where: { key },
        update: { description },
        create: {
          key,
          description,
        },
      }),
    ),
  );
  const permissionsByKey = new Map(
    permissionRecords.map((permission) => [permission.key, permission]),
  );

  const roleRecords = await Promise.all(
    Object.entries(roleDefinitions).map(([name, definition]) =>
      prisma.role.upsert({
        where: { name },
        update: { description: definition.description },
        create: {
          name,
          description: definition.description,
        },
      }),
    ),
  );
  const rolesByName = new Map(roleRecords.map((role) => [role.name, role]));

  for (const [roleName, definition] of Object.entries(roleDefinitions)) {
    const role = rolesByName.get(roleName);

    if (!role) {
      throw new Error(`Rol no encontrado: ${roleName}`);
    }

    await Promise.all(
      definition.permissions.map((permissionKey) => {
        const permission = permissionsByKey.get(permissionKey);

        if (!permission) {
          throw new Error(`Permiso no encontrado: ${permissionKey}`);
        }

        return prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }),
    );
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@maintenance.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123*";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      status: "ACTIVE",
      name: "Administrador",
    },
    create: {
      email: adminEmail,
      name: "Administrador",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      status: "ACTIVE",
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: rolesByName.get("ADMIN")!.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: rolesByName.get("ADMIN")!.id,
    },
  });

  console.log(`Seed listo. Usuario administrador: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
