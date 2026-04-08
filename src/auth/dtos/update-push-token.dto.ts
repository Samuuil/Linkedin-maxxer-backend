import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePushTokenDto {
  @ApiProperty({ description: 'FCM push token for Android notifications' })
  @IsString()
  @IsNotEmpty()
  pushToken: string;
}
