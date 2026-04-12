import { IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespondSuggestionDto {
  @ApiProperty()
  @IsUUID()
  suggestionId: string;

  @ApiProperty()
  @IsBoolean()
  approve: boolean;
}
