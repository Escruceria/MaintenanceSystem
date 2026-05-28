import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('maintenance-plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('maintenance-plans')
export class MaintenancePlansController {
  @Get()
  findAll() {
    return [];
  }
}
