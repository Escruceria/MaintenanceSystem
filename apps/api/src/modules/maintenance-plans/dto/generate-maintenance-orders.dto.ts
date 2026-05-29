import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsUUID } from "class-validator";

export class GenerateMaintenanceOrdersDto {
  @ApiPropertyOptional({
    description:
      "Optional asset id. If omitted, the plan generates orders for every assigned active asset.",
  })
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @ApiPropertyOptional({ example: "2026-06-15T08:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
