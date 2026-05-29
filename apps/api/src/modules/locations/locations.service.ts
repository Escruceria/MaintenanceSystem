import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { LocationType, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLocationDto } from "./dto/create-location.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";

const locationSelect = Prisma.validator<Prisma.LocationSelect>()({
  id: true,
  code: true,
  name: true,
  description: true,
  type: true,
  isActive: true,
  parentId: true,
  parent: {
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
    },
  },
  children: {
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      isActive: true,
      parentId: true,
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  },
  _count: {
    select: {
      children: true,
      assets: true,
    },
  },
  createdAt: true,
  updatedAt: true,
});

type LocationWithRelations = Prisma.LocationGetPayload<{
  select: typeof locationSelect;
}>;

type LocationTreeNode = ReturnType<LocationsService["toLocationResponse"]> & {
  children: LocationTreeNode[];
};

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLocationDto) {
    const code = this.normalizeCode(dto.code);
    await this.ensureCodeIsAvailable(code);

    if (dto.parentId) {
      await this.ensureLocationExists(dto.parentId);
    }

    const location = await this.prisma.location.create({
      data: {
        code,
        name: dto.name.trim(),
        description: this.normalizeOptionalText(dto.description),
        type: dto.type ?? LocationType.AREA,
        isActive: dto.isActive ?? true,
        parentId: dto.parentId,
      },
      select: locationSelect,
    });

    return this.toLocationResponse(location);
  }

  async findAll() {
    const locations = await this.prisma.location.findMany({
      select: locationSelect,
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return locations.map((location) => this.toLocationResponse(location));
  }

  async findTree() {
    const locations = await this.prisma.location.findMany({
      select: locationSelect,
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
    const nodes = new Map<string, LocationTreeNode>();

    for (const location of locations) {
      nodes.set(location.id, {
        ...this.toLocationResponse(location),
        children: [],
      });
    }

    const roots: LocationTreeNode[] = [];

    for (const node of nodes.values()) {
      if (node.parentId && nodes.has(node.parentId)) {
        nodes.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async findOne(id: string) {
    const location = await this.prisma.location.findUnique({
      where: { id },
      select: locationSelect,
    });

    if (!location) {
      throw new NotFoundException("Ubicacion no encontrada");
    }

    return this.toLocationResponse(location);
  }

  async update(id: string, dto: UpdateLocationDto) {
    await this.ensureLocationExists(id);

    if (dto.code) {
      const code = this.normalizeCode(dto.code);
      await this.ensureCodeIsAvailable(code, id);
    }

    if (dto.parentId !== undefined) {
      await this.validateParentChange(id, dto.parentId);
    }

    const location = await this.prisma.location.update({
      where: { id },
      data: {
        code: dto.code ? this.normalizeCode(dto.code) : undefined,
        name: dto.name?.trim(),
        description:
          dto.description === undefined
            ? undefined
            : this.normalizeOptionalText(dto.description),
        type: dto.type,
        parentId: dto.parentId,
        isActive: dto.isActive,
      },
      select: locationSelect,
    });

    return this.toLocationResponse(location);
  }

  async activate(id: string) {
    await this.ensureLocationExists(id);

    const location = await this.prisma.location.update({
      where: { id },
      data: { isActive: true },
      select: locationSelect,
    });

    return this.toLocationResponse(location);
  }

  async deactivate(id: string) {
    await this.ensureLocationExists(id);

    const location = await this.prisma.location.update({
      where: { id },
      data: { isActive: false },
      select: locationSelect,
    });

    return this.toLocationResponse(location);
  }

  async remove(id: string) {
    const location = await this.prisma.location.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            children: true,
            assets: true,
          },
        },
      },
    });

    if (!location) {
      throw new NotFoundException("Ubicacion no encontrada");
    }

    if (location._count.children > 0 || location._count.assets > 0) {
      throw new BadRequestException(
        "No se puede eliminar una ubicacion con sububicaciones o activos asociados",
      );
    }

    await this.prisma.location.delete({ where: { id } });

    return { success: true };
  }

  private async validateParentChange(id: string, parentId?: string | null) {
    if (!parentId) {
      return;
    }

    if (id === parentId) {
      throw new BadRequestException(
        "Una ubicacion no puede ser padre de si misma",
      );
    }

    await this.ensureLocationExists(parentId);

    const descendantIds = await this.getDescendantIds(id);

    if (descendantIds.has(parentId)) {
      throw new BadRequestException(
        "No se puede mover una ubicacion dentro de una sububicacion propia",
      );
    }
  }

  private async getDescendantIds(id: string) {
    const descendantIds = new Set<string>();
    const pendingIds = [id];

    while (pendingIds.length > 0) {
      const currentId = pendingIds.pop()!;
      const children = await this.prisma.location.findMany({
        where: { parentId: currentId },
        select: { id: true },
      });

      for (const child of children) {
        if (!descendantIds.has(child.id)) {
          descendantIds.add(child.id);
          pendingIds.push(child.id);
        }
      }
    }

    return descendantIds;
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

  private async ensureCodeIsAvailable(
    code: string,
    currentLocationId?: string,
  ) {
    const location = await this.prisma.location.findUnique({
      where: { code },
      select: { id: true },
    });

    if (location && location.id !== currentLocationId) {
      throw new ConflictException("Ya existe una ubicacion con este codigo");
    }
  }

  private normalizeCode(code: string) {
    return code.trim().toUpperCase();
  }

  private normalizeOptionalText(value?: string | null) {
    const normalized = value?.trim();

    return normalized ? normalized : null;
  }

  private toLocationResponse(location: LocationWithRelations) {
    return {
      id: location.id,
      code: location.code,
      name: location.name,
      description: location.description,
      type: location.type,
      isActive: location.isActive,
      parentId: location.parentId,
      parent: location.parent,
      children: location.children,
      childrenCount: location._count.children,
      assetsCount: location._count.assets,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    };
  }
}
