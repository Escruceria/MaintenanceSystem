import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class AcceptUserInvitationDto {
  @ApiProperty({ description: "Token recibido en la invitacion." })
  @IsString()
  @MinLength(32)
  token!: string;

  @ApiProperty({ minLength: 8, example: "NuevoAdmin123*" })
  @IsString()
  @MinLength(8)
  password!: string;
}
