import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PostsQueryDto {
  @ApiProperty({
    required: false,
    description: 'Page number',
    example: '1',
  })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiProperty({
    required: false,
    description: 'Items per page',
    example: '20',
  })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiProperty({
    required: false,
    description: 'Sort by columns, e.g. createdAt:DESC',
    example: 'createdAt:DESC',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by post status',
    example: '$eq:PUBLISHED',
  })
  @IsOptional()
  @IsString()
  'filter.status'?: string;
}
