import { ApiProperty } from '@nestjs/swagger';
import { DashboardActivityItemDto } from './dashboard-activity-item.dto';

export class DashboardSummaryResponseDto {
  @ApiProperty({ example: 3 })
  pendingSuggestions: number;

  @ApiProperty({ example: 12 })
  activeSubscriptions: number;

  @ApiProperty({ example: 8 })
  autoCommentEnabled: number;

  @ApiProperty({
    example: 14,
    description:
      'Percent change in activity (posts + suggestions) over last 7 days vs previous 7 days',
  })
  recentGrowthPercent: number;

  @ApiProperty({ type: [DashboardActivityItemDto] })
  recentActivity: DashboardActivityItemDto[];
}
