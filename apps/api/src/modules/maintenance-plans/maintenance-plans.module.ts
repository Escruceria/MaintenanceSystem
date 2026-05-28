import { Module } from '@nestjs/common';
import { MaintenancePlansController } from './maintenance-plans.controller';

@Module({
  controllers: [MaintenancePlansController],
})
export class MaintenancePlansModule {}

