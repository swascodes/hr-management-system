import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  SetMetadata,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { loginId: string; password: string }) {
    return this.authService.login(body.loginId, body.password);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @SetMetadata('skipForceChange', true)
  @HttpCode(200)
  async changePassword(
    @Request() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @SetMetadata('skipForceChange', true)
  @HttpCode(200)
  async logout(
    @Request() req: any,
    @Body() body: { refreshToken?: string },
  ) {
    return this.authService.logout(req.user.id, body.refreshToken);
  }
}
