import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class ResolveServiceRequestDto {
  @ApiPropertyOptional({
    example: "Solicitud revisada por mantenimiento.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(800)
  resolution?: string;
}
