import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { WorkOrderChecklistItemStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateWorkOrderChecklistItemDto {
  @ApiProperty({ enum: WorkOrderChecklistItemStatus })
  @IsEnum(WorkOrderChecklistItemStatus)
  status!: WorkOrderChecklistItemStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
