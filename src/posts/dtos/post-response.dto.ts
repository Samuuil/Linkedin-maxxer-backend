import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostStatus } from '../enums';

export class PostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  text: string;

  @ApiPropertyOptional({ type: [String] })
  imageUrns?: string[];

  @ApiPropertyOptional({ type: [String] })
  altTexts?: string[];

  @ApiPropertyOptional()
  linkedInPostUrn?: string;

  @ApiProperty({ enum: PostStatus })
  status: PostStatus;

  @ApiPropertyOptional()
  error?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
