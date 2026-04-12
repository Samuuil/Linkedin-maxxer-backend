import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class EnhanceDescriptionDto {
  @ApiProperty({ description: 'Raw post description to enhance' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(3000)
  description: string;
}
