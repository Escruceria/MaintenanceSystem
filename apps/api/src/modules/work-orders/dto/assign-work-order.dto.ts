import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class AssignWorkOrderDto {
  @ApiProperty()
  @IsUUID()
  technicianId!: string;
}
