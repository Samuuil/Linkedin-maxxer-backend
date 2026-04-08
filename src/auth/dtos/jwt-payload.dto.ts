import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';

export class JwtPayloadDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  sub: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
