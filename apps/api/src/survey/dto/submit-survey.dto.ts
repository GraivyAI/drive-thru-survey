import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, Max, IsIn } from 'class-validator';

export class SubmitSurveyDto {
  @ApiProperty({ description: 'Order UUID' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ description: 'Satisfaction 1-5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  satisfactionRating: number;

  @ApiProperty({ description: 'Easy to understand', enum: ['YES_COMPLETELY', 'MOSTLY', 'NOT_REALLY'] })
  @IsIn(['YES_COMPLETELY', 'MOSTLY', 'NOT_REALLY'])
  easyToUnderstand: string;

  @ApiProperty({ description: 'Would use again', enum: ['YES', 'MAYBE', 'NO'] })
  @IsIn(['YES', 'MAYBE', 'NO'])
  wouldUseAgain: string;
}
