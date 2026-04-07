import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiPropertyOptional({ description: 'LinkedIn username' })
  linkedinUsername?: string;

  @ApiPropertyOptional({ description: 'LinkedIn sub identifier' })
  linkedinSub?: string;

  @ApiPropertyOptional({ description: 'Push token' })
  pushToken?: string;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
