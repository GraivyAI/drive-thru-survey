import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ShortCodeLoginDto } from './dto/short-code-login.dto';

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
}
