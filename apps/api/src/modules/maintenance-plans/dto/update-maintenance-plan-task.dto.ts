import { PartialType } from "@nestjs/swagger";
import { MaintenancePlanTaskDto } from "./maintenance-plan-task.dto";

export class UpdateMaintenancePlanTaskDto extends PartialType(
  MaintenancePlanTaskDto,
) {}
