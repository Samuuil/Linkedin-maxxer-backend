import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribeDto {
  @ApiProperty({ example: 'https://www.linkedin.com/in/johndoe' })
  @IsString()
  @IsNotEmpty()
  linkedinUrl: string;
}
