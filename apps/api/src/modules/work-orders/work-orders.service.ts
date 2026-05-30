import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AssetStatus,
  Prisma,
  UserStatus,
  WorkOrderChecklistItemStatus,
  WorkOrderStatus,
} from "@prisma/client";
import { AuthenticatedUser } from "../auth/types/authenticated-user";
import { PrismaService } from "../prisma/prisma.service";
import { AssignWorkOrderDto } from "./dto/assign-work-order.dto";
import { ChangeWorkOrderStatusDto } from "./dto/change-work-order-status.dto";
import { CloseWorkOrderDto } from "./dto/close-work-order.dto";
import { CreateWorkOrderDto } from "./dto/create-work-order.dto";
import { SetWorkOrderPartsDto } from "./dto/set-work-order-parts.dto";
import { UpdateWorkOrderChecklistItemDto } from "./dto/update-work-order-checklist-item.dto";
import { UpdateWorkOrderDto } from "./dto/update-work-order.dto";
import { WorkOrderPartDto } from "./dto/work-order-part.dto";

const workOrderSelect = Prisma.validator<Prisma.WorkOrderSelect>()({
  id: true,
  number: true,
  title: true,
  description: true,
  type: true,
  priority: true,
  status: true,
  assetId: true,
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
  assignedTechnicianId: true,
  assignedTechnician: {
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
    },
  },
  scheduledAt: true,
  startedAt: true,
  completedAt: true,
  spareParts: {
    select: {
      quantity: true,
      sparePart: {
        select: {
          id: true,
          sku: true,
          name: true,
          unit: true,
          stock: true,
        },
      },
    },
    orderBy: { sparePart: { name: "asc" } },
  },
  checklistItems: {
    select: {
      id: true,
      maintenancePlanTaskId: true,
      title: true,
      description: true,
      sortOrder: true,
      isRequired: true,
      status: true,
      notes: true,
      executedAt: true,
      executedBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  },
  createdAt: true,
  updatedAt: true,
});

type WorkOrderWithRelations = Prisma.WorkOrderGetPayload<{
  select: typeof workOrderSelect;
}>;

const terminalStatuses = new Set<WorkOrderStatus>([
  WorkOrderStatus.COMPLETED,
  WorkOrderStatus.CANCELLED,
]);

@Injectable()
export class WorkOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkOrderDto) {
    await this.ensureAssetExists(dto.assetId);

    if (dto.assignedTechnicianId) {
      await this.ensureTechnicianExists(dto.assignedTechnicianId);
    }

    const number = dto.number
      ? this.normalizeNumber(dto.number)
      : await this.generateNumber();
    await this.ensureNumberIsAvailable(number);
    await this.ensureSparePartsExist(dto.spareParts ?? []);

    const workOrder = await this.prisma.$transaction(async (tx) => {
      const created = await tx.workOrder.create({
        data: {
          number,
          title: dto.title.trim(),
          description: this.normalizeOptionalText(dto.description),
          type: dto.type,
          priority: dto.priority,
          status: dto.assignedTechnicianId
            ? WorkOrderStatus.ASSIGNED
            : (dto.status ?? WorkOrderStatus.OPEN),
          assetId: dto.assetId,
          assignedTechnicianId: dto.assignedTechnicianId,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        },
        select: { id: true },
      });

      await this.replaceSpareParts(tx, created.id, dto.spareParts ?? []);

      return tx.workOrder.findUnique({
        where: { id: created.id },
        select: workOrderSelect,
      });
    });

    return this.toWorkOrderResponse(workOrder!);
  }

  async findAll() {
    const workOrders = await this.prisma.workOrder.findMany({
      select: workOrderSelect,
      orderBy: [{ createdAt: "desc" }],
    });

    return workOrders.map((workOrder) => this.toWorkOrderResponse(workOrder));
  }

  async findOne(id: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
      select: workOrderSelect,
    });

    if (!workOrder) {
      throw new NotFoundException("Orden de trabajo no encontrada");
    }

    return this.toWorkOrderResponse(workOrder);
  }

  async update(id: string, dto: UpdateWorkOrderDto) {
    const current = await this.ensureWorkOrderExists(id);
    this.ensureNotTerminal(current.status);

    if (dto.assetId) {
      await this.ensureAssetExists(dto.assetId);
    }

    if (dto.assignedTechnicianId) {
      await this.ensureTechnicianExists(dto.assignedTechnicianId);
    }

    const nextStatus =
      dto.status ??
      (dto.assignedTechnicianId !== undefined &&
      dto.assignedTechnicianId !== null
        ? WorkOrderStatus.ASSIGNED
        : undefined);

    if (nextStatus) {
      this.validateStatusChange(current.status, nextStatus);
    }

    const workOrder = await this.prisma.workOrder.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description:
          dto.description === undefined
            ? undefined
            : this.normalizeOptionalText(dto.description),
        type: dto.type,
        priority: dto.priority,
        status: nextStatus,
        assetId: dto.assetId,
        assignedTechnicianId: dto.assignedTechnicianId,
        scheduledAt:
          dto.scheduledAt === undefined
            ? undefined
            : dto.scheduledAt
              ? new Date(dto.scheduledAt)
              : null,
      },
      select: workOrderSelect,
    });

    return this.toWorkOrderResponse(workOrder);
  }

  async assign(id: string, dto: AssignWorkOrderDto) {
    const current = await this.ensureWorkOrderExists(id);
    this.ensureNotTerminal(current.status);
    await this.ensureTechnicianExists(dto.technicianId);

    const workOrder = await this.prisma.workOrder.update({
      where: { id },
      data: {
        assignedTechnicianId: dto.technicianId,
        status: WorkOrderStatus.ASSIGNED,
      },
      select: workOrderSelect,
    });

    return this.toWorkOrderResponse(workOrder);
  }

  async changeStatus(id: string, dto: ChangeWorkOrderStatusDto) {
    const current = await this.ensureWorkOrderExists(id);
    this.validateStatusChange(current.status, dto.status);

    const data: Prisma.WorkOrderUpdateInput = {
      status: dto.status,
      startedAt:
        dto.status === WorkOrderStatus.IN_PROGRESS && !current.startedAt
          ? new Date()
          : undefined,
      completedAt:
        dto.status === WorkOrderStatus.COMPLETED ? new Date() : undefined,
    };

    const workOrder = await this.prisma.workOrder.update({
      where: { id },
      data,
      select: workOrderSelect,
    });

    return this.toWorkOrderResponse(workOrder);
  }

  async setSpareParts(id: string, dto: SetWorkOrderPartsDto) {
    const current = await this.ensureWorkOrderExists(id);
    this.ensureNotTerminal(current.status);
    await this.ensureSparePartsExist(dto.spareParts);

    const workOrder = await this.prisma.$transaction(async (tx) => {
      await this.replaceSpareParts(tx, id, dto.spareParts);

      return tx.workOrder.findUnique({
        where: { id },
        select: workOrderSelect,
      });
    });

    return this.toWorkOrderResponse(workOrder!);
  }

  async getChecklist(id: string) {
    await this.ensureWorkOrderExists(id);

    const checklistItems = await this.prisma.workOrderChecklistItem.findMany({
      where: { workOrderId: id },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: {
        id: true,
        maintenancePlanTaskId: true,
        title: true,
        description: true,
        sortOrder: true,
        isRequired: true,
        status: true,
        notes: true,
        executedAt: true,
        executedBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return checklistItems;
  }

  async updateChecklistItem(
    id: string,
    itemId: string,
    dto: UpdateWorkOrderChecklistItemDto,
    user: AuthenticatedUser,
  ) {
    const current = await this.ensureWorkOrderExists(id);
    this.ensureNotTerminal(current.status);

    const item = await this.prisma.workOrderChecklistItem.findFirst({
      where: { id: itemId, workOrderId: id },
      select: { id: true },
    });

    if (!item) {
      throw new NotFoundException("Tarea de checklist no encontrada");
    }

    const isPending = dto.status === WorkOrderChecklistItemStatus.PENDING;

    const updatedItem = await this.prisma.workOrderChecklistItem.update({
      where: { id: itemId },
      data: {
        status: dto.status,
        notes:
          dto.notes === undefined
            ? undefined
            : this.normalizeOptionalText(dto.notes),
        executedById: isPending ? null : user.sub,
        executedAt: isPending ? null : new Date(),
      },
      select: {
        id: true,
        maintenancePlanTaskId: true,
        title: true,
        description: true,
        sortOrder: true,
        isRequired: true,
        status: true,
        notes: true,
        executedAt: true,
        executedBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedItem;
  }

  async close(id: string, dto: CloseWorkOrderDto) {
    const current = await this.ensureWorkOrderExists(id);
    this.validateStatusChange(current.status, WorkOrderStatus.COMPLETED);
    await this.ensureRequiredChecklistCompleted(id);

    if (dto.spareParts) {
      await this.ensureSparePartsExist(dto.spareParts);
    }

    const workOrder = await this.prisma.$transaction(async (tx) => {
      if (dto.spareParts) {
        await this.replaceSpareParts(tx, id, dto.spareParts);
      }

      const parts = await tx.workOrderPart.findMany({
        where: { workOrderId: id },
        select: {
          quantity: true,
          sparePart: {
            select: {
              id: true,
              stock: true,
            },
          },
        },
      });

      for (const part of parts) {
        if (part.sparePart.stock < part.quantity) {
          throw new BadRequestException(
            "No hay stock suficiente para uno o mas repuestos",
          );
        }

        await tx.sparePart.update({
          where: { id: part.sparePart.id },
          data: { stock: { decrement: part.quantity } },
        });
      }

      await tx.asset.update({
        where: { id: current.assetId },
        data: { status: AssetStatus.ACTIVE },
      });

      return tx.workOrder.update({
        where: { id },
        data: {
          status: WorkOrderStatus.COMPLETED,
          startedAt: current.startedAt ?? new Date(),
          completedAt: dto.completedAt ? new Date(dto.completedAt) : new Date(),
        },
        select: workOrderSelect,
      });
    });

    return this.toWorkOrderResponse(workOrder);
  }

  async cancel(id: string) {
    const current = await this.ensureWorkOrderExists(id);
    this.ensureNotTerminal(current.status);

    const workOrder = await this.prisma.workOrder.update({
      where: { id },
      data: { status: WorkOrderStatus.CANCELLED },
      select: workOrderSelect,
    });

    return this.toWorkOrderResponse(workOrder);
  }

  private async replaceSpareParts(
    tx: Prisma.TransactionClient,
    workOrderId: string,
    parts: WorkOrderPartDto[],
  ) {
    const uniqueParts = new Map<string, number>();

    for (const part of parts) {
      uniqueParts.set(
        part.sparePartId,
        (uniqueParts.get(part.sparePartId) ?? 0) + part.quantity,
      );
    }

    await tx.workOrderPart.deleteMany({ where: { workOrderId } });

    if (uniqueParts.size > 0) {
      await tx.workOrderPart.createMany({
        data: [...uniqueParts.entries()].map(([sparePartId, quantity]) => ({
          workOrderId,
          sparePartId,
          quantity,
        })),
      });
    }
  }

  private async ensureWorkOrderExists(id: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        startedAt: true,
        assetId: true,
      },
    });

    if (!workOrder) {
      throw new NotFoundException("Orden de trabajo no encontrada");
    }

    return workOrder;
  }

  private async ensureAssetExists(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!asset) {
      throw new NotFoundException("Activo no encontrado");
    }
  }

  private async ensureTechnicianExists(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new NotFoundException("Tecnico no encontrado o inactivo");
    }
  }

  private async ensureSparePartsExist(parts: WorkOrderPartDto[]) {
    const uniqueIds = [...new Set(parts.map((part) => part.sparePartId))];

    if (uniqueIds.length === 0) {
      return;
    }

    const spareParts = await this.prisma.sparePart.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });

    if (spareParts.length !== uniqueIds.length) {
      throw new NotFoundException("Uno o mas repuestos no existen");
    }
  }

  private async ensureRequiredChecklistCompleted(workOrderId: string) {
    const pendingRequiredItems = await this.prisma.workOrderChecklistItem.count(
      {
        where: {
          workOrderId,
          isRequired: true,
          status: { not: WorkOrderChecklistItemStatus.COMPLETED },
        },
      },
    );

    if (pendingRequiredItems > 0) {
      throw new BadRequestException(
        "No se puede cerrar la orden con tareas obligatorias pendientes o no realizadas",
      );
    }
  }

  private async ensureNumberIsAvailable(number: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { number },
      select: { id: true },
    });

    if (workOrder) {
      throw new ConflictException("Ya existe una orden con este numero");
    }
  }

  private validateStatusChange(
    currentStatus: WorkOrderStatus,
    nextStatus: WorkOrderStatus,
  ) {
    if (currentStatus === nextStatus) {
      return;
    }

    this.ensureNotTerminal(currentStatus);

    if (nextStatus === WorkOrderStatus.DRAFT) {
      throw new BadRequestException(
        "No se puede regresar una orden a borrador",
      );
    }
  }

  private ensureNotTerminal(status: WorkOrderStatus) {
    if (terminalStatuses.has(status)) {
      throw new BadRequestException(
        "No se puede modificar una orden completada o cancelada",
      );
    }
  }

  private async generateNumber() {
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

  private normalizeNumber(number: string) {
    return number.trim().toUpperCase();
  }

  private normalizeOptionalText(value?: string | null) {
    const normalized = value?.trim();

    return normalized ? normalized : null;
  }

  private toWorkOrderResponse(workOrder: WorkOrderWithRelations) {
    return {
      id: workOrder.id,
      number: workOrder.number,
      title: workOrder.title,
      description: workOrder.description,
      type: workOrder.type,
      priority: workOrder.priority,
      status: workOrder.status,
      assetId: workOrder.assetId,
      asset: workOrder.asset,
      assignedTechnicianId: workOrder.assignedTechnicianId,
      assignedTechnician: workOrder.assignedTechnician,
      scheduledAt: workOrder.scheduledAt,
      startedAt: workOrder.startedAt,
      completedAt: workOrder.completedAt,
      spareParts: workOrder.spareParts.map((part) => ({
        sparePart: part.sparePart,
        quantity: part.quantity,
      })),
      checklistItems: workOrder.checklistItems,
      createdAt: workOrder.createdAt,
      updatedAt: workOrder.updatedAt,
    };
  }
}
