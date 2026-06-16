import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, WarrantyStatus } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser } from "../auth/types/authenticated-user";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAssetWarrantyDto } from "./dto/create-asset-warranty.dto";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateAssetWarrantyDto } from "./dto/update-asset-warranty.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";

const supplierSelect = Prisma.validator<Prisma.SupplierSelect>()({
  id: true,
  name: true,
  taxId: true,
  contactName: true,
  email: true,
  phone: true,
  address: true,
  website: true,
  notes: true,
  isActive: true,
  _count: {
    select: {
      suppliedAssets: true,
      warranties: true,
    },
  },
  createdAt: true,
  updatedAt: true,
});

const warrantySelect = Prisma.validator<Prisma.AssetWarrantySelect>()({
  id: true,
  title: true,
  description: true,
  policyNumber: true,
  startDate: true,
  endDate: true,
  status: true,
  terms: true,
  asset: {
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
    },
  },
  supplier: {
    select: {
      id: true,
      name: true,
      taxId: true,
    },
  },
  createdAt: true,
  updatedAt: true,
});

type SupplierWithCounts = Prisma.SupplierGetPayload<{
  select: typeof supplierSelect;
}>;

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateSupplierDto, actor?: AuthenticatedUser) {
    const taxId = this.normalizeOptionalText(dto.taxId);

    if (taxId) {
      await this.ensureTaxIdIsAvailable(taxId);
    }

    const supplier = await this.prisma.supplier.create({
      data: {
        name: dto.name.trim(),
        taxId,
        contactName: this.normalizeOptionalText(dto.contactName),
        email: this.normalizeOptionalText(dto.email),
        phone: this.normalizeOptionalText(dto.phone),
        address: this.normalizeOptionalText(dto.address),
        website: this.normalizeOptionalText(dto.website),
        notes: this.normalizeOptionalText(dto.notes),
        isActive: dto.isActive ?? true,
      },
      select: supplierSelect,
    });

    await this.audit.record({
      actor,
      action: "SUPPLIER_CREATED",
      entityType: "Supplier",
      entityId: supplier.id,
      metadata: this.toSupplierAuditState(supplier),
    });

    return this.toSupplierResponse(supplier);
  }

  async findAll() {
    const suppliers = await this.prisma.supplier.findMany({
      select: supplierSelect,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });

    return suppliers.map((supplier) => this.toSupplierResponse(supplier));
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      select: supplierSelect,
    });

    if (!supplier) {
      throw new NotFoundException("Proveedor no encontrado");
    }

    return this.toSupplierResponse(supplier);
  }

  async update(id: string, dto: UpdateSupplierDto, actor?: AuthenticatedUser) {
    const previous = await this.getSupplierSnapshot(id);
    const taxId =
      dto.taxId === undefined ? undefined : this.normalizeOptionalText(dto.taxId);

    if (taxId) {
      await this.ensureTaxIdIsAvailable(taxId, id);
    }

    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        taxId,
        contactName:
          dto.contactName === undefined
            ? undefined
            : this.normalizeOptionalText(dto.contactName),
        email:
          dto.email === undefined ? undefined : this.normalizeOptionalText(dto.email),
        phone:
          dto.phone === undefined ? undefined : this.normalizeOptionalText(dto.phone),
        address:
          dto.address === undefined
            ? undefined
            : this.normalizeOptionalText(dto.address),
        website:
          dto.website === undefined
            ? undefined
            : this.normalizeOptionalText(dto.website),
        notes:
          dto.notes === undefined ? undefined : this.normalizeOptionalText(dto.notes),
        isActive: dto.isActive,
      },
      select: supplierSelect,
    });

    await this.audit.record({
      actor,
      action: "SUPPLIER_UPDATED",
      entityType: "Supplier",
      entityId: supplier.id,
      metadata: {
        before: previous,
        after: this.toSupplierAuditState(supplier),
      },
    });

    return this.toSupplierResponse(supplier);
  }

  updateStatus(id: string, isActive: boolean, actor?: AuthenticatedUser) {
    return this.update(id, { isActive }, actor);
  }

  async createWarranty(dto: CreateAssetWarrantyDto, actor?: AuthenticatedUser) {
    await this.ensureAssetExists(dto.assetId);

    if (dto.supplierId) {
      await this.ensureSupplierExists(dto.supplierId);
    }

    this.validateDates(dto.startDate, dto.endDate);

    const warranty = await this.prisma.assetWarranty.create({
      data: {
        assetId: dto.assetId,
        supplierId: dto.supplierId,
        title: dto.title.trim(),
        description: this.normalizeOptionalText(dto.description),
        policyNumber: this.normalizeOptionalText(dto.policyNumber),
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: dto.status ?? WarrantyStatus.ACTIVE,
        terms: this.normalizeOptionalText(dto.terms),
      },
      select: warrantySelect,
    });

    await this.audit.record({
      actor,
      action: "ASSET_WARRANTY_CREATED",
      entityType: "AssetWarranty",
      entityId: warranty.id,
      metadata: {
        assetId: warranty.asset.id,
        supplierId: warranty.supplier?.id ?? null,
        endDate: warranty.endDate.toISOString(),
        status: warranty.status,
      },
    });

    return warranty;
  }

  async findWarranties() {
    return this.prisma.assetWarranty.findMany({
      select: warrantySelect,
      orderBy: [{ endDate: "asc" }, { createdAt: "desc" }],
    });
  }

  async findExpiringWarranties(days = 30) {
    const now = new Date();
    const until = new Date(now);
    until.setDate(until.getDate() + days);

    return this.prisma.assetWarranty.findMany({
      where: {
        status: WarrantyStatus.ACTIVE,
        endDate: {
          gte: now,
          lte: until,
        },
      },
      select: warrantySelect,
      orderBy: [{ endDate: "asc" }],
    });
  }

  async findAssetWarranties(assetId: string) {
    await this.ensureAssetExists(assetId);

    return this.prisma.assetWarranty.findMany({
      where: { assetId },
      select: warrantySelect,
      orderBy: [{ endDate: "asc" }, { createdAt: "desc" }],
    });
  }

  async updateWarranty(
    id: string,
    dto: UpdateAssetWarrantyDto,
    actor?: AuthenticatedUser,
  ) {
    const previous = await this.ensureWarrantyExists(id);

    if (dto.assetId) {
      await this.ensureAssetExists(dto.assetId);
    }

    if (dto.supplierId) {
      await this.ensureSupplierExists(dto.supplierId);
    }

    if (dto.startDate || dto.endDate) {
      this.validateDates(
        dto.startDate ?? previous.startDate.toISOString(),
        dto.endDate ?? previous.endDate.toISOString(),
      );
    }

    const warranty = await this.prisma.assetWarranty.update({
      where: { id },
      data: {
        assetId: dto.assetId,
        supplierId: dto.supplierId,
        title: dto.title?.trim(),
        description:
          dto.description === undefined
            ? undefined
            : this.normalizeOptionalText(dto.description),
        policyNumber:
          dto.policyNumber === undefined
            ? undefined
            : this.normalizeOptionalText(dto.policyNumber),
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: dto.status,
        terms:
          dto.terms === undefined ? undefined : this.normalizeOptionalText(dto.terms),
      },
      select: warrantySelect,
    });

    await this.audit.record({
      actor,
      action: "ASSET_WARRANTY_UPDATED",
      entityType: "AssetWarranty",
      entityId: warranty.id,
      metadata: {
        before: {
          status: previous.status,
          startDate: previous.startDate.toISOString(),
          endDate: previous.endDate.toISOString(),
        },
        after: {
          status: warranty.status,
          startDate: warranty.startDate.toISOString(),
          endDate: warranty.endDate.toISOString(),
        },
      },
    });

    return warranty;
  }

  async cancelWarranty(id: string, actor?: AuthenticatedUser) {
    await this.ensureWarrantyExists(id);

    const warranty = await this.prisma.assetWarranty.update({
      where: { id },
      data: { status: WarrantyStatus.CANCELLED },
      select: warrantySelect,
    });

    await this.audit.record({
      actor,
      action: "ASSET_WARRANTY_CANCELLED",
      entityType: "AssetWarranty",
      entityId: warranty.id,
      metadata: {
        assetId: warranty.asset.id,
        supplierId: warranty.supplier?.id ?? null,
      },
    });

    return warranty;
  }

  private async ensureTaxIdIsAvailable(taxId: string, currentSupplierId?: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { taxId },
      select: { id: true },
    });

    if (supplier && supplier.id !== currentSupplierId) {
      throw new ConflictException("Ya existe un proveedor con este documento");
    }
  }

  private async ensureSupplierExists(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!supplier) {
      throw new NotFoundException("Proveedor no encontrado");
    }

    if (!supplier.isActive) {
      throw new BadRequestException("El proveedor debe estar activo");
    }
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

  private async ensureWarrantyExists(id: string) {
    const warranty = await this.prisma.assetWarranty.findUnique({
      where: { id },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });

    if (!warranty) {
      throw new NotFoundException("Garantia no encontrada");
    }

    return warranty;
  }

  private async getSupplierSnapshot(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      select: supplierSelect,
    });

    if (!supplier) {
      throw new NotFoundException("Proveedor no encontrado");
    }

    return this.toSupplierAuditState(supplier);
  }

  private validateDates(startDate: string, endDate: string) {
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException(
        "La fecha de inicio no puede ser mayor a la fecha final",
      );
    }
  }

  private normalizeOptionalText(value?: string | null) {
    const normalized = value?.trim();

    return normalized ? normalized : null;
  }

  private toSupplierResponse(supplier: SupplierWithCounts) {
    return {
      id: supplier.id,
      name: supplier.name,
      taxId: supplier.taxId,
      contactName: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      website: supplier.website,
      notes: supplier.notes,
      isActive: supplier.isActive,
      suppliedAssetsCount: supplier._count.suppliedAssets,
      warrantiesCount: supplier._count.warranties,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
    };
  }

  private toSupplierAuditState(supplier: SupplierWithCounts) {
    return {
      id: supplier.id,
      name: supplier.name,
      taxId: supplier.taxId,
      email: supplier.email,
      phone: supplier.phone,
      isActive: supplier.isActive,
    };
  }
}
