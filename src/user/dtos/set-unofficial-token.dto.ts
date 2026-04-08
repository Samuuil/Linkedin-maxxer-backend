import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SetUnofficialTokenDto {
  @ApiProperty({ description: 'Token for the reversed (unofficial) LinkedIn API' })
  @IsNotEmpty()
  @IsString()
  unofficialToken: string;
}
