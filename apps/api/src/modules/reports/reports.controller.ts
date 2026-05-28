import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";

@ApiTags("reports")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("reports")
export class ReportsController {
  @Permissions("reports:read")
  @Get("summary")
  summary() {
    return {
      openWorkOrders: 0,
      assetsInMaintenance: 0,
      lowStockItems: 0,
      preventiveCompliance: 0,
    };
  }
}
