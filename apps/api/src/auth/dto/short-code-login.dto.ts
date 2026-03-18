import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ShortCodeLoginDto {
  @ApiProperty({ description: 'Lane short code (4 alphanumeric chars, with or without DT- prefix)', example: 'AB12' })
  @IsString()
  @Matches(/^(DT-)?[A-Z0-9]{4}$/i, { message: 'Short code must be 4 alphanumeric characters (optionally prefixed with DT-)' })
  shortCode: string;
}
