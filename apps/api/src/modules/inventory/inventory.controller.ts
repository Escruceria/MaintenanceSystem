import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { AuthenticatedUser } from "../auth/types/authenticated-user";
import { AdjustStockDto } from "./dto/adjust-stock.dto";
import { CreateInventoryMovementDto } from "./dto/create-inventory-movement.dto";
import { CreateSparePartDto } from "./dto/create-spare-part.dto";
import { UpdateSparePartDto } from "./dto/update-spare-part.dto";
import { InventoryService } from "./inventory.service";

@ApiTags("inventory")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("inventory")
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Permissions("inventory:write")
  @Post("spare-parts")
  createSparePart(
    @Body() dto: CreateSparePartDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventory.createSparePart(dto, user);
  }

  @Permissions("inventory:read")
  @Get("spare-parts")
  findSpareParts() {
    return this.inventory.findSpareParts();
  }

  @Permissions("inventory:read")
  @Get("spare-parts/low-stock")
  findLowStockSpareParts() {
    return this.inventory.findLowStockSpareParts();
  }

  @Permissions("inventory:read")
  @Get("spare-parts/:id")
  findSparePart(@Param("id") id: string) {
    return this.inventory.findSparePart(id);
  }

  @Permissions("inventory:write")
  @Patch("spare-parts/:id")
  updateSparePart(
    @Param("id") id: string,
    @Body() dto: UpdateSparePartDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventory.updateSparePart(id, dto, user);
  }

  @Permissions("inventory:adjust")
  @Patch("spare-parts/:id/stock")
  adjustStock(
    @Param("id") id: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventory.adjustStock(id, dto, user);
  }

  @Permissions("inventory:move")
  @Post("spare-parts/:id/movements")
  createMovement(
    @Param("id") id: string,
    @Body() dto: CreateInventoryMovementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventory.createMovement(id, dto, user);
  }

  @Permissions("inventory:read")
  @Get("spare-parts/:id/movements")
  findMovements(@Param("id") id: string) {
    return this.inventory.findMovements(id);
  }

  @Permissions("inventory:write")
  @Delete("spare-parts/:id")
  removeSparePart(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventory.removeSparePart(id, user);
  }
}
