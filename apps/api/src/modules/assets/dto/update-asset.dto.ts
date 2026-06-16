import { ApiPropertyOptional } from "@nestjs/swagger";
import { AssetStatus } from "@prisma/client";
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateAssetDto {
  @ApiPropertyOptional({ example: "EQ-0001" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  code?: string;

  @ApiPropertyOptional({ example: "Bomba centrifuga linea 2" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({ example: "Equipo principal del sistema de bombeo" })
  @IsOptional()
  @IsString()
  @MaxLength(800)
  description?: string | null;

  @ApiPropertyOptional({ example: "SN-2026-0001" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  serialNumber?: string | null;

  @ApiPropertyOptional({ example: "Siemens" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string | null;

  @ApiPropertyOptional({ example: "XPTO-500" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  model?: string | null;

  @ApiPropertyOptional({ enum: AssetStatus })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @ApiPropertyOptional({ example: "MS-ASSET:EQ-0001", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  qrCode?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  locationId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  supplierId?: string | null;
}
