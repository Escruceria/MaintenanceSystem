import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { WarrantyStatus } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateAssetWarrantyDto {
  @ApiProperty()
  @IsUUID()
  assetId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiProperty({ example: "Garantia de fabrica" })
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title!: string;

  @ApiPropertyOptional({ example: "Cobertura por defectos de fabricacion" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: "POL-2026-0001" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  policyNumber?: string;

  @ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: "2027-01-01T00:00:00.000Z" })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ enum: WarrantyStatus, default: WarrantyStatus.ACTIVE })
  @IsOptional()
  @IsEnum(WarrantyStatus)
  status?: WarrantyStatus;

  @ApiPropertyOptional({ example: "No cubre danos por mala operacion" })
  @IsOptional()
  @IsString()
  @MaxLength(1500)
  terms?: string;
}
