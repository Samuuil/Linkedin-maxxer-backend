import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ description: 'Post text content', maxLength: 3000 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(3000, { message: 'Post text cannot exceed 3000 characters' })
  text: string;
}
