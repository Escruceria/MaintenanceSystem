import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateWorkOrderExecutionNotesDto {
  @ApiPropertyOptional({
    example: "Se realizo mantenimiento preventivo y pruebas operativas.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  finalNotes?: string;

  @ApiPropertyOptional({
    example: "Programar cambio de filtro en el proximo mantenimiento.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  recommendations?: string;
}
