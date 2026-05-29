import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { LocationType } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateLocationDto {
  @ApiProperty({ example: "HQ-01" })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  code!: string;

  @ApiProperty({ example: "Sede principal" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: "Edificio administrativo principal" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: LocationType, default: LocationType.AREA })
  @IsOptional()
  @IsEnum(LocationType)
  type?: LocationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
