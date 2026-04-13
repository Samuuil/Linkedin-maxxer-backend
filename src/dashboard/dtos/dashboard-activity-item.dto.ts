import { ApiProperty } from '@nestjs/swagger';
import { PostStatus } from '../../posts/enums';
import { CommentSuggestionStatus } from '../../subscription/enums';
import { DashboardActivityType } from '../enums';

export class DashboardActivityItemDto {
  @ApiProperty({
    example: 'post_9f6f2d4a',
    description: 'Unique identifier in the format <type>_<id>',
  })
  id: string;

  @ApiProperty({ example: DashboardActivityType.POST, enum: DashboardActivityType })
  type: DashboardActivityType;

  @ApiProperty({
    example: 'Draft: The future of B2B pipelines...',
    description: 'Primary activity text for list display',
  })
  title: string;

  @ApiProperty({
    example: 'Created 2 hours ago',
    description: 'Secondary activity text',
  })
  subtitle: string;

  @ApiProperty({
    example: PostStatus.DRAFT,
    enum: [...Object.values(PostStatus), ...Object.values(CommentSuggestionStatus)],
    description: 'Status from posts or comment suggestions',
  })
  status: PostStatus | CommentSuggestionStatus;

  @ApiProperty({
    example: '2026-04-13T08:42:11.000Z',
    description: 'Activity creation time',
  })
  createdAt: string;
}
