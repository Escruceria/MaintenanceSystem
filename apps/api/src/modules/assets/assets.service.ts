import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AssetStatus, MaintenanceType, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAssetDto } from "./dto/create-asset.dto";
import { UpdateAssetDto } from "./dto/update-asset.dto";

const assetSelect = Prisma.validator<Prisma.AssetSelect>()({
  id: true,
  code: true,
  name: true,
  description: true,
  serialNumber: true,
  brand: true,
  model: true,
  qrCode: true,
  status: true,
  locationId: true,
  location: {
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      isActive: true,
    },
  },
  _count: {
    select: {
      workOrders: true,
      requests: true,
    },
  },
  createdAt: true,
  updatedAt: true,
});

type AssetWithRelations = Prisma.AssetGetPayload<{
  select: typeof assetSelect;
}>;

const assetHistorySelect = Prisma.validator<Prisma.AssetSelect>()({
  id: true,
  code: true,
  name: true,
  description: true,
  serialNumber: true,
  brand: true,
  model: true,
  qrCode: true,
  status: true,
  location: {
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      isActive: true,
    },
  },
  workOrders: {
    select: {
      id: true,
      number: true,
      title: true,
      description: true,
      type: true,
      priority: true,
      status: true,
      scheduledAt: true,
      startedAt: true,
      completedAt: true,
      finalNotes: true,
      recommendations: true,
      assignedTechnician: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      maintenancePlan: {
        select: {
          id: true,
          code: true,
          name: true,
          frequencyType: true,
        },
      },
      spareParts: {
        select: {
          quantity: true,
          sparePart: {
            select: {
              id: true,
              sku: true,
              name: true,
              unit: true,
            },
          },
        },
        orderBy: { sparePart: { name: "asc" } },
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
        },
        orderBy: [{ createdAt: "desc" }],
      },
      checklistItems: {
        select: {
          id: true,
          title: true,
          status: true,
          isRequired: true,
          executedAt: true,
          executedBy: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ createdAt: "desc" }],
  },
  createdAt: true,
  updatedAt: true,
});

type AssetHistoryWithRelations = Prisma.AssetGetPayload<{
  select: typeof assetHistorySelect;
}>;

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAssetDto) {
    const code = this.normalizeCode(dto.code);
    const qrCode =
      this.normalizeQrCode(dto.qrCode) ?? this.generateQrCode(code);

    await this.ensureCodeIsAvailable(code);
    await this.ensureQrCodeIsAvailable(qrCode);

    if (dto.locationId) {
      await this.ensureLocationExists(dto.locationId);
    }

    const asset = await this.prisma.asset.create({
      data: {
        code,
        name: dto.name.trim(),
        description: this.normalizeOptionalText(dto.description),
        serialNumber: this.normalizeOptionalText(dto.serialNumber),
        brand: this.normalizeOptionalText(dto.brand),
        model: this.normalizeOptionalText(dto.model),
        qrCode,
        status: dto.status ?? AssetStatus.ACTIVE,
        locationId: dto.locationId,
      },
      select: assetSelect,
    });

    return this.toAssetResponse(asset);
  }

  async findAll() {
    const assets = await this.prisma.asset.findMany({
      select: assetSelect,
      orderBy: [{ status: "asc" }, { code: "asc" }],
    });

    return assets.map((asset) => this.toAssetResponse(asset));
  }

  async findOne(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      select: assetSelect,
    });

    if (!asset) {
      throw new NotFoundException("Activo no encontrado");
    }

    return this.toAssetResponse(asset);
  }

  async getHistory(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      select: assetHistorySelect,
    });

    if (!asset) {
      throw new NotFoundException("Activo no encontrado");
    }

    return this.toAssetHistoryResponse(asset);
  }

  async update(id: string, dto: UpdateAssetDto) {
    await this.ensureAssetExists(id);

    if (dto.code) {
      await this.ensureCodeIsAvailable(this.normalizeCode(dto.code), id);
    }

    if (dto.qrCode !== undefined && dto.qrCode !== null) {
      await this.ensureQrCodeIsAvailable(this.normalizeQrCode(dto.qrCode)!, id);
    }

    if (dto.locationId !== undefined && dto.locationId !== null) {
      await this.ensureLocationExists(dto.locationId);
    }

    const asset = await this.prisma.asset.update({
      where: { id },
      data: {
        code: dto.code ? this.normalizeCode(dto.code) : undefined,
        name: dto.name?.trim(),
        description:
          dto.description === undefined
            ? undefined
            : this.normalizeOptionalText(dto.description),
        serialNumber:
          dto.serialNumber === undefined
            ? undefined
            : this.normalizeOptionalText(dto.serialNumber),
        brand:
          dto.brand === undefined
            ? undefined
            : this.normalizeOptionalText(dto.brand),
        model:
          dto.model === undefined
            ? undefined
            : this.normalizeOptionalText(dto.model),
        qrCode:
          dto.qrCode === undefined
            ? undefined
            : this.normalizeQrCode(dto.qrCode),
        status: dto.status,
        locationId: dto.locationId,
      },
      select: assetSelect,
    });

    return this.toAssetResponse(asset);
  }

  async activate(id: string) {
    await this.ensureAssetExists(id);

    const asset = await this.prisma.asset.update({
      where: { id },
      data: { status: AssetStatus.ACTIVE },
      select: assetSelect,
    });

    return this.toAssetResponse(asset);
  }

  async retire(id: string) {
    await this.ensureAssetExists(id);

    const asset = await this.prisma.asset.update({
      where: { id },
      data: { status: AssetStatus.RETIRED },
      select: assetSelect,
    });

    return this.toAssetResponse(asset);
  }

  async remove(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            workOrders: true,
            requests: true,
          },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException("Activo no encontrado");
    }

    if (asset._count.workOrders > 0 || asset._count.requests > 0) {
      throw new BadRequestException(
        "No se puede eliminar un activo con ordenes o solicitudes asociadas",
      );
    }

    await this.prisma.asset.delete({ where: { id } });

    return { success: true };
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

  private async ensureLocationExists(id: string) {
    const location = await this.prisma.location.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!location) {
      throw new NotFoundException("Ubicacion no encontrada");
    }
  }

  private async ensureCodeIsAvailable(code: string, currentAssetId?: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { code },
      select: { id: true },
    });

    if (asset && asset.id !== currentAssetId) {
      throw new ConflictException("Ya existe un activo con este codigo");
    }
  }

  private async ensureQrCodeIsAvailable(
    qrCode: string,
    currentAssetId?: string,
  ) {
    const asset = await this.prisma.asset.findUnique({
      where: { qrCode },
      select: { id: true },
    });

    if (asset && asset.id !== currentAssetId) {
      throw new ConflictException("Ya existe un activo con este QR");
    }
  }

  private normalizeCode(code: string) {
    return code.trim().toUpperCase();
  }

  private normalizeQrCode(qrCode?: string | null) {
    const normalized = qrCode?.trim();

    return normalized ? normalized : null;
  }

  private generateQrCode(code: string) {
    return `MS-ASSET:${code}`;
  }

  private normalizeOptionalText(value?: string | null) {
    const normalized = value?.trim();

    return normalized ? normalized : null;
  }

  private toAssetResponse(asset: AssetWithRelations) {
    return {
      id: asset.id,
      code: asset.code,
      name: asset.name,
      description: asset.description,
      serialNumber: asset.serialNumber,
      brand: asset.brand,
      model: asset.model,
      qrCode: asset.qrCode,
      status: asset.status,
      locationId: asset.locationId,
      location: asset.location,
      workOrdersCount: asset._count.workOrders,
      requestsCount: asset._count.requests,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    };
  }

  private toAssetHistoryResponse(asset: AssetHistoryWithRelations) {
    const maintenanceByType = this.createMaintenanceTypeSummary();
    const technicians = new Map<
      string,
      { id: string; email: string; name: string; workOrdersCount: number }
    >();
    const spareParts = new Map<
      string,
      { id: string; sku: string; name: string; unit: string; quantity: number }
    >();
    const evidences = asset.workOrders.flatMap((workOrder) =>
      workOrder.evidences.map((evidence) => ({
        ...evidence,
        workOrder: {
          id: workOrder.id,
          number: workOrder.number,
          title: workOrder.title,
          type: workOrder.type,
          status: workOrder.status,
        },
      })),
    );

    for (const workOrder of asset.workOrders) {
      maintenanceByType[workOrder.type] += 1;

      if (workOrder.assignedTechnician) {
        const current = technicians.get(workOrder.assignedTechnician.id);
        technicians.set(workOrder.assignedTechnician.id, {
          ...workOrder.assignedTechnician,
          workOrdersCount: (current?.workOrdersCount ?? 0) + 1,
        });
      }

      for (const part of workOrder.spareParts) {
        const current = spareParts.get(part.sparePart.id);
        spareParts.set(part.sparePart.id, {
          ...part.sparePart,
          quantity: (current?.quantity ?? 0) + part.quantity,
        });
      }
    }

    const completedOrders = asset.workOrders.filter(
      (workOrder) => workOrder.completedAt,
    );
    const lastMaintenanceAt =
      completedOrders[0]?.completedAt ??
      asset.workOrders[0]?.completedAt ??
      null;

    return {
      asset: {
        id: asset.id,
        code: asset.code,
        name: asset.name,
        description: asset.description,
        serialNumber: asset.serialNumber,
        brand: asset.brand,
        model: asset.model,
        qrCode: asset.qrCode,
        status: asset.status,
        location: asset.location,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
      },
      summary: {
        workOrdersCount: asset.workOrders.length,
        maintenanceByType,
        evidencesCount: evidences.length,
        sparePartsCount: [...spareParts.values()].reduce(
          (total, part) => total + part.quantity,
          0,
        ),
        techniciansCount: technicians.size,
        lastMaintenanceAt,
      },
      workOrders: asset.workOrders.map((workOrder) => ({
        id: workOrder.id,
        number: workOrder.number,
        title: workOrder.title,
        description: workOrder.description,
        type: workOrder.type,
        priority: workOrder.priority,
        status: workOrder.status,
        scheduledAt: workOrder.scheduledAt,
        startedAt: workOrder.startedAt,
        completedAt: workOrder.completedAt,
        finalNotes: workOrder.finalNotes,
        recommendations: workOrder.recommendations,
        assignedTechnician: workOrder.assignedTechnician,
        maintenancePlan: workOrder.maintenancePlan,
        spareParts: workOrder.spareParts.map((part) => ({
          sparePart: part.sparePart,
          quantity: part.quantity,
        })),
        evidences: workOrder.evidences,
        checklistItems: workOrder.checklistItems,
        createdAt: workOrder.createdAt,
        updatedAt: workOrder.updatedAt,
      })),
      evidences,
      spareParts: [...spareParts.values()].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
      technicians: [...technicians.values()].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
      statusTimeline: this.buildStatusTimeline(asset),
    };
  }

  private createMaintenanceTypeSummary() {
    return {
      [MaintenanceType.CORRECTIVE]: 0,
      [MaintenanceType.PREVENTIVE]: 0,
      [MaintenanceType.PREDICTIVE]: 0,
      [MaintenanceType.INSPECTION]: 0,
    };
  }

  private buildStatusTimeline(asset: AssetHistoryWithRelations) {
    const events = [
      {
        date: asset.createdAt,
        status: "REGISTERED",
        title: "Activo registrado",
        workOrder: null,
      },
      ...asset.workOrders.flatMap((workOrder) => [
        {
          date: workOrder.createdAt,
          status: workOrder.status,
          title: `Orden ${workOrder.number} creada`,
          workOrder: {
            id: workOrder.id,
            number: workOrder.number,
            title: workOrder.title,
          },
        },
        ...(workOrder.startedAt
          ? [
              {
                date: workOrder.startedAt,
                status: "IN_MAINTENANCE",
                title: `Orden ${workOrder.number} iniciada`,
                workOrder: {
                  id: workOrder.id,
                  number: workOrder.number,
                  title: workOrder.title,
                },
              },
            ]
          : []),
        ...(workOrder.completedAt
          ? [
              {
                date: workOrder.completedAt,
                status: "ACTIVE",
                title: `Orden ${workOrder.number} cerrada`,
                workOrder: {
                  id: workOrder.id,
                  number: workOrder.number,
                  title: workOrder.title,
                },
              },
            ]
          : []),
      ]),
      {
        date: asset.updatedAt,
        status: asset.status,
        title: "Estado actual del activo",
        workOrder: null,
      },
    ];

    return events
      .filter((event) => event.date)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}
