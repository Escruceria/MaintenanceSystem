import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { AuthenticatedUser } from "../auth/types/authenticated-user";
import { PrismaService } from "../prisma/prisma.service";
import { AssignUserRolesDto } from "./dto/assign-user-roles.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

const userSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  email: true,
  name: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    select: {
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  },
});

type UserWithRoles = Prisma.UserGetPayload<{ select: typeof userSelect }>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const email = this.normalizeEmail(dto.email);
    await this.ensureEmailIsAvailable(email);
    const roleIds = await this.ensureRolesExist(dto.roleIds ?? []);

    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name.trim(),
        passwordHash: await bcrypt.hash(dto.password, 12),
        status: dto.status ?? UserStatus.ACTIVE,
        roles: {
          create: roleIds.map((roleId) => ({ roleId })),
        },
      },
      select: userSelect,
    });

    return this.toUserResponse(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: "asc" },
    });

    return users.map((user) => this.toUserResponse(user));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException("Usuario no encontrado");
    }

    return this.toUserResponse(user);
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthenticatedUser) {
    await this.ensureUserExists(id);

    if (dto.email) {
      const email = this.normalizeEmail(dto.email);
      await this.ensureEmailIsAvailable(email, id);
    }

    if (id === actor.sub && dto.status === UserStatus.INACTIVE) {
      throw new BadRequestException("No puedes desactivar tu propio usuario");
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email ? this.normalizeEmail(dto.email) : undefined,
        name: dto.name?.trim(),
        status: dto.status,
      },
      select: userSelect,
    });

    return this.toUserResponse(user);
  }

  async activate(id: string) {
    await this.ensureUserExists(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.ACTIVE },
      select: userSelect,
    });

    return this.toUserResponse(user);
  }

  async deactivate(id: string, actor: AuthenticatedUser) {
    if (id === actor.sub) {
      throw new BadRequestException("No puedes desactivar tu propio usuario");
    }

    await this.ensureUserExists(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.INACTIVE },
      select: userSelect,
    });

    await this.prisma.refreshToken.updateMany({
      where: {
        userId: id,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    return this.toUserResponse(user);
  }

  async assignRoles(
    id: string,
    dto: AssignUserRolesDto,
    actor: AuthenticatedUser,
  ) {
    await this.ensureUserExists(id);
    const roleIds = await this.ensureRolesExist(dto.roleIds);

    if (id === actor.sub) {
      const adminRole = await this.prisma.role.findUnique({
        where: { name: "ADMIN" },
        select: { id: true },
      });

      if (adminRole && !roleIds.includes(adminRole.id)) {
        throw new BadRequestException(
          "No puedes quitarte el rol ADMIN a tu propio usuario",
        );
      }
    }

    const user = await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });

      if (roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map((roleId) => ({ userId: id, roleId })),
        });
      }

      return tx.user.findUnique({
        where: { id },
        select: userSelect,
      });
    });

    if (!user) {
      throw new NotFoundException("Usuario no encontrado");
    }

    return this.toUserResponse(user);
  }

  async findRoles() {
    const roles = await this.prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        permissions: {
          select: {
            permission: {
              select: {
                id: true,
                key: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return roles.map((role) => ({
      ...role,
      permissions: role.permissions.map(({ permission }) => permission),
    }));
  }

  private async ensureUserExists(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException("Usuario no encontrado");
    }
  }

  private async ensureEmailIsAvailable(email: string, currentUserId?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== currentUserId) {
      throw new ConflictException("Ya existe un usuario con este correo");
    }
  }

  private async ensureRolesExist(roleIds: string[]) {
    const uniqueRoleIds = [...new Set(roleIds)];

    if (uniqueRoleIds.length === 0) {
      return [];
    }

    const roles = await this.prisma.role.findMany({
      where: { id: { in: uniqueRoleIds } },
      select: { id: true },
    });

    if (roles.length !== uniqueRoleIds.length) {
      throw new BadRequestException("Uno o mas roles no existen");
    }

    return uniqueRoleIds;
  }

  private normalizeEmail(email: string) {
    return email.toLowerCase().trim();
  }

  private toUserResponse(user: UserWithRoles) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      roles: user.roles.map(({ role }) => role),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
