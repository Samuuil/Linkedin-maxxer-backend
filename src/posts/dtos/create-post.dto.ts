import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, IsArray, ArrayMaxSize } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ description: 'Post text content', maxLength: 3000 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(3000, { message: 'Post text cannot exceed 3000 characters' })
  text: string;

  @ApiPropertyOptional({ 
    description: 'Alt texts for images (accessibility). Array should match number of images uploaded.',
    type: [String],
    maxItems: 9
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(9)
  altTexts?: string[];
}
