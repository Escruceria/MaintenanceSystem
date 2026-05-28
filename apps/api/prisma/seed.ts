import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const permissions = [
  'users:read',
  'users:write',
  'assets:read',
  'assets:write',
  'work-orders:read',
  'work-orders:write',
  'inventory:read',
  'inventory:write',
  'reports:read',
  'settings:manage',
];

async function main() {
  const permissionRecords = await Promise.all(
    permissions.map((key) =>
      prisma.permission.upsert({
        where: { key },
        update: {},
        create: {
          key,
          description: key.replace(':', ' '),
        },
      }),
    ),
  );

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: { description: 'Administrador total del sistema' },
    create: {
      name: 'ADMIN',
      description: 'Administrador total del sistema',
    },
  });

  await Promise.all(
    permissionRecords.map((permission) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      }),
    ),
  );

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@maintenance.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123*';

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      status: 'ACTIVE',
      name: 'Administrador',
    },
    create: {
      email: adminEmail,
      name: 'Administrador',
      passwordHash: await bcrypt.hash(adminPassword, 12),
      status: 'ACTIVE',
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: adminRole.id,
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
