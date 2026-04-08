import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SetOficialTokenDto {
  @ApiProperty({ description: 'JWT token for the official LinkedIn API' })
  @IsNotEmpty()
  @IsString()
  oficialToken: string;
}
