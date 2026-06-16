import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { InventoryMovementType } from "@prisma/client";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateInventoryMovementDto {
  @ApiProperty({
    enum: [
      InventoryMovementType.IN,
      InventoryMovementType.OUT,
      InventoryMovementType.ADJUSTMENT,
    ],
  })
  @IsEnum(InventoryMovementType)
  type!: InventoryMovementType;

  @ApiProperty({
    description:
      "Cantidad del movimiento. IN debe ser positiva, OUT debe ser negativa y ADJUSTMENT puede ser positiva o negativa.",
    example: 5,
  })
  @IsInt()
  quantity!: number;

  @ApiProperty({ example: "Compra de repuestos" })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  reason!: string;

  @ApiPropertyOptional({ example: "FACT-2026-0001" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;
}
