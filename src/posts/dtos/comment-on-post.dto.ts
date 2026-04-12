import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CommentOnPostDto {
  @ApiProperty({
    description: 'LinkedIn post URL to comment on',
    example: 'https://www.linkedin.com/feed/update/urn:li:activity:1234567890/',
  })
  @IsNotEmpty()
  @IsString()
  urn: string;
}
