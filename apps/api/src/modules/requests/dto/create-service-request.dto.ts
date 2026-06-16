import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { WorkOrderPriority } from "@prisma/client";
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateServiceRequestDto {
  @ApiProperty({ example: "Falla en sistema de bombeo" })
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title!: string;

  @ApiPropertyOptional({
    example: "El activo presenta ruido anormal y perdida de presion.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: WorkOrderPriority })
  @IsOptional()
  @IsEnum(WorkOrderPriority)
  priority?: WorkOrderPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assetId?: string;
}
