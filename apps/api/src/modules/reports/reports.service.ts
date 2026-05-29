import { Injectable } from "@nestjs/common";
import {
  AssetStatus,
  MaintenanceType,
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

    const [
      openWorkOrders,
      criticalWorkOrders,
      preventiveWorkOrders,
      completedPreventiveWorkOrders,
      assetsActive,
      assetsInMaintenance,
      lowStockItems,
      urgentLowStockItems,
      recentWorkOrders,
    ] = await this.prisma.$transaction([
      this.prisma.workOrder.count({
        where: { status: { in: ACTIVE_WORK_ORDER_STATUSES } },
      }),
      this.prisma.workOrder.count({
        where: {
          status: { in: ACTIVE_WORK_ORDER_STATUSES },
          priority: WorkOrderPriority.CRITICAL,
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
        openWorkOrders,
        criticalWorkOrders,
        preventiveCompliance,
        assetsActive,
        assetsInMaintenance,
        lowStockItems,
        urgentLowStockItems,
      },
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
        preventiveCompliance,
      }),
    };
  }

  private buildPriorities(metrics: {
    criticalWorkOrders: number;
    lowStockItems: number;
    urgentLowStockItems: number;
    preventiveCompliance: number;
  }) {
    const priorities = [];

    if (metrics.criticalWorkOrders > 0) {
      priorities.push({
        title: "Cerrar ordenes criticas",
        detail: `${metrics.criticalWorkOrders} ordenes requieren atencion prioritaria.`,
        severity: "critical",
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

    if (metrics.preventiveCompliance < 90) {
      priorities.push({
        title: "Programar preventivos",
        detail: `Cumplimiento preventivo actual: ${metrics.preventiveCompliance}%.`,
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
