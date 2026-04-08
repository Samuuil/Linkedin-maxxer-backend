import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class SetLinkedinCredentialsDto {
  @ApiProperty({ description: 'LinkedIn account email' })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  linkedinEmail: string;

  @ApiProperty({ description: 'LinkedIn account password (will be stored encrypted)' })
  @IsNotEmpty()
  @IsString()
  linkedinPassword: string;
}
