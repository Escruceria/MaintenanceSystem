import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, MaxLength, MinLength } from "class-validator";

export class AdjustStockDto {
  @ApiProperty({
    description: "Cantidad a ajustar. Positiva suma stock, negativa descuenta.",
    example: 5,
  })
  @IsInt()
  quantity!: number;

  @ApiProperty({ example: "Compra inicial" })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  reason!: string;
}
