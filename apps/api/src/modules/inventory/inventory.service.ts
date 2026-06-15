import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser } from "../auth/types/authenticated-user";
import { PrismaService } from "../prisma/prisma.service";
import { AdjustStockDto } from "./dto/adjust-stock.dto";
import { CreateSparePartDto } from "./dto/create-spare-part.dto";
import { UpdateSparePartDto } from "./dto/update-spare-part.dto";

const sparePartSelect = Prisma.validator<Prisma.SparePartSelect>()({
  id: true,
  sku: true,
  name: true,
  description: true,
  unit: true,
  stock: true,
  minimumStock: true,
  _count: {
    select: {
      workOrderUsages: true,
    },
  },
  createdAt: true,
  updatedAt: true,
});

type SparePartWithUsage = Prisma.SparePartGetPayload<{
  select: typeof sparePartSelect;
}>;

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createSparePart(dto: CreateSparePartDto, actor?: AuthenticatedUser) {
    const sku = this.normalizeSku(dto.sku);
    await this.ensureSkuIsAvailable(sku);

    const sparePart = await this.prisma.sparePart.create({
      data: {
        sku,
        name: dto.name.trim(),
        description: this.normalizeOptionalText(dto.description),
        unit: this.normalizeUnit(dto.unit),
        stock: dto.stock ?? 0,
        minimumStock: dto.minimumStock ?? 0,
      },
      select: sparePartSelect,
    });

    await this.audit.record({
      actor,
      action: "SPARE_PART_CREATED",
      entityType: "SparePart",
      entityId: sparePart.id,
      metadata: {
        sku: sparePart.sku,
        name: sparePart.name,
        stock: sparePart.stock,
        minimumStock: sparePart.minimumStock,
      },
    });

    return this.toSparePartResponse(sparePart);
  }

  async findSpareParts() {
    const spareParts = await this.prisma.sparePart.findMany({
      select: sparePartSelect,
      orderBy: [{ name: "asc" }, { sku: "asc" }],
    });

    return spareParts.map((sparePart) => this.toSparePartResponse(sparePart));
  }

  async findLowStockSpareParts() {
    const spareParts = await this.prisma.sparePart.findMany({
      where: {
        stock: {
          lte: this.prisma.sparePart.fields.minimumStock,
        },
      },
      select: sparePartSelect,
      orderBy: [{ stock: "asc" }, { name: "asc" }],
    });

    return spareParts.map((sparePart) => this.toSparePartResponse(sparePart));
  }

  async findSparePart(id: string) {
    const sparePart = await this.prisma.sparePart.findUnique({
      where: { id },
      select: sparePartSelect,
    });

    if (!sparePart) {
      throw new NotFoundException("Repuesto no encontrado");
    }

    return this.toSparePartResponse(sparePart);
  }

  async updateSparePart(
    id: string,
    dto: UpdateSparePartDto,
    actor?: AuthenticatedUser,
  ) {
    const previous = await this.getAuditSnapshot(id);

    if (dto.sku) {
      await this.ensureSkuIsAvailable(this.normalizeSku(dto.sku), id);
    }

    const sparePart = await this.prisma.sparePart.update({
      where: { id },
      data: {
        sku: dto.sku ? this.normalizeSku(dto.sku) : undefined,
        name: dto.name?.trim(),
        description:
          dto.description === undefined
            ? undefined
            : this.normalizeOptionalText(dto.description),
        unit: dto.unit ? this.normalizeUnit(dto.unit) : undefined,
        stock: dto.stock,
        minimumStock: dto.minimumStock,
      },
      select: sparePartSelect,
    });

    await this.audit.record({
      actor,
      action: "SPARE_PART_UPDATED",
      entityType: "SparePart",
      entityId: sparePart.id,
      metadata: {
        before: previous,
        after: this.toSparePartAuditState(sparePart),
      },
    });

    return this.toSparePartResponse(sparePart);
  }

  async adjustStock(
    id: string,
    dto: AdjustStockDto,
    actor?: AuthenticatedUser,
  ) {
    const sparePart = await this.prisma.sparePart.findUnique({
      where: { id },
      select: { id: true, stock: true },
    });

    if (!sparePart) {
      throw new NotFoundException("Repuesto no encontrado");
    }

    const nextStock = sparePart.stock + dto.quantity;

    if (nextStock < 0) {
      throw new BadRequestException("El ajuste deja el stock en negativo");
    }

    const updated = await this.prisma.sparePart.update({
      where: { id },
      data: { stock: nextStock },
      select: sparePartSelect,
    });

    const response = {
      ...this.toSparePartResponse(updated),
      adjustment: {
        quantity: dto.quantity,
        reason: dto.reason.trim(),
      },
    };

    await this.audit.record({
      actor,
      action: "SPARE_PART_STOCK_ADJUSTED",
      entityType: "SparePart",
      entityId: updated.id,
      metadata: {
        sku: updated.sku,
        previousStock: sparePart.stock,
        quantity: dto.quantity,
        nextStock,
        reason: dto.reason.trim(),
      },
    });

    return response;
  }

  async removeSparePart(id: string, actor?: AuthenticatedUser) {
    const sparePart = await this.prisma.sparePart.findUnique({
      where: { id },
      select: {
        id: true,
        sku: true,
        name: true,
        stock: true,
        minimumStock: true,
        _count: {
          select: {
            workOrderUsages: true,
          },
        },
      },
    });

    if (!sparePart) {
      throw new NotFoundException("Repuesto no encontrado");
    }

    if (sparePart._count.workOrderUsages > 0) {
      throw new BadRequestException(
        "No se puede eliminar un repuesto usado en ordenes de trabajo",
      );
    }

    await this.prisma.sparePart.delete({ where: { id } });

    await this.audit.record({
      actor,
      action: "SPARE_PART_DELETED",
      entityType: "SparePart",
      entityId: id,
      metadata: {
        sku: sparePart.sku,
        name: sparePart.name,
        stock: sparePart.stock,
        minimumStock: sparePart.minimumStock,
      },
    });

    return { success: true };
  }

  private async ensureSparePartExists(id: string) {
    const sparePart = await this.prisma.sparePart.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!sparePart) {
      throw new NotFoundException("Repuesto no encontrado");
    }
  }

  private async getAuditSnapshot(id: string) {
    const sparePart = await this.prisma.sparePart.findUnique({
      where: { id },
      select: {
        id: true,
        sku: true,
        name: true,
        unit: true,
        stock: true,
        minimumStock: true,
      },
    });

    if (!sparePart) {
      throw new NotFoundException("Repuesto no encontrado");
    }

    return sparePart;
  }

  private async ensureSkuIsAvailable(sku: string, currentSparePartId?: string) {
    const sparePart = await this.prisma.sparePart.findUnique({
      where: { sku },
      select: { id: true },
    });

    if (sparePart && sparePart.id !== currentSparePartId) {
      throw new ConflictException("Ya existe un repuesto con este SKU");
    }
  }

  private normalizeSku(sku: string) {
    return sku.trim().toUpperCase();
  }

  private normalizeUnit(unit: string) {
    return unit.trim().toUpperCase();
  }

  private normalizeOptionalText(value?: string | null) {
    const normalized = value?.trim();

    return normalized ? normalized : null;
  }

  private toSparePartResponse(sparePart: SparePartWithUsage) {
    return {
      id: sparePart.id,
      sku: sparePart.sku,
      name: sparePart.name,
      description: sparePart.description,
      unit: sparePart.unit,
      stock: sparePart.stock,
      minimumStock: sparePart.minimumStock,
      isLowStock: sparePart.stock <= sparePart.minimumStock,
      workOrderUsagesCount: sparePart._count.workOrderUsages,
      createdAt: sparePart.createdAt,
      updatedAt: sparePart.updatedAt,
    };
  }

  private toSparePartAuditState(sparePart: SparePartWithUsage) {
    return {
      id: sparePart.id,
      sku: sparePart.sku,
      name: sparePart.name,
      unit: sparePart.unit,
      stock: sparePart.stock,
      minimumStock: sparePart.minimumStock,
    };
  }
}
