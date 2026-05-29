import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";
import { MaintenancePlanTaskDto } from "./maintenance-plan-task.dto";

export class SetMaintenancePlanTasksDto {
  @ApiProperty({ type: [MaintenancePlanTaskDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaintenancePlanTaskDto)
  tasks!: MaintenancePlanTaskDto[];
}
