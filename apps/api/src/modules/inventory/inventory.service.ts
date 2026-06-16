import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InventoryMovementType, Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser } from "../auth/types/authenticated-user";
import { PrismaService } from "../prisma/prisma.service";
import { AdjustStockDto } from "./dto/adjust-stock.dto";
import { CreateInventoryMovementDto } from "./dto/create-inventory-movement.dto";
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

const inventoryMovementSelect = Prisma.validator<Prisma.InventoryMovementSelect>()({
  id: true,
  type: true,
  quantity: true,
  previousStock: true,
  nextStock: true,
  reason: true,
  reference: true,
  workOrder: {
    select: {
      id: true,
      number: true,
      title: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      email: true,
      name: true,
    },
  },
  createdAt: true,
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
    const initialStock = dto.stock ?? 0;

    const sparePart = await this.prisma.$transaction(async (tx) => {
      const created = await tx.sparePart.create({
        data: {
          sku,
          name: dto.name.trim(),
          description: this.normalizeOptionalText(dto.description),
          unit: this.normalizeUnit(dto.unit),
          stock: initialStock,
          minimumStock: dto.minimumStock ?? 0,
        },
        select: sparePartSelect,
      });

      if (initialStock !== 0) {
        await this.createMovementRecord(tx, {
          sparePartId: created.id,
          type: InventoryMovementType.INITIAL,
          quantity: initialStock,
          previousStock: 0,
          nextStock: initialStock,
          reason: "Stock inicial",
          actor,
        });
      }

      return created;
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

    const sparePart = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.sparePart.update({
        where: { id },
        data: {
          sku: dto.sku ? this.normalizeSku(dto.sku) : undefined,
          name: dto.name?.trim(),
          description:
            dto.description === undefined
              ? undefined
              : this.normalizeOptionalText(dto.description),
          unit: dto.unit ? this.normalizeUnit(dto.unit) : undefined,
          minimumStock: dto.minimumStock,
        },
        select: sparePartSelect,
      });

      if (dto.stock === undefined || dto.stock === previous.stock) {
        return updated;
      }

      if (dto.stock < 0) {
        throw new BadRequestException("El stock no puede ser negativo");
      }

      const stockUpdated = await tx.sparePart.update({
        where: { id },
        data: { stock: dto.stock },
        select: sparePartSelect,
      });

      await this.createMovementRecord(tx, {
        sparePartId: id,
        type: InventoryMovementType.ADJUSTMENT,
        quantity: dto.stock - previous.stock,
        previousStock: previous.stock,
        nextStock: dto.stock,
        reason: "Ajuste de stock desde actualizacion de repuesto",
        actor,
      });

      return stockUpdated;
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
    return this.createMovement(
      id,
      {
        type: InventoryMovementType.ADJUSTMENT,
        quantity: dto.quantity,
        reason: dto.reason,
      },
      actor,
    );
  }

  async createMovement(
    id: string,
    dto: CreateInventoryMovementDto,
    actor?: AuthenticatedUser,
  ) {
    this.validateMovement(dto);

    const result = await this.prisma.$transaction(async (tx) => {
      const sparePart = await tx.sparePart.findUnique({
        where: { id },
        select: { id: true, sku: true, stock: true },
      });

      if (!sparePart) {
        throw new NotFoundException("Repuesto no encontrado");
      }

      const nextStock = sparePart.stock + dto.quantity;

      if (nextStock < 0) {
        throw new BadRequestException("El movimiento deja el stock en negativo");
      }

      const updated = await tx.sparePart.update({
        where: { id },
        data: { stock: nextStock },
        select: sparePartSelect,
      });

      const movement = await this.createMovementRecord(tx, {
        sparePartId: id,
        type: dto.type,
        quantity: dto.quantity,
        previousStock: sparePart.stock,
        nextStock,
        reason: dto.reason.trim(),
        reference: this.normalizeOptionalText(dto.reference),
        actor,
      });

      return { sparePart: updated, movement };
    });

    await this.audit.record({
      actor,
      action: "INVENTORY_MOVEMENT_CREATED",
      entityType: "InventoryMovement",
      entityId: result.movement.id,
      metadata: {
        sparePartId: result.sparePart.id,
        sku: result.sparePart.sku,
        type: result.movement.type,
        previousStock: result.movement.previousStock,
        quantity: result.movement.quantity,
        nextStock: result.movement.nextStock,
        reason: result.movement.reason,
        reference: result.movement.reference,
      },
    });

    return {
      sparePart: this.toSparePartResponse(result.sparePart),
      movement: result.movement,
    };
  }

  async findMovements(id: string) {
    await this.ensureSparePartExists(id);

    return this.prisma.inventoryMovement.findMany({
      where: { sparePartId: id },
      select: inventoryMovementSelect,
      orderBy: [{ createdAt: "desc" }],
    });
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

  private validateMovement(dto: CreateInventoryMovementDto) {
    if (dto.type === InventoryMovementType.IN && dto.quantity <= 0) {
      throw new BadRequestException("Los movimientos de entrada deben sumar stock");
    }

    if (dto.type === InventoryMovementType.OUT && dto.quantity >= 0) {
      throw new BadRequestException(
        "Los movimientos de salida deben descontar stock",
      );
    }

    if (
      dto.type !== InventoryMovementType.IN &&
      dto.type !== InventoryMovementType.OUT &&
      dto.type !== InventoryMovementType.ADJUSTMENT
    ) {
      throw new BadRequestException("Tipo de movimiento no permitido manualmente");
    }
  }

  private createMovementRecord(
    tx: Prisma.TransactionClient,
    input: {
      sparePartId: string;
      type: InventoryMovementType;
      quantity: number;
      previousStock: number;
      nextStock: number;
      reason: string;
      reference?: string | null;
      workOrderId?: string | null;
      actor?: AuthenticatedUser;
    },
  ) {
    return tx.inventoryMovement.create({
      data: {
        sparePartId: input.sparePartId,
        type: input.type,
        quantity: input.quantity,
        previousStock: input.previousStock,
        nextStock: input.nextStock,
        reason: input.reason,
        reference: input.reference,
        workOrderId: input.workOrderId,
        createdById: input.actor?.sub,
      },
      select: inventoryMovementSelect,
    });
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
