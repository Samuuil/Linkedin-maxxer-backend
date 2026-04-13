import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { User } from '../user/entities';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryResponseDto } from './dtos';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('AccessToken')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get dashboard summary for Home screen',
    description:
      'Returns cards metrics and recent activity feed in one request for the mobile Home screen.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard summary returned successfully',
    type: DashboardSummaryResponseDto,
  })
  async getSummary(
    @CurrentUser() user: User,
  ): Promise<DashboardSummaryResponseDto> {
    return this.dashboardService.getSummary(user.id);
  }
}
