import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { AuthenticatedUser } from "../auth/types/authenticated-user";
import { AcceptUserInvitationDto } from "./dto/accept-user-invitation.dto";
import { CreateUserInvitationDto } from "./dto/create-user-invitation.dto";

const DEFAULT_INVITATION_DAYS = 7;

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserInvitationDto, invitedBy: AuthenticatedUser) {
    const email = dto.email.toLowerCase().trim();
    const name = dto.name.trim();
    const expiresInDays = dto.expiresInDays ?? DEFAULT_INVITATION_DAYS;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, status: true },
    });

    if (existingUser?.status === "ACTIVE") {
      throw new ConflictException(
        "Ya existe un usuario activo con este correo",
      );
    }

    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
        select: { id: true },
      });

      if (!role) {
        throw new BadRequestException("El rol indicado no existe");
      }
    }

    await this.prisma.userInvitation.updateMany({
      where: {
        email,
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    const token = randomBytes(48).toString("base64url");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invitation = await this.prisma.userInvitation.create({
      data: {
        email,
        name,
        tokenHash: this.hashToken(token),
        roleId: dto.roleId,
        invitedById: invitedBy.sub,
        expiresAt,
      },
      select: this.invitationSelect(),
    });

    return {
      ...invitation,
      token,
      invitationUrl: `/accept-invitation?token=${token}`,
    };
  }

  findAll() {
    return this.prisma.userInvitation.findMany({
      select: this.invitationSelect(),
      orderBy: { createdAt: "desc" },
    });
  }

  async accept(dto: AcceptUserInvitationDto) {
    const tokenHash = this.hashToken(dto.token);
    const now = new Date();

    const invitation = await this.prisma.userInvitation.findUnique({
      where: { tokenHash },
    });

    if (!invitation || invitation.status !== "PENDING") {
      throw new BadRequestException("Invitacion invalida");
    }

    if (invitation.expiresAt <= now) {
      await this.prisma.userInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      throw new BadRequestException("Invitacion expirada");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const acceptedUser = await this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: invitation.email },
        select: { id: true, status: true },
      });

      if (existingUser?.status === "ACTIVE") {
        throw new ConflictException("La invitacion ya fue aceptada");
      }

      const user = existingUser
        ? await tx.user.update({
            where: { id: existingUser.id },
            data: {
              name: invitation.name,
              passwordHash,
              status: "ACTIVE",
            },
          })
        : await tx.user.create({
            data: {
              email: invitation.email,
              name: invitation.name,
              passwordHash,
              status: "ACTIVE",
            },
          });

      if (invitation.roleId) {
        await tx.userRole.upsert({
          where: {
            userId_roleId: {
              userId: user.id,
              roleId: invitation.roleId,
            },
          },
          update: {},
          create: {
            userId: user.id,
            roleId: invitation.roleId,
          },
        });
      }

      await tx.userInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: now,
          acceptedUserId: user.id,
        },
      });

      return user;
    });

    return {
      success: true,
      user: {
        id: acceptedUser.id,
        email: acceptedUser.email,
        name: acceptedUser.name,
        status: acceptedUser.status,
      },
    };
  }

  async cancel(id: string) {
    const invitation = await this.prisma.userInvitation.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!invitation) {
      throw new NotFoundException("Invitacion no encontrada");
    }

    if (invitation.status !== "PENDING") {
      throw new BadRequestException(
        "Solo se pueden cancelar invitaciones pendientes",
      );
    }

    return this.prisma.userInvitation.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
      select: this.invitationSelect(),
    });
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private invitationSelect() {
    return {
      id: true,
      email: true,
      name: true,
      status: true,
      expiresAt: true,
      acceptedAt: true,
      cancelledAt: true,
      createdAt: true,
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      invitedBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      acceptedUser: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    } as const;
  }
}
