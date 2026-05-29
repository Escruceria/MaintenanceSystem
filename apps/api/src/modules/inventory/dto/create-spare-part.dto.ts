import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateSparePartDto {
  @ApiProperty({ example: "REP-0001" })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  sku!: string;

  @ApiProperty({ example: "Rodamiento 6204" })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ example: "Rodamiento para bomba centrifuga" })
  @IsOptional()
  @IsString()
  @MaxLength(800)
  description?: string;

  @ApiProperty({ example: "UND" })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  unit!: string;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minimumStock?: number;
}
