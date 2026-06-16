import { Injectable } from "@nestjs/common";
import {
  AssetStatus,
  MaintenanceType,
  ServiceRequestStatus,
  WarrantyStatus,
  WorkOrderPriority,
  WorkOrderStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const ACTIVE_WORK_ORDER_STATUSES = [
  WorkOrderStatus.OPEN,
  WorkOrderStatus.ASSIGNED,
  WorkOrderStatus.IN_PROGRESS,
  WorkOrderStatus.ON_HOLD,
];

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const now = new Date();
    const upcomingLimit = new Date(now);
    upcomingLimit.setDate(upcomingLimit.getDate() + 30);

    const [
      totalAssets,
      openWorkOrders,
      criticalWorkOrders,
      totalWorkOrders,
      completedWorkOrdersThisMonth,
      preventiveWorkOrders,
      completedPreventiveWorkOrders,
      assetsActive,
      assetsInMaintenance,
      assetsOutOfService,
      assetsRetired,
      inventoryItems,
      inventoryUnits,
      lowStockItems,
      urgentLowStockItems,
      openServiceRequests,
      pendingServiceRequests,
      activeSuppliers,
      activeWarranties,
      expiringWarrantiesCount,
      expiredWarranties,
      overdueMaintenancePlans,
      upcomingMaintenancePlans,
      workOrdersByStatus,
      workOrdersByType,
      assetsByStatus,
      requestsByStatus,
      upcomingMaintenance,
      expiringWarranties,
      recentInventoryMovements,
      recentWorkOrders,
    ] = await this.prisma.$transaction([
      this.prisma.asset.count(),
      this.prisma.workOrder.count({
        where: { status: { in: ACTIVE_WORK_ORDER_STATUSES } },
      }),
      this.prisma.workOrder.count({
        where: {
          status: { in: ACTIVE_WORK_ORDER_STATUSES },
          priority: WorkOrderPriority.CRITICAL,
        },
      }),
      this.prisma.workOrder.count(),
      this.prisma.workOrder.count({
        where: {
          status: WorkOrderStatus.COMPLETED,
          completedAt: { gte: monthStart },
        },
      }),
      this.prisma.workOrder.count({
        where: {
          type: MaintenanceType.PREVENTIVE,
          createdAt: { gte: monthStart },
        },
      }),
      this.prisma.workOrder.count({
        where: {
          type: MaintenanceType.PREVENTIVE,
          status: WorkOrderStatus.COMPLETED,
          createdAt: { gte: monthStart },
        },
      }),
      this.prisma.asset.count({ where: { status: AssetStatus.ACTIVE } }),
      this.prisma.asset.count({
        where: { status: AssetStatus.IN_MAINTENANCE },
      }),
      this.prisma.asset.count({
        where: { status: AssetStatus.OUT_OF_SERVICE },
      }),
      this.prisma.asset.count({ where: { status: AssetStatus.RETIRED } }),
      this.prisma.sparePart.count(),
      this.prisma.sparePart.aggregate({
        _sum: { stock: true },
      }),
      this.prisma.sparePart.count({
        where: {
          stock: {
            lte: this.prisma.sparePart.fields.minimumStock,
          },
        },
      }),
      this.prisma.sparePart.count({
        where: {
          stock: 0,
        },
      }),
      this.prisma.serviceRequest.count({
        where: {
          status: {
            in: [
              ServiceRequestStatus.OPEN,
              ServiceRequestStatus.IN_REVIEW,
              ServiceRequestStatus.APPROVED,
            ],
          },
        },
      }),
      this.prisma.serviceRequest.count({
        where: {
          status: {
            in: [ServiceRequestStatus.OPEN, ServiceRequestStatus.IN_REVIEW],
          },
        },
      }),
      this.prisma.supplier.count({ where: { isActive: true } }),
      this.prisma.assetWarranty.count({
        where: { status: WarrantyStatus.ACTIVE, endDate: { gte: now } },
      }),
      this.prisma.assetWarranty.count({
        where: {
          status: WarrantyStatus.ACTIVE,
          endDate: { gte: now, lte: upcomingLimit },
        },
      }),
      this.prisma.assetWarranty.count({
        where: {
          OR: [
            { status: WarrantyStatus.EXPIRED },
            { status: WarrantyStatus.ACTIVE, endDate: { lt: now } },
          ],
        },
      }),
      this.prisma.maintenancePlan.count({
        where: {
          isActive: true,
          nextDueAt: { lt: now },
        },
      }),
      this.prisma.maintenancePlan.count({
        where: {
          isActive: true,
          nextDueAt: {
            gte: now,
            lte: upcomingLimit,
          },
        },
      }),
      this.prisma.workOrder.groupBy({
        by: ["status"],
        orderBy: { status: "asc" },
        _count: { _all: true },
      }),
      this.prisma.workOrder.groupBy({
        by: ["type"],
        orderBy: { type: "asc" },
        _count: { _all: true },
      }),
      this.prisma.asset.groupBy({
        by: ["status"],
        orderBy: { status: "asc" },
        _count: { _all: true },
      }),
      this.prisma.serviceRequest.groupBy({
        by: ["status"],
        orderBy: { status: "asc" },
        _count: { _all: true },
      }),
      this.prisma.maintenancePlan.findMany({
        take: 8,
        where: {
          isActive: true,
          nextDueAt: { lte: upcomingLimit },
        },
        orderBy: [{ nextDueAt: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
          frequency: true,
          frequencyType: true,
          priority: true,
          nextDueAt: true,
          _count: {
            select: {
              assets: true,
            },
          },
        },
      }),
      this.prisma.assetWarranty.findMany({
        take: 8,
        where: {
          status: WarrantyStatus.ACTIVE,
          endDate: { gte: now, lte: upcomingLimit },
        },
        orderBy: [{ endDate: "asc" }],
        select: {
          id: true,
          title: true,
          policyNumber: true,
          endDate: true,
          asset: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.inventoryMovement.findMany({
        take: 8,
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          type: true,
          quantity: true,
          previousStock: true,
          nextStock: true,
          reason: true,
          reference: true,
          createdAt: true,
          sparePart: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.workOrder.findMany({
        take: 6,
        orderBy: [{ updatedAt: "desc" }],
        select: {
          id: true,
          number: true,
          title: true,
          type: true,
          priority: true,
          status: true,
          updatedAt: true,
          asset: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          assignedTechnician: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const preventiveCompliance =
      preventiveWorkOrders === 0
        ? 100
        : Math.round(
            (completedPreventiveWorkOrders / preventiveWorkOrders) * 100,
          );

    return {
      metrics: {
        totalAssets,
        openWorkOrders,
        criticalWorkOrders,
        totalWorkOrders,
        completedWorkOrdersThisMonth,
        preventiveCompliance,
        assetsActive,
        assetsInMaintenance,
        assetsOutOfService,
        assetsRetired,
        inventoryItems,
        inventoryUnits: inventoryUnits._sum.stock ?? 0,
        lowStockItems,
        urgentLowStockItems,
        openServiceRequests,
        pendingServiceRequests,
        activeSuppliers,
        activeWarranties,
        expiringWarranties: expiringWarrantiesCount,
        expiredWarranties,
        overdueMaintenancePlans,
        upcomingMaintenancePlans,
      },
      distribution: {
        workOrdersByStatus: this.toCountMap(workOrdersByStatus, "status"),
        workOrdersByType: this.toCountMap(workOrdersByType, "type"),
        assetsByStatus: this.toCountMap(assetsByStatus, "status"),
        requestsByStatus: this.toCountMap(requestsByStatus, "status"),
      },
      upcomingMaintenance: upcomingMaintenance.map((plan) => ({
        id: plan.id,
        code: plan.code,
        name: plan.name,
        frequency: plan.frequency,
        frequencyType: plan.frequencyType,
        priority: plan.priority,
        nextDueAt: plan.nextDueAt,
        assetsCount: plan._count.assets,
        status: plan.nextDueAt && plan.nextDueAt < now ? "OVERDUE" : "UPCOMING",
      })),
      expiringWarranties: expiringWarranties.map((warranty) => ({
        id: warranty.id,
        title: warranty.title,
        policyNumber: warranty.policyNumber,
        endDate: warranty.endDate,
        asset: warranty.asset,
        supplier: warranty.supplier,
      })),
      recentInventoryMovements: recentInventoryMovements.map((movement) => ({
        id: movement.id,
        type: movement.type,
        quantity: movement.quantity,
        previousStock: movement.previousStock,
        nextStock: movement.nextStock,
        reason: movement.reason,
        reference: movement.reference,
        createdAt: movement.createdAt,
        sparePart: movement.sparePart,
      })),
      recentWorkOrders: recentWorkOrders.map((workOrder) => ({
        id: workOrder.id,
        number: workOrder.number,
        title: workOrder.title,
        type: workOrder.type,
        priority: workOrder.priority,
        status: workOrder.status,
        asset: workOrder.asset,
        assignedTechnician: workOrder.assignedTechnician,
        updatedAt: workOrder.updatedAt,
      })),
      priorities: this.buildPriorities({
        criticalWorkOrders,
        lowStockItems,
        urgentLowStockItems,
        openServiceRequests,
        pendingServiceRequests,
        expiringWarranties: expiringWarrantiesCount,
        expiredWarranties,
        assetsOutOfService,
        preventiveCompliance,
        overdueMaintenancePlans,
        upcomingMaintenancePlans,
      }),
    };
  }

  private toCountMap(groups: unknown[], key: string) {
    return groups.reduce<Record<string, number>>((acc, group) => {
      const row = group as Record<string, unknown>;
      const count = row._count as { _all?: number } | undefined;
      acc[String(row[key])] = count?._all ?? 0;
      return acc;
    }, {});
  }

  private buildPriorities(metrics: {
    criticalWorkOrders: number;
    lowStockItems: number;
    urgentLowStockItems: number;
    openServiceRequests: number;
    pendingServiceRequests: number;
    expiringWarranties: number;
    expiredWarranties: number;
    assetsOutOfService: number;
    preventiveCompliance: number;
    overdueMaintenancePlans: number;
    upcomingMaintenancePlans: number;
  }) {
    const priorities = [];

    if (metrics.criticalWorkOrders > 0) {
      priorities.push({
        title: "Cerrar ordenes criticas",
        detail: `${metrics.criticalWorkOrders} ordenes requieren atencion prioritaria.`,
        severity: "critical",
      });
    }

    if (metrics.assetsOutOfService > 0) {
      priorities.push({
        title: "Revisar activos fuera de servicio",
        detail: `${metrics.assetsOutOfService} activos requieren decision tecnica o administrativa.`,
        severity: "warning",
      });
    }

    if (metrics.lowStockItems > 0) {
      priorities.push({
        title: "Revisar inventario minimo",
        detail:
          metrics.urgentLowStockItems > 0
            ? `${metrics.urgentLowStockItems} repuestos estan agotados.`
            : `${metrics.lowStockItems} repuestos estan bajo minimo.`,
        severity: metrics.urgentLowStockItems > 0 ? "critical" : "warning",
      });
    }

    if (metrics.pendingServiceRequests > 0) {
      priorities.push({
        title: "Gestionar solicitudes pendientes",
        detail: `${metrics.pendingServiceRequests} solicitudes esperan revision o aprobacion.`,
        severity: "warning",
      });
    }

    if (metrics.expiredWarranties > 0) {
      priorities.push({
        title: "Regularizar garantias vencidas",
        detail: `${metrics.expiredWarranties} garantias figuran vencidas o fuera de vigencia.`,
        severity: "warning",
      });
    } else if (metrics.expiringWarranties > 0) {
      priorities.push({
        title: "Revisar garantias proximas",
        detail: `${metrics.expiringWarranties} garantias vencen en los proximos 30 dias.`,
        severity: "warning",
      });
    }

    if (metrics.preventiveCompliance < 90) {
      priorities.push({
        title: "Programar preventivos",
        detail: `Cumplimiento preventivo actual: ${metrics.preventiveCompliance}%.`,
        severity: "warning",
      });
    }

    if (metrics.overdueMaintenancePlans > 0) {
      priorities.push({
        title: "Atender mantenimientos vencidos",
        detail: `${metrics.overdueMaintenancePlans} planes ya superaron su fecha programada.`,
        severity: "critical",
      });
    } else if (metrics.upcomingMaintenancePlans > 0) {
      priorities.push({
        title: "Preparar mantenimientos proximos",
        detail: `${metrics.upcomingMaintenancePlans} planes vencen en los proximos 30 dias.`,
        severity: "warning",
      });
    }

    if (priorities.length === 0) {
      priorities.push({
        title: "Operacion estable",
        detail: "No hay prioridades criticas segun los datos actuales.",
        severity: "normal",
      });
    }

    return priorities;
  }
}
