import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CommentOnPostDto {
  @ApiProperty({
    description: 'LinkedIn post urn to comment on (its the big random number in a post url)',
    example: '1234567890',
  })
  @IsNotEmpty()
  @IsString()
  urn: string;
}
