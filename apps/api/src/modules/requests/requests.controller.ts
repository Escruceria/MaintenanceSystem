import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { AuthenticatedUser } from "../auth/types/authenticated-user";
import { ConvertServiceRequestDto } from "./dto/convert-service-request.dto";
import { CreateServiceRequestDto } from "./dto/create-service-request.dto";
import { ResolveServiceRequestDto } from "./dto/resolve-service-request.dto";
import { UpdateServiceRequestDto } from "./dto/update-service-request.dto";
import { RequestsService } from "./requests.service";

@ApiTags("requests")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("requests")
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Permissions("requests:write")
  @Post()
  create(
    @Body() dto: CreateServiceRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.requests.create(dto, user);
  }

  @Permissions("requests:read")
  @Get()
  findAll() {
    return this.requests.findAll();
  }

  @Permissions("requests:read")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.requests.findOne(id);
  }

  @Permissions("requests:write")
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateServiceRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.requests.update(id, dto, user);
  }

  @Permissions("requests:review")
  @Patch(":id/review")
  markInReview(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.requests.markInReview(id, user);
  }

  @Permissions("requests:review")
  @Patch(":id/approve")
  approve(
    @Param("id") id: string,
    @Body() dto: ResolveServiceRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.requests.approve(id, dto, user);
  }

  @Permissions("requests:review")
  @Patch(":id/reject")
  reject(
    @Param("id") id: string,
    @Body() dto: ResolveServiceRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.requests.reject(id, dto, user);
  }

  @Permissions("requests:review")
  @Patch(":id/close")
  close(
    @Param("id") id: string,
    @Body() dto: ResolveServiceRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.requests.close(id, dto, user);
  }

  @Permissions("requests:convert", "work-orders:write")
  @Post(":id/convert-to-work-order")
  convertToWorkOrder(
    @Param("id") id: string,
    @Body() dto: ConvertServiceRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.requests.convertToWorkOrder(id, dto, user);
  }
}
