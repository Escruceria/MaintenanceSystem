import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  MaintenanceType,
  WorkOrderPriority,
  WorkOrderStatus,
} from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { WorkOrderPartDto } from "./work-order-part.dto";

export class CreateWorkOrderDto {
  @ApiPropertyOptional({ example: "OT-2026-0001" })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  number?: string;

  @ApiProperty({ example: "Reparar bomba centrifuga" })
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title!: string;

  @ApiPropertyOptional({ example: "Ruido anormal durante operacion" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ enum: MaintenanceType })
  @IsEnum(MaintenanceType)
  type!: MaintenanceType;

  @ApiPropertyOptional({
    enum: WorkOrderPriority,
    default: WorkOrderPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(WorkOrderPriority)
  priority?: WorkOrderPriority;

  @ApiPropertyOptional({ enum: WorkOrderStatus, default: WorkOrderStatus.OPEN })
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @ApiProperty()
  @IsUUID()
  assetId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedTechnicianId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ type: [WorkOrderPartDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderPartDto)
  spareParts?: WorkOrderPartDto[];
}
