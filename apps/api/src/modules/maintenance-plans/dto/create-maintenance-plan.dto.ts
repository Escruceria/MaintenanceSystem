import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  MaintenanceFrequency,
  MaintenanceType,
  WorkOrderPriority,
} from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { MaintenancePlanTaskDto } from "./maintenance-plan-task.dto";

export class CreateMaintenancePlanDto {
  @ApiProperty({ example: "MP-BOMBA-MENSUAL" })
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  code!: string;

  @ApiProperty({ example: "Mantenimiento mensual de bombas" })
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  name!: string;

  @ApiPropertyOptional({ example: "Rutina preventiva para bombas centrifugas" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    enum: MaintenanceType,
    default: MaintenanceType.PREVENTIVE,
  })
  @IsOptional()
  @IsEnum(MaintenanceType)
  type?: MaintenanceType;

  @ApiPropertyOptional({
    enum: MaintenanceFrequency,
    default: MaintenanceFrequency.MONTHLY,
  })
  @IsOptional()
  @IsEnum(MaintenanceFrequency)
  frequencyType?: MaintenanceFrequency;

  @ApiPropertyOptional({
    example: "Mensual",
    description:
      "Etiqueta legible. Si no se envia, se deriva de frequencyType.",
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  frequency?: string;

  @ApiPropertyOptional({ example: 30, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  intervalDays?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDurationMinutes?: number;

  @ApiPropertyOptional({
    enum: WorkOrderPriority,
    default: WorkOrderPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(WorkOrderPriority)
  priority?: WorkOrderPriority;

  @ApiPropertyOptional({ example: "2026-06-15T08:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  nextDueAt?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  assetIds?: string[];

  @ApiPropertyOptional({ type: [MaintenancePlanTaskDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaintenancePlanTaskDto)
  tasks?: MaintenancePlanTaskDto[];
}
