import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { WorkOrderPartDto } from "./work-order-part.dto";

export class CloseWorkOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @ApiPropertyOptional({
    example: "Activo probado y entregado en condiciones operativas.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  finalNotes?: string;

  @ApiPropertyOptional({
    example: "Revisar nuevamente en el proximo ciclo preventivo.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  recommendations?: string;

  @ApiPropertyOptional({ type: [WorkOrderPartDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderPartDto)
  spareParts?: WorkOrderPartDto[];
}
