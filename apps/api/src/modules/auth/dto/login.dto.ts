import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@maintenance.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Admin123*', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

