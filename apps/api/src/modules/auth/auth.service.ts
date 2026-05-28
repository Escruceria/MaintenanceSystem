import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from './types/authenticated-user';

const REFRESH_TOKEN_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const passwordMatches = await compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const authUser = this.toAuthenticatedUser(user);
    const tokens = await this.issueTokens(authUser);

    return {
      user: authUser,
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = await this.hashRefreshToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: { permission: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!storedToken || storedToken.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Refresh token invalido');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const authUser = this.toAuthenticatedUser(storedToken.user);
    const tokens = await this.issueTokens(authUser);

    return {
      user: authUser,
      ...tokens,
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = await this.hashRefreshToken(refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  me(user: AuthenticatedUser) {
    return user;
  }

  private async issueTokens(user: AuthenticatedUser) {
    const accessToken = await this.jwt.signAsync(
      {
        sub: user.sub,
        email: user.email,
      },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      },
    );

    const refreshToken = randomBytes(64).toString('base64url');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.sub,
        tokenHash: await this.hashRefreshToken(refreshToken),
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }

  private hashRefreshToken(refreshToken: string) {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private toAuthenticatedUser(user: {
    id: string;
    email: string;
    name: string;
    roles: {
      role: {
        name: string;
        permissions: {
          permission: {
            key: string;
          };
        }[];
      };
    }[];
  }): AuthenticatedUser {
    const roles = user.roles.map(({ role }) => role.name);
    const permissions = user.roles.flatMap(({ role }) =>
      role.permissions.map(({ permission }) => permission.key),
    );

    return {
      sub: user.id,
      email: user.email,
      name: user.name,
      roles,
      permissions: [...new Set(permissions)],
    };
  }
}
