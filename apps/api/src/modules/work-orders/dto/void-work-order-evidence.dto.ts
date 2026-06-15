import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class VoidWorkOrderEvidenceDto {
  @ApiPropertyOptional({
    example: "Archivo cargado por error o evidencia duplicada.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
