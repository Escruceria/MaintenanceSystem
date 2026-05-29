import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsOptional,
  ValidateNested,
} from "class-validator";
import { WorkOrderPartDto } from "./work-order-part.dto";

export class CloseWorkOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @ApiPropertyOptional({ type: [WorkOrderPartDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderPartDto)
  spareParts?: WorkOrderPartDto[];
}
