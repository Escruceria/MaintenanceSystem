export const permissionsByModule = {
  users: ["users:read", "users:write", "roles:read", "roles:write"],
  locations: ["locations:read", "locations:write"],
  assets: ["assets:read", "assets:write"],
  workOrders: [
    "work-orders:read",
    "work-orders:write",
    "work-orders:assign",
    "work-orders:execute",
    "work-orders:close",
    "work-orders:evidences:read",
    "work-orders:evidences:write",
    "work-orders:evidences:void",
  ],
  maintenancePlans: ["maintenance-plans:read", "maintenance-plans:write"],
  requests: [
    "requests:read",
    "requests:write",
    "requests:review",
    "requests:convert",
  ],
  inventory: [
    "inventory:read",
    "inventory:write",
    "inventory:adjust",
    "inventory:move",
  ],
  suppliers: [
    "suppliers:read",
    "suppliers:write",
    "warranties:read",
    "warranties:write",
  ],
  reports: ["reports:read", "reports:export"],
  audit: ["audit:read"],
  settings: ["settings:manage"],
} as const;

export type PermissionModule = keyof typeof permissionsByModule;
export type PermissionKey =
  (typeof permissionsByModule)[PermissionModule][number];

export const hasPermission = (
  userPermissions: readonly string[],
  permission: PermissionKey,
) => userPermissions.includes(permission);

export const hasAnyPermission = (
  userPermissions: readonly string[],
  permissions: readonly PermissionKey[],
) => permissions.some((permission) => userPermissions.includes(permission));

export const hasAllPermissions = (
  userPermissions: readonly string[],
  permissions: readonly PermissionKey[],
) => permissions.every((permission) => userPermissions.includes(permission));
