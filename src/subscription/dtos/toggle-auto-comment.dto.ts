import { IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleAutoCommentDto {
  @ApiProperty()
  @IsUUID()
  subscriptionId: string;

  @ApiProperty()
  @IsBoolean()
  autoComment: boolean;
}
