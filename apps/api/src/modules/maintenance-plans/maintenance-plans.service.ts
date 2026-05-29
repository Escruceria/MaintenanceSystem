import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AssetStatus,
  MaintenanceType,
  Prisma,
  WorkOrderStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMaintenancePlanDto } from "./dto/create-maintenance-plan.dto";
import { GenerateMaintenanceOrdersDto } from "./dto/generate-maintenance-orders.dto";
import { MaintenancePlanTaskDto } from "./dto/maintenance-plan-task.dto";
import { UpdateMaintenancePlanDto } from "./dto/update-maintenance-plan.dto";

const activeWorkOrderStatuses = [
  WorkOrderStatus.OPEN,
  WorkOrderStatus.ASSIGNED,
  WorkOrderStatus.IN_PROGRESS,
  WorkOrderStatus.ON_HOLD,
];

const maintenancePlanSelect = Prisma.validator<Prisma.MaintenancePlanSelect>()({
  id: true,
  code: true,
  name: true,
  description: true,
  type: true,
  frequency: true,
  intervalDays: true,
  estimatedDurationMinutes: true,
  priority: true,
  nextDueAt: true,
  lastGeneratedAt: true,
  isActive: true,
  tasks: {
    select: {
      id: true,
      title: true,
      description: true,
      sortOrder: true,
      isRequired: true,
    },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  },
  assets: {
    select: {
      assignedAt: true,
      asset: {
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          location: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
            },
          },
        },
      },
    },
    orderBy: { asset: { code: "asc" } },
  },
  _count: {
    select: {
      workOrders: true,
    },
  },
  createdAt: true,
  updatedAt: true,
});

type MaintenancePlanWithRelations = Prisma.MaintenancePlanGetPayload<{
  select: typeof maintenancePlanSelect;
}>;

@Injectable()
export class MaintenancePlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMaintenancePlanDto) {
    const code = this.normalizeCode(dto.code);
    await this.ensureCodeIsAvailable(code);
    await this.ensureAssetsExist(dto.assetIds ?? []);

    const plan = await this.prisma.$transaction(async (tx) => {
      const created = await tx.maintenancePlan.create({
        data: {
          code,
          name: dto.name.trim(),
          description: this.normalizeOptionalText(dto.description),
          type: dto.type ?? MaintenanceType.PREVENTIVE,
          frequency: dto.frequency.trim(),
          intervalDays: dto.intervalDays ?? 30,
          estimatedDurationMinutes: dto.estimatedDurationMinutes,
          priority: dto.priority,
          nextDueAt: dto.nextDueAt ? new Date(dto.nextDueAt) : undefined,
        },
        select: { id: true },
      });

      await this.replaceTasks(tx, created.id, dto.tasks ?? []);
      await this.replaceAssets(tx, created.id, dto.assetIds ?? []);

      return tx.maintenancePlan.findUnique({
        where: { id: created.id },
        select: maintenancePlanSelect,
      });
    });

    return this.toPlanResponse(plan!);
  }

  async findAll() {
    const plans = await this.prisma.maintenancePlan.findMany({
      select: maintenancePlanSelect,
      orderBy: [{ isActive: "desc" }, { code: "asc" }],
    });

    return plans.map((plan) => this.toPlanResponse(plan));
  }

  async findOne(id: string) {
    const plan = await this.prisma.maintenancePlan.findUnique({
      where: { id },
      select: maintenancePlanSelect,
    });

    if (!plan) {
      throw new NotFoundException("Plan de mantenimiento no encontrado");
    }

    return this.toPlanResponse(plan);
  }

  async update(id: string, dto: UpdateMaintenancePlanDto) {
    await this.ensurePlanExists(id);

    if (dto.code) {
      await this.ensureCodeIsAvailable(this.normalizeCode(dto.code), id);
    }

    if (dto.assetIds) {
      await this.ensureAssetsExist(dto.assetIds);
    }

    const plan = await this.prisma.$transaction(async (tx) => {
      await tx.maintenancePlan.update({
        where: { id },
        data: {
          code: dto.code ? this.normalizeCode(dto.code) : undefined,
          name: dto.name?.trim(),
          description:
            dto.description === undefined
              ? undefined
              : this.normalizeOptionalText(dto.description),
          type: dto.type,
          frequency: dto.frequency?.trim(),
          intervalDays: dto.intervalDays,
          estimatedDurationMinutes: dto.estimatedDurationMinutes,
          priority: dto.priority,
          nextDueAt:
            dto.nextDueAt === undefined
              ? undefined
              : dto.nextDueAt
                ? new Date(dto.nextDueAt)
                : null,
        },
      });

      if (dto.tasks) {
        await this.replaceTasks(tx, id, dto.tasks);
      }

      if (dto.assetIds) {
        await this.replaceAssets(tx, id, dto.assetIds);
      }

      return tx.maintenancePlan.findUnique({
        where: { id },
        select: maintenancePlanSelect,
      });
    });

    return this.toPlanResponse(plan!);
  }

  async activate(id: string) {
    await this.ensurePlanExists(id);

    const plan = await this.prisma.maintenancePlan.update({
      where: { id },
      data: { isActive: true },
      select: maintenancePlanSelect,
    });

    return this.toPlanResponse(plan);
  }

  async deactivate(id: string) {
    await this.ensurePlanExists(id);

    const plan = await this.prisma.maintenancePlan.update({
      where: { id },
      data: { isActive: false },
      select: maintenancePlanSelect,
    });

    return this.toPlanResponse(plan);
  }

  async remove(id: string) {
    const plan = await this.prisma.maintenancePlan.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            workOrders: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException("Plan de mantenimiento no encontrado");
    }

    if (plan._count.workOrders > 0) {
      throw new BadRequestException(
        "No se puede eliminar un plan que ya genero ordenes de trabajo",
      );
    }

    await this.prisma.maintenancePlan.delete({ where: { id } });

    return { success: true };
  }

  async generateWorkOrders(id: string, dto: GenerateMaintenanceOrdersDto) {
    const plan = await this.prisma.maintenancePlan.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        priority: true,
        intervalDays: true,
        nextDueAt: true,
        isActive: true,
        assets: {
          where: dto.assetId ? { assetId: dto.assetId } : undefined,
          select: {
            asset: {
              select: {
                id: true,
                code: true,
                name: true,
                status: true,
              },
            },
          },
        },
        tasks: {
          select: {
            title: true,
            sortOrder: true,
          },
          orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
        },
      },
    });

    if (!plan) {
      throw new NotFoundException("Plan de mantenimiento no encontrado");
    }

    if (!plan.isActive) {
      throw new BadRequestException(
        "No se puede generar desde un plan inactivo",
      );
    }

    if (dto.assetId && plan.assets.length === 0) {
      throw new BadRequestException("El activo no esta asociado a este plan");
    }

    const activeAssets = plan.assets
      .map(({ asset }) => asset)
      .filter((asset) => asset.status === AssetStatus.ACTIVE);

    if (activeAssets.length === 0) {
      throw new BadRequestException(
        "El plan no tiene activos activos para generar ordenes",
      );
    }

    const scheduledAt = dto.scheduledAt
      ? new Date(dto.scheduledAt)
      : (plan.nextDueAt ?? new Date());
    const generated = [];
    const skipped = [];

    for (const asset of activeAssets) {
      const existing = await this.prisma.workOrder.findFirst({
        where: {
          maintenancePlanId: id,
          assetId: asset.id,
          status: { in: activeWorkOrderStatuses },
        },
        select: {
          id: true,
          number: true,
          status: true,
        },
      });

      if (existing) {
        skipped.push({
          assetId: asset.id,
          assetCode: asset.code,
          reason: "Ya existe una orden activa para este plan y activo",
          workOrder: existing,
        });
        continue;
      }

      const workOrder = await this.prisma.workOrder.create({
        data: {
          number: await this.generateWorkOrderNumber(),
          title: `${plan.name} - ${asset.name}`,
          description: this.buildGeneratedDescription(plan),
          type: plan.type,
          priority: plan.priority,
          status: WorkOrderStatus.OPEN,
          assetId: asset.id,
          maintenancePlanId: plan.id,
          scheduledAt,
        },
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          asset: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          scheduledAt: true,
        },
      });

      generated.push(workOrder);
    }

    const nextDueAt = new Date(scheduledAt);
    nextDueAt.setDate(nextDueAt.getDate() + plan.intervalDays);

    await this.prisma.maintenancePlan.update({
      where: { id },
      data: {
        lastGeneratedAt: new Date(),
        nextDueAt,
      },
    });

    return {
      generated,
      skipped,
      nextDueAt,
    };
  }

  private async replaceTasks(
    tx: Prisma.TransactionClient,
    planId: string,
    tasks: MaintenancePlanTaskDto[],
  ) {
    await tx.maintenancePlanTask.deleteMany({ where: { planId } });

    if (tasks.length === 0) {
      return;
    }

    await tx.maintenancePlanTask.createMany({
      data: tasks.map((task, index) => ({
        planId,
        title: task.title.trim(),
        description: this.normalizeOptionalText(task.description),
        sortOrder: task.sortOrder ?? index,
        isRequired: task.isRequired ?? true,
      })),
    });
  }

  private async replaceAssets(
    tx: Prisma.TransactionClient,
    planId: string,
    assetIds: string[],
  ) {
    await tx.maintenancePlanAsset.deleteMany({ where: { planId } });

    if (assetIds.length === 0) {
      return;
    }

    await tx.maintenancePlanAsset.createMany({
      data: [...new Set(assetIds)].map((assetId) => ({
        planId,
        assetId,
      })),
    });
  }

  private async ensurePlanExists(id: string) {
    const plan = await this.prisma.maintenancePlan.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!plan) {
      throw new NotFoundException("Plan de mantenimiento no encontrado");
    }
  }

  private async ensureCodeIsAvailable(code: string, currentPlanId?: string) {
    const plan = await this.prisma.maintenancePlan.findUnique({
      where: { code },
      select: { id: true },
    });

    if (plan && plan.id !== currentPlanId) {
      throw new ConflictException("Ya existe un plan con este codigo");
    }
  }

  private async ensureAssetsExist(assetIds: string[]) {
    const uniqueIds = [...new Set(assetIds)];

    if (uniqueIds.length === 0) {
      return;
    }

    const assets = await this.prisma.asset.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });

    if (assets.length !== uniqueIds.length) {
      throw new NotFoundException("Uno o mas activos no existen");
    }
  }

  private async generateWorkOrderNumber() {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const count = await this.prisma.workOrder.count({
      where: {
        number: {
          startsWith: `OT-${datePart}`,
        },
      },
    });

    return `OT-${datePart}-${String(count + 1).padStart(4, "0")}`;
  }

  private buildGeneratedDescription(plan: {
    description: string | null;
    tasks: { title: string; sortOrder: number }[];
  }) {
    const tasks = plan.tasks
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((task, index) => `${index + 1}. ${task.title}`)
      .join("\n");

    return [plan.description, tasks ? `Checklist:\n${tasks}` : null]
      .filter(Boolean)
      .join("\n\n");
  }

  private normalizeCode(code: string) {
    return code.trim().toUpperCase();
  }

  private normalizeOptionalText(value?: string | null) {
    const normalized = value?.trim();

    return normalized ? normalized : null;
  }

  private toPlanResponse(plan: MaintenancePlanWithRelations) {
    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      type: plan.type,
      frequency: plan.frequency,
      intervalDays: plan.intervalDays,
      estimatedDurationMinutes: plan.estimatedDurationMinutes,
      priority: plan.priority,
      nextDueAt: plan.nextDueAt,
      lastGeneratedAt: plan.lastGeneratedAt,
      isActive: plan.isActive,
      tasks: plan.tasks,
      assets: plan.assets.map(({ asset, assignedAt }) => ({
        ...asset,
        assignedAt,
      })),
      workOrdersCount: plan._count.workOrders,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}
