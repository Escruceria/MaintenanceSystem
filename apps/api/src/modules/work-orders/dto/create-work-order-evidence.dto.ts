import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { WorkOrderEvidenceType } from "@prisma/client";
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateWorkOrderEvidenceDto {
  @ApiProperty({ enum: WorkOrderEvidenceType })
  @IsEnum(WorkOrderEvidenceType)
  type!: WorkOrderEvidenceType;

  @ApiProperty({ example: "Foto posterior al mantenimiento" })
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title!: string;

  @ApiPropertyOptional({
    example: "Se evidencia equipo operativo y area limpia.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    example: "https://storage.local/work-orders/ot-0001/photo-1.jpg",
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(1000)
  fileUrl?: string;

  @ApiPropertyOptional({ example: "photo-1.jpg" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @ApiPropertyOptional({ example: "image/jpeg" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  mimeType?: string;
}
