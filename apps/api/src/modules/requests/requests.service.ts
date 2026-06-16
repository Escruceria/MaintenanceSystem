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
  ServiceRequestStatus,
  UserStatus,
  WorkOrderPriority,
  WorkOrderStatus,
} from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser } from "../auth/types/authenticated-user";
import { PrismaService } from "../prisma/prisma.service";
import { ConvertServiceRequestDto } from "./dto/convert-service-request.dto";
import { CreateServiceRequestDto } from "./dto/create-service-request.dto";
import { ResolveServiceRequestDto } from "./dto/resolve-service-request.dto";
import { UpdateServiceRequestDto } from "./dto/update-service-request.dto";

const serviceRequestSelect = Prisma.validator<Prisma.ServiceRequestSelect>()({
  id: true,
  title: true,
  description: true,
  priority: true,
  status: true,
  assetId: true,
  asset: {
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
    },
  },
  requester: {
    select: {
      id: true,
      email: true,
      name: true,
    },
  },
  workOrder: {
    select: {
      id: true,
      number: true,
      title: true,
      status: true,
    },
  },
  reviewedAt: true,
  approvedAt: true,
  rejectedAt: true,
  closedAt: true,
  convertedAt: true,
  resolution: true,
  createdAt: true,
  updatedAt: true,
});

const terminalRequestStatuses = new Set<ServiceRequestStatus>([
  ServiceRequestStatus.REJECTED,
  ServiceRequestStatus.CONVERTED,
  ServiceRequestStatus.CLOSED,
]);

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateServiceRequestDto, actor: AuthenticatedUser) {
    if (dto.assetId) {
      await this.ensureAssetExists(dto.assetId);
    }

    const request = await this.prisma.serviceRequest.create({
      data: {
        title: dto.title.trim(),
        description: this.normalizeOptionalText(dto.description),
        priority: dto.priority ?? WorkOrderPriority.MEDIUM,
        assetId: dto.assetId,
        requesterId: actor.sub,
      },
      select: serviceRequestSelect,
    });

    await this.audit.record({
      actor,
      action: "SERVICE_REQUEST_CREATED",
      entityType: "ServiceRequest",
      entityId: request.id,
      metadata: {
        title: request.title,
        priority: request.priority,
        assetId: request.assetId,
      },
    });

    return request;
  }

  findAll() {
    return this.prisma.serviceRequest.findMany({
      select: serviceRequestSelect,
      orderBy: [{ createdAt: "desc" }],
    });
  }

  async findOne(id: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
      select: serviceRequestSelect,
    });

    if (!request) {
      throw new NotFoundException("Solicitud de servicio no encontrada");
    }

    return request;
  }

  async update(
    id: string,
    dto: UpdateServiceRequestDto,
    actor: AuthenticatedUser,
  ) {
    const current = await this.ensureRequestExists(id);
    this.ensureRequestIsEditable(current.status);

    if (dto.assetId) {
      await this.ensureAssetExists(dto.assetId);
    }

    const request = await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description:
          dto.description === undefined
            ? undefined
            : this.normalizeOptionalText(dto.description),
        priority: dto.priority,
        assetId: dto.assetId,
      },
      select: serviceRequestSelect,
    });

    await this.audit.record({
      actor,
      action: "SERVICE_REQUEST_UPDATED",
      entityType: "ServiceRequest",
      entityId: request.id,
      metadata: {
        before: {
          title: current.title,
          priority: current.priority,
          assetId: current.assetId,
        },
        after: {
          title: request.title,
          priority: request.priority,
          assetId: request.assetId,
        },
      },
    });

    return request;
  }

  markInReview(id: string, actor: AuthenticatedUser) {
    return this.changeStatus(id, ServiceRequestStatus.IN_REVIEW, actor, {
      reviewedAt: new Date(),
      action: "SERVICE_REQUEST_MARKED_IN_REVIEW",
    });
  }

  approve(
    id: string,
    dto: ResolveServiceRequestDto,
    actor: AuthenticatedUser,
  ) {
    return this.changeStatus(id, ServiceRequestStatus.APPROVED, actor, {
      approvedAt: new Date(),
      resolution: this.normalizeOptionalText(dto.resolution),
      action: "SERVICE_REQUEST_APPROVED",
    });
  }

  reject(id: string, dto: ResolveServiceRequestDto, actor: AuthenticatedUser) {
    return this.changeStatus(id, ServiceRequestStatus.REJECTED, actor, {
      rejectedAt: new Date(),
      resolution: this.normalizeOptionalText(dto.resolution),
      action: "SERVICE_REQUEST_REJECTED",
    });
  }

  close(id: string, dto: ResolveServiceRequestDto, actor: AuthenticatedUser) {
    return this.changeStatus(id, ServiceRequestStatus.CLOSED, actor, {
      closedAt: new Date(),
      resolution: this.normalizeOptionalText(dto.resolution),
      action: "SERVICE_REQUEST_CLOSED",
    });
  }

  async convertToWorkOrder(
    id: string,
    dto: ConvertServiceRequestDto,
    actor: AuthenticatedUser,
  ) {
    const current = await this.ensureRequestExists(id);

    if (current.status !== ServiceRequestStatus.APPROVED) {
      throw new BadRequestException(
        "Solo se pueden convertir solicitudes aprobadas",
      );
    }

    if (current.workOrderId) {
      throw new ConflictException("La solicitud ya fue convertida en orden");
    }

    const assetId = dto.assetId ?? current.assetId;

    if (!assetId) {
      throw new BadRequestException(
        "La solicitud requiere activo para convertirse en orden",
      );
    }

    await this.ensureAssetExists(assetId);

    if (dto.assignedTechnicianId) {
      await this.ensureTechnicianExists(dto.assignedTechnicianId);
    }

    const number = await this.generateWorkOrderNumber();

    const result = await this.prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.create({
        data: {
          number,
          title: dto.title?.trim() ?? current.title,
          description:
            this.normalizeOptionalText(dto.description) ?? current.description,
          type: dto.type ?? MaintenanceType.CORRECTIVE,
          priority: dto.priority ?? current.priority,
          status: dto.assignedTechnicianId
            ? WorkOrderStatus.ASSIGNED
            : WorkOrderStatus.OPEN,
          assetId,
          assignedTechnicianId: dto.assignedTechnicianId,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        },
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          type: true,
          priority: true,
          assetId: true,
          assignedTechnicianId: true,
        },
      });

      const request = await tx.serviceRequest.update({
        where: { id },
        data: {
          status: ServiceRequestStatus.CONVERTED,
          workOrderId: workOrder.id,
          convertedAt: new Date(),
          resolution: "Solicitud convertida en orden de trabajo.",
        },
        select: serviceRequestSelect,
      });

      return { request, workOrder };
    });

    await this.audit.record({
      actor,
      action: "SERVICE_REQUEST_CONVERTED",
      entityType: "ServiceRequest",
      entityId: result.request.id,
      metadata: {
        workOrderId: result.workOrder.id,
        workOrderNumber: result.workOrder.number,
        assetId,
      },
    });

    await this.audit.record({
      actor,
      action: "WORK_ORDER_CREATED",
      entityType: "WorkOrder",
      entityId: result.workOrder.id,
      metadata: {
        number: result.workOrder.number,
        status: result.workOrder.status,
        type: result.workOrder.type,
        priority: result.workOrder.priority,
        assetId: result.workOrder.assetId,
        assignedTechnicianId: result.workOrder.assignedTechnicianId,
        source: "ServiceRequest",
        serviceRequestId: result.request.id,
      },
    });

    return result;
  }

  private async changeStatus(
    id: string,
    status: ServiceRequestStatus,
    actor: AuthenticatedUser,
    options: {
      action: string;
      reviewedAt?: Date;
      approvedAt?: Date;
      rejectedAt?: Date;
      closedAt?: Date;
      resolution?: string | null;
    },
  ) {
    const current = await this.ensureRequestExists(id);
    this.validateStatusTransition(current.status, status);

    const request = await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status,
        reviewedAt: options.reviewedAt,
        approvedAt: options.approvedAt,
        rejectedAt: options.rejectedAt,
        closedAt: options.closedAt,
        resolution: options.resolution,
      },
      select: serviceRequestSelect,
    });

    await this.audit.record({
      actor,
      action: options.action,
      entityType: "ServiceRequest",
      entityId: request.id,
      metadata: {
        previousStatus: current.status,
        status: request.status,
        resolution: request.resolution,
      },
    });

    return request;
  }

  private validateStatusTransition(
    current: ServiceRequestStatus,
    next: ServiceRequestStatus,
  ) {
    if (terminalRequestStatuses.has(current)) {
      throw new ConflictException(
        "No se puede modificar una solicitud en estado terminal",
      );
    }

    if (next === ServiceRequestStatus.IN_REVIEW && current !== ServiceRequestStatus.OPEN) {
      throw new BadRequestException(
        "Solo las solicitudes abiertas pueden pasar a revision",
      );
    }

    if (
      next === ServiceRequestStatus.APPROVED &&
      current !== ServiceRequestStatus.OPEN &&
      current !== ServiceRequestStatus.IN_REVIEW
    ) {
      throw new BadRequestException(
        "Solo las solicitudes abiertas o en revision pueden aprobarse",
      );
    }
  }

  private ensureRequestIsEditable(status: ServiceRequestStatus) {
    if (terminalRequestStatuses.has(status)) {
      throw new ConflictException(
        "No se puede editar una solicitud en estado terminal",
      );
    }
  }

  private async ensureRequestExists(id: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        status: true,
        assetId: true,
        workOrderId: true,
      },
    });

    if (!request) {
      throw new NotFoundException("Solicitud de servicio no encontrada");
    }

    return request;
  }

  private async ensureAssetExists(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!asset) {
      throw new NotFoundException("Activo no encontrado");
    }

    if (asset.status !== AssetStatus.ACTIVE) {
      throw new BadRequestException("El activo debe estar activo");
    }
  }

  private async ensureTechnicianExists(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException("El tecnico asignado debe ser un usuario activo");
    }
  }

  private async generateWorkOrderNumber() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const prefix = `OT-${yyyy}${mm}${dd}`;
    const count = await this.prisma.workOrder.count({
      where: { number: { startsWith: prefix } },
    });

    return `${prefix}-${String(count + 1).padStart(4, "0")}`;
  }

  private normalizeOptionalText(value?: string | null) {
    const normalized = value?.trim();

    return normalized ? normalized : null;
  }
}
