import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";
import { WorkOrderPartDto } from "./work-order-part.dto";

export class SetWorkOrderPartsDto {
  @ApiProperty({ type: [WorkOrderPartDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderPartDto)
  spareParts!: WorkOrderPartDto[];
}
