import { ApiProperty } from "@nestjs/swagger";
import { ArrayUnique, IsArray, IsUUID } from "class-validator";

export class SetMaintenancePlanAssetsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  assetIds!: string[];
}
