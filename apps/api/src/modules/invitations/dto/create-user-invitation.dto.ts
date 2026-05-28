import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from "class-validator";

export class CreateUserInvitationDto {
  @ApiProperty({ example: "tecnico@empresa.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Tecnico de mantenimiento" })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({
    description: "Rol inicial que se asignara al aceptar la invitacion.",
  })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiPropertyOptional({ example: 7, minimum: 1, maximum: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  expiresInDays?: number;
}
