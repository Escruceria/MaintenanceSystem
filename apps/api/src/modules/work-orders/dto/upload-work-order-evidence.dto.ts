import { ApiPropertyOptional } from "@nestjs/swagger";
import { WorkOrderEvidenceType } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UploadWorkOrderEvidenceDto {
  @ApiPropertyOptional({
    enum: [WorkOrderEvidenceType.PHOTO, WorkOrderEvidenceType.DOCUMENT],
  })
  @IsOptional()
  @IsEnum(WorkOrderEvidenceType)
  type?: WorkOrderEvidenceType;

  @ApiPropertyOptional({ example: "Foto posterior al mantenimiento" })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title?: string;

  @ApiPropertyOptional({
    example: "Archivo cargado durante la ejecucion de la orden.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
