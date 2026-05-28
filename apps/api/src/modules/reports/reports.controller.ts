import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  @Get('summary')
  summary() {
    return {
      openWorkOrders: 0,
      assetsInMaintenance: 0,
      lowStockItems: 0,
      preventiveCompliance: 0,
    };
  }
}
