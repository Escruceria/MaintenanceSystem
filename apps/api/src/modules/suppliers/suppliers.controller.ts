import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { AuthenticatedUser } from "../auth/types/authenticated-user";
import { CreateAssetWarrantyDto } from "./dto/create-asset-warranty.dto";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateAssetWarrantyDto } from "./dto/update-asset-warranty.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";
import { SuppliersService } from "./suppliers.service";

@ApiTags("suppliers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("suppliers")
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Permissions("suppliers:write")
  @Post()
  create(
    @Body() dto: CreateSupplierDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.suppliers.create(dto, user);
  }

  @Permissions("suppliers:read")
  @Get()
  findAll() {
    return this.suppliers.findAll();
  }

  @Permissions("suppliers:write")
  @Post("warranties")
  createWarranty(
    @Body() dto: CreateAssetWarrantyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.suppliers.createWarranty(dto, user);
  }

  @Permissions("suppliers:read")
  @Get("warranties")
  findWarranties() {
    return this.suppliers.findWarranties();
  }

  @Permissions("suppliers:read")
  @Get("warranties/expiring")
  findExpiringWarranties(@Query("days") days?: string) {
    return this.suppliers.findExpiringWarranties(
      days ? Number(days) : undefined,
    );
  }

  @Permissions("suppliers:read")
  @Get("assets/:assetId/warranties")
  findAssetWarranties(@Param("assetId") assetId: string) {
    return this.suppliers.findAssetWarranties(assetId);
  }

  @Permissions("suppliers:write")
  @Patch("warranties/:id")
  updateWarranty(
    @Param("id") id: string,
    @Body() dto: UpdateAssetWarrantyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.suppliers.updateWarranty(id, dto, user);
  }

  @Permissions("suppliers:write")
  @Patch("warranties/:id/cancel")
  cancelWarranty(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.suppliers.cancelWarranty(id, user);
  }

  @Permissions("suppliers:read")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.suppliers.findOne(id);
  }

  @Permissions("suppliers:write")
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateSupplierDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.suppliers.update(id, dto, user);
  }

  @Permissions("suppliers:write")
  @Patch(":id/activate")
  activate(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.suppliers.updateStatus(id, true, user);
  }

  @Permissions("suppliers:write")
  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.suppliers.updateStatus(id, false, user);
  }
}
