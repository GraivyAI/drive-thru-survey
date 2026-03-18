import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class ReportQueryDto {
  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD, defaults to today)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD, defaults to today)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
