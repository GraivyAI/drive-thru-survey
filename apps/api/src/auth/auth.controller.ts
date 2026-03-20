import { Controller, Post, Body, Get, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService, JwtPayload } from './auth.service';
import { ShortCodeLoginDto } from './dto/short-code-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentLocation } from './decorators/current-location.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('short-code')
  @ApiOperation({ summary: 'Authenticate with lane short code' })
  @ApiResponse({ status: 201, description: 'JWT token + location context' })
  @ApiResponse({ status: 401, description: 'Invalid or inactive code' })
  async login(@Body() dto: ShortCodeLoginDto) {
    return this.authService.loginWithShortCode(dto.shortCode);
  }

  @Get('location')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Full store / location details for the authenticated lane' })
  @ApiResponse({ status: 200, description: 'Location row' })
  @ApiResponse({ status: 401, description: 'Missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async getLocation(@CurrentLocation() loc: JwtPayload) {
    const details = await this.authService.getLocationDetails(loc.locationId);
    if (!details) {
      throw new NotFoundException('Location not found');
    }
    return details;
  }
}
