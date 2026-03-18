import { Controller, Post, Get, Param, Body, Query, Res, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentLocation } from '../auth/decorators/current-location.decorator';
import { JwtPayload } from '../auth/auth.service';
import { SurveyService } from './survey.service';
import { SubmitSurveyDto } from './dto/submit-survey.dto';
import { ReportQueryDto } from './dto/report-query.dto';

@ApiTags('Survey')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('survey')
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post()
  @ApiOperation({ summary: 'Submit or update survey response' })
  @ApiResponse({ status: 201, description: 'Survey saved or updated' })
  async submit(
    @CurrentLocation() loc: JwtPayload,
    @Body() dto: SubmitSurveyDto,
  ) {
    return this.surveyService.submit({
      orderId: dto.orderId,
      locationId: loc.locationId,
      brandId: loc.brandId,
      satisfactionRating: dto.satisfactionRating,
      easyToUnderstand: dto.easyToUnderstand,
      wouldUseAgain: dto.wouldUseAgain,
      surveyerShortCode: loc.shortCode,
    });
  }

  @Post('skip')
  @ApiOperation({ summary: 'Skip survey for an order' })
  @ApiResponse({ status: 201, description: 'Order marked as skipped' })
  async skip(
    @CurrentLocation() loc: JwtPayload,
    @Body() body: { orderId: string },
  ) {
    return this.surveyService.skip({
      orderId: body.orderId,
      locationId: loc.locationId,
      brandId: loc.brandId,
      surveyerShortCode: loc.shortCode,
    });
  }

  @Post('unskip')
  @ApiOperation({ summary: 'Un-skip a previously skipped order' })
  @ApiResponse({ status: 200, description: 'Skip removed, order returned to unsurveyed' })
  async unskip(
    @CurrentLocation() loc: JwtPayload,
    @Body() body: { orderId: string },
  ) {
    return this.surveyService.unskip({
      orderId: body.orderId,
      locationId: loc.locationId,
    });
  }

  @Get('report')
  @ApiOperation({ summary: 'Get survey report with summary and responses' })
  async report(
    @CurrentLocation() loc: JwtPayload,
    @Query() query: ReportQueryDto,
  ) {
    const today = new Date().toISOString().slice(0, 10);
    const dateFrom = query.dateFrom || today;
    const dateTo = query.dateTo || today;
    return this.surveyService.getReport(loc.locationId, dateFrom, dateTo);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export survey responses as CSV' })
  async exportCsv(
    @CurrentLocation() loc: JwtPayload,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const today = new Date().toISOString().slice(0, 10);
    const dateFrom = query.dateFrom || today;
    const dateTo = query.dateTo || today;

    const csv = await this.surveyService.exportCsv(loc.locationId, dateFrom, dateTo);
    const filename = `survey-export-${dateFrom}-to-${dateTo}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get existing survey response for an order' })
  async getByOrder(
    @CurrentLocation() loc: JwtPayload,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.surveyService.getByOrderId(orderId, loc.locationId);
  }
}
