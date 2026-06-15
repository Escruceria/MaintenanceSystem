import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AssetStatus,
  Prisma,
  UserStatus,
  WorkOrderChecklistItemStatus,
  WorkOrderEvidenceType,
  WorkOrderStatus,
} from "@prisma/client";
import { stat, unlink } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser } from "../auth/types/authenticated-user";
import { PrismaService } from "../prisma/prisma.service";
import { AssignWorkOrderDto } from "./dto/assign-work-order.dto";
import { ChangeWorkOrderStatusDto } from "./dto/change-work-order-status.dto";
import { CloseWorkOrderDto } from "./dto/close-work-order.dto";
import { CreateWorkOrderEvidenceDto } from "./dto/create-work-order-evidence.dto";
import { CreateWorkOrderDto } from "./dto/create-work-order.dto";
import { SetWorkOrderPartsDto } from "./dto/set-work-order-parts.dto";
import { UpdateWorkOrderChecklistItemDto } from "./dto/update-work-order-checklist-item.dto";
import { UpdateWorkOrderExecutionNotesDto } from "./dto/update-work-order-execution-notes.dto";
import { UpdateWorkOrderDto } from "./dto/update-work-order.dto";
import { UploadWorkOrderEvidenceDto } from "./dto/upload-work-order-evidence.dto";
import { VoidWorkOrderEvidenceDto } from "./dto/void-work-order-evidence.dto";
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
  finalNotes: true,
  recommendations: true,
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
  evidences: {
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      fileUrl: true,
      fileName: true,
      mimeType: true,
      uploadedBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ createdAt: "desc" }],
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateWorkOrderDto, actor?: AuthenticatedUser) {
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

    await this.audit.record({
      actor,
      action: "WORK_ORDER_CREATED",
      entityType: "WorkOrder",
      entityId: workOrder!.id,
      metadata: {
        number: workOrder!.number,
        status: workOrder!.status,
        type: workOrder!.type,
        priority: workOrder!.priority,
        assetId: workOrder!.assetId,
        assignedTechnicianId: workOrder!.assignedTechnicianId,
      },
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

  async update(id: string, dto: UpdateWorkOrderDto, actor?: AuthenticatedUser) {
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

    await this.audit.record({
      actor,
      action: "WORK_ORDER_UPDATED",
      entityType: "WorkOrder",
      entityId: workOrder.id,
      metadata: {
        number: workOrder.number,
        before: this.toWorkOrderAuditState(current),
        after: {
          status: workOrder.status,
          assetId: workOrder.assetId,
          assignedTechnicianId: workOrder.assignedTechnicianId,
          priority: workOrder.priority,
          scheduledAt: workOrder.scheduledAt?.toISOString() ?? null,
        },
      },
    });

    return this.toWorkOrderResponse(workOrder);
  }

  async assign(id: string, dto: AssignWorkOrderDto, actor?: AuthenticatedUser) {
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

    await this.audit.record({
      actor,
      action: "WORK_ORDER_ASSIGNED",
      entityType: "WorkOrder",
      entityId: workOrder.id,
      metadata: {
        number: workOrder.number,
        technicianId: dto.technicianId,
        status: workOrder.status,
      },
    });

    return this.toWorkOrderResponse(workOrder);
  }

  async changeStatus(
    id: string,
    dto: ChangeWorkOrderStatusDto,
    actor?: AuthenticatedUser,
  ) {
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

    await this.audit.record({
      actor,
      action: "WORK_ORDER_STATUS_CHANGED",
      entityType: "WorkOrder",
      entityId: workOrder.id,
      metadata: {
        number: workOrder.number,
        previousStatus: current.status,
        nextStatus: workOrder.status,
        startedAt: workOrder.startedAt?.toISOString() ?? null,
        completedAt: workOrder.completedAt?.toISOString() ?? null,
      },
    });

    return this.toWorkOrderResponse(workOrder);
  }

  async setSpareParts(
    id: string,
    dto: SetWorkOrderPartsDto,
    actor?: AuthenticatedUser,
  ) {
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

    await this.audit.record({
      actor,
      action: "WORK_ORDER_SPARE_PARTS_SET",
      entityType: "WorkOrder",
      entityId: workOrder!.id,
      metadata: {
        number: workOrder!.number,
        spareParts: workOrder!.spareParts.map((part) => ({
          sparePartId: part.sparePart.id,
          sku: part.sparePart.sku,
          quantity: part.quantity,
        })),
      },
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

    await this.audit.record({
      actor: user,
      action: "WORK_ORDER_CHECKLIST_ITEM_UPDATED",
      entityType: "WorkOrderChecklistItem",
      entityId: updatedItem.id,
      metadata: {
        workOrderId: id,
        status: updatedItem.status,
        title: updatedItem.title,
        executedAt: updatedItem.executedAt?.toISOString() ?? null,
      },
    });

    return updatedItem;
  }

  async updateExecutionNotes(
    id: string,
    dto: UpdateWorkOrderExecutionNotesDto,
    actor?: AuthenticatedUser,
  ) {
    const current = await this.ensureWorkOrderExists(id);
    this.ensureNotCancelled(current.status);

    const workOrder = await this.prisma.workOrder.update({
      where: { id },
      data: {
        finalNotes:
          dto.finalNotes === undefined
            ? undefined
            : this.normalizeOptionalText(dto.finalNotes),
        recommendations:
          dto.recommendations === undefined
            ? undefined
            : this.normalizeOptionalText(dto.recommendations),
      },
      select: workOrderSelect,
    });

    await this.audit.record({
      actor,
      action: "WORK_ORDER_EXECUTION_NOTES_UPDATED",
      entityType: "WorkOrder",
      entityId: workOrder.id,
      metadata: {
        number: workOrder.number,
        hasFinalNotes: Boolean(workOrder.finalNotes),
        hasRecommendations: Boolean(workOrder.recommendations),
      },
    });

    return this.toWorkOrderResponse(workOrder);
  }

  async getEvidences(id: string) {
    await this.ensureWorkOrderExists(id);

    return this.prisma.workOrderEvidence.findMany({
      where: { workOrderId: id },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        fileUrl: true,
        fileName: true,
        mimeType: true,
        uploadedBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        voidedAt: true,
        voidedBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        voidReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async downloadEvidence(
    id: string,
    evidenceId: string,
    user: AuthenticatedUser,
  ) {
    await this.ensureWorkOrderExists(id);

    const evidence = await this.prisma.workOrderEvidence.findFirst({
      where: { id: evidenceId, workOrderId: id },
      select: {
        id: true,
        type: true,
        title: true,
        fileUrl: true,
        fileName: true,
        mimeType: true,
        voidedAt: true,
      },
    });

    if (!evidence) {
      throw new NotFoundException("Evidencia no encontrada");
    }

    if (evidence.voidedAt) {
      throw new BadRequestException(
        "La evidencia anulada no esta disponible para descarga",
      );
    }

    if (!evidence.fileUrl) {
      throw new BadRequestException("La evidencia no tiene archivo asociado");
    }

    const localPath = this.resolveLocalEvidencePath(evidence.fileUrl);

    if (!localPath) {
      throw new BadRequestException(
        "La descarga directa solo esta disponible para archivos locales",
      );
    }

    let fileStats: Awaited<ReturnType<typeof stat>>;

    try {
      fileStats = await stat(localPath);
    } catch {
      throw new NotFoundException("Archivo de evidencia no encontrado");
    }

    await this.audit.record({
      actor: user,
      action: "WORK_ORDER_EVIDENCE_DOWNLOADED",
      entityType: "WorkOrderEvidence",
      entityId: evidence.id,
      metadata: {
        workOrderId: id,
        type: evidence.type,
        title: evidence.title,
        fileName: evidence.fileName,
        mimeType: evidence.mimeType,
        fileUrl: evidence.fileUrl,
      },
    });

    return {
      path: localPath,
      fileName: evidence.fileName ?? `${evidence.id}.bin`,
      mimeType: evidence.mimeType ?? "application/octet-stream",
      size: fileStats.size,
    };
  }

  async addEvidence(
    id: string,
    dto: CreateWorkOrderEvidenceDto,
    user: AuthenticatedUser,
  ) {
    const current = await this.ensureWorkOrderExists(id);
    this.ensureNotCancelled(current.status);

    const fileUrl = this.normalizeOptionalText(dto.fileUrl);

    if (dto.type !== WorkOrderEvidenceType.NOTE && !fileUrl) {
      throw new BadRequestException(
        "Las evidencias de foto o documento requieren fileUrl",
      );
    }

    const evidence = await this.prisma.workOrderEvidence.create({
      data: {
        workOrderId: id,
        type: dto.type,
        title: dto.title.trim(),
        description: this.normalizeOptionalText(dto.description),
        fileUrl,
        fileName: this.normalizeOptionalText(dto.fileName),
        mimeType: this.normalizeOptionalText(dto.mimeType),
        uploadedById: user.sub,
      },
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        fileUrl: true,
        fileName: true,
        mimeType: true,
        uploadedBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        voidedAt: true,
        voidedBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        voidReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.audit.record({
      actor: user,
      action: "WORK_ORDER_EVIDENCE_ADDED",
      entityType: "WorkOrderEvidence",
      entityId: evidence.id,
      metadata: {
        workOrderId: id,
        type: evidence.type,
        title: evidence.title,
        fileName: evidence.fileName,
      },
    });

    return evidence;
  }

  async uploadEvidence(
    id: string,
    dto: UploadWorkOrderEvidenceDto,
    file: Express.Multer.File | undefined,
    user: AuthenticatedUser,
    options?: { publicBaseUrl?: string },
  ) {
    if (!file) {
      throw new BadRequestException("Debe adjuntar un archivo de evidencia");
    }

    try {
      const current = await this.ensureWorkOrderExists(id);
      this.ensureNotCancelled(current.status);

      const type = dto.type ?? this.inferEvidenceType(file.mimetype);
      this.validateUploadedEvidenceType(type, file.mimetype);

      const relativeUrl = `/uploads/evidences/work-orders/${id}/${file.filename}`;
      const fileUrl = options?.publicBaseUrl
        ? `${options.publicBaseUrl.replace(/\/$/, "")}${relativeUrl}`
        : relativeUrl;

      const evidence = await this.prisma.workOrderEvidence.create({
        data: {
          workOrderId: id,
          type,
          title: this.normalizeOptionalText(dto.title) ?? file.originalname,
          description: this.normalizeOptionalText(dto.description),
          fileUrl,
          fileName: file.originalname,
          mimeType: file.mimetype,
          uploadedById: user.sub,
        },
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          fileUrl: true,
          fileName: true,
          mimeType: true,
          uploadedBy: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          voidedAt: true,
          voidedBy: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          voidReason: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await this.audit.record({
        actor: user,
        action: "WORK_ORDER_EVIDENCE_FILE_UPLOADED",
        entityType: "WorkOrderEvidence",
        entityId: evidence.id,
        metadata: {
          workOrderId: id,
          type: evidence.type,
          title: evidence.title,
          fileName: evidence.fileName,
          mimeType: evidence.mimeType,
          size: file.size,
          fileUrl: evidence.fileUrl,
        },
      });

      return evidence;
    } catch (error) {
      await this.removeUploadedFile(file.path);
      throw error;
    }
  }

  async voidEvidence(
    id: string,
    evidenceId: string,
    dto: VoidWorkOrderEvidenceDto,
    user: AuthenticatedUser,
  ) {
    await this.ensureWorkOrderExists(id);

    const current = await this.prisma.workOrderEvidence.findFirst({
      where: { id: evidenceId, workOrderId: id },
      select: {
        id: true,
        type: true,
        title: true,
        fileUrl: true,
        fileName: true,
        mimeType: true,
        voidedAt: true,
      },
    });

    if (!current) {
      throw new NotFoundException("Evidencia no encontrada");
    }

    if (current.voidedAt) {
      throw new ConflictException("La evidencia ya fue anulada");
    }

    const localPath = current.fileUrl
      ? this.resolveLocalEvidencePath(current.fileUrl)
      : null;
    const fileRemoved = localPath ? await this.removeUploadedFile(localPath) : false;

    const evidence = await this.prisma.workOrderEvidence.update({
      where: { id: evidenceId },
      data: {
        voidedAt: new Date(),
        voidedById: user.sub,
        voidReason: this.normalizeOptionalText(dto?.reason),
      },
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        fileUrl: true,
        fileName: true,
        mimeType: true,
        uploadedBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        voidedAt: true,
        voidedBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        voidReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.audit.record({
      actor: user,
      action: "WORK_ORDER_EVIDENCE_VOIDED",
      entityType: "WorkOrderEvidence",
      entityId: evidence.id,
      metadata: {
        workOrderId: id,
        type: current.type,
        title: current.title,
        fileName: current.fileName,
        mimeType: current.mimeType,
        fileUrl: current.fileUrl,
        fileRemoved,
        reason: evidence.voidReason,
      },
    });

    return evidence;
  }

  async close(id: string, dto: CloseWorkOrderDto, actor?: AuthenticatedUser) {
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
          finalNotes:
            dto.finalNotes === undefined
              ? undefined
              : this.normalizeOptionalText(dto.finalNotes),
          recommendations:
            dto.recommendations === undefined
              ? undefined
              : this.normalizeOptionalText(dto.recommendations),
        },
        select: workOrderSelect,
      });
    });

    await this.audit.record({
      actor,
      action: "WORK_ORDER_CLOSED",
      entityType: "WorkOrder",
      entityId: workOrder.id,
      metadata: {
        number: workOrder.number,
        assetId: workOrder.assetId,
        completedAt: workOrder.completedAt?.toISOString() ?? null,
        spareParts: workOrder.spareParts.map((part) => ({
          sparePartId: part.sparePart.id,
          sku: part.sparePart.sku,
          quantity: part.quantity,
        })),
      },
    });

    return this.toWorkOrderResponse(workOrder);
  }

  async cancel(id: string, actor?: AuthenticatedUser) {
    const current = await this.ensureWorkOrderExists(id);
    this.ensureNotTerminal(current.status);

    const workOrder = await this.prisma.workOrder.update({
      where: { id },
      data: { status: WorkOrderStatus.CANCELLED },
      select: workOrderSelect,
    });

    await this.audit.record({
      actor,
      action: "WORK_ORDER_CANCELLED",
      entityType: "WorkOrder",
      entityId: workOrder.id,
      metadata: {
        number: workOrder.number,
        previousStatus: current.status,
        status: workOrder.status,
      },
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

  private ensureNotCancelled(status: WorkOrderStatus) {
    if (status === WorkOrderStatus.CANCELLED) {
      throw new BadRequestException("No se puede modificar una orden cancelada");
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

  private inferEvidenceType(mimeType: string) {
    return mimeType.startsWith("image/")
      ? WorkOrderEvidenceType.PHOTO
      : WorkOrderEvidenceType.DOCUMENT;
  }

  private validateUploadedEvidenceType(
    type: WorkOrderEvidenceType,
    mimeType: string,
  ) {
    if (type === WorkOrderEvidenceType.NOTE) {
      throw new BadRequestException(
        "La carga de archivo solo permite evidencias PHOTO o DOCUMENT",
      );
    }

    if (type === WorkOrderEvidenceType.PHOTO && !mimeType.startsWith("image/")) {
      throw new BadRequestException(
        "Las evidencias PHOTO requieren un archivo de imagen",
      );
    }

    if (type === WorkOrderEvidenceType.DOCUMENT && mimeType.startsWith("image/")) {
      throw new BadRequestException(
        "Las evidencias DOCUMENT requieren un archivo documental",
      );
    }
  }

  private async removeUploadedFile(path: string) {
    try {
      await unlink(path);
      return true;
    } catch {
      return false;
    }
  }

  private resolveLocalEvidencePath(fileUrl: string) {
    const pathname = this.extractFilePathname(fileUrl);

    if (!pathname.startsWith("/uploads/")) {
      return null;
    }

    const uploadRoot = resolve(
      this.config.get<string>("UPLOAD_ROOT") ?? "storage",
    );
    const relativePath = pathname.replace(/^\/uploads\//, "");
    const targetPath = resolve(uploadRoot, relativePath);

    if (targetPath === uploadRoot || !targetPath.startsWith(`${uploadRoot}${sep}`)) {
      throw new BadRequestException("Ruta de evidencia no permitida");
    }

    return targetPath;
  }

  private extractFilePathname(fileUrl: string) {
    try {
      return new URL(fileUrl).pathname;
    } catch {
      return fileUrl;
    }
  }

  private toWorkOrderAuditState(workOrder: {
    id: string;
    status: WorkOrderStatus;
    startedAt: Date | null;
    assetId: string;
  }) {
    return {
      id: workOrder.id,
      status: workOrder.status,
      startedAt: workOrder.startedAt?.toISOString() ?? null,
      assetId: workOrder.assetId,
    };
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
      finalNotes: workOrder.finalNotes,
      recommendations: workOrder.recommendations,
      spareParts: workOrder.spareParts.map((part) => ({
        sparePart: part.sparePart,
        quantity: part.quantity,
      })),
      checklistItems: workOrder.checklistItems,
      evidences: workOrder.evidences,
      createdAt: workOrder.createdAt,
      updatedAt: workOrder.updatedAt,
    };
  }
}
