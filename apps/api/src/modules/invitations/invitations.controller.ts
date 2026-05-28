import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { AuthenticatedUser } from "../auth/types/authenticated-user";
import { AcceptUserInvitationDto } from "./dto/accept-user-invitation.dto";
import { CreateUserInvitationDto } from "./dto/create-user-invitation.dto";
import { InvitationsService } from "./invitations.service";

@ApiTags("invitations")
@Controller("invitations")
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("users:write")
  @Post()
  create(
    @Body() dto: CreateUserInvitationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invitations.create(dto, user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("users:read")
  @Get()
  findAll() {
    return this.invitations.findAll();
  }

  @Post("accept")
  accept(@Body() dto: AcceptUserInvitationDto) {
    return this.invitations.accept(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("users:write")
  @Post(":id/cancel")
  cancel(@Param("id") id: string) {
    return this.invitations.cancel(id);
  }
}
