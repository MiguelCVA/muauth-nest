import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthenticationResponseDto } from './dto/auth-response.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate authentication via email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authentication initiated successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid email' })
  @ApiConflictResponse({
    description: 'Email already registered with different provider',
  })
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.authenticate(createAuthDto);
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validate authentication token' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: AuthenticationResponseDto,
    description: 'Token validated successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid or expired token' })
  @ApiQuery({ name: 'token', required: true, type: String })
  async validate(
    @Query('token') token: string,
  ): Promise<AuthenticationResponseDto> {
    return this.authService.validate(token);
  }

  @Get('sign-in/github')
  @UseGuards(AuthGuard('github'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate GitHub OAuth flow' })
  @ApiInternalServerErrorResponse()
  async loginWithGithub() {}

  @Get('callback/github')
  @UseGuards(AuthGuard('github'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle GitHub OAuth callback' })
  @ApiBadRequestResponse({ description: 'Invalid GitHub profile' })
  @ApiConflictResponse({
    description: 'Account already linked to different user',
  })
  async loginWithGithubCallback(
    @Req() req,
  ): Promise<AuthenticationResponseDto> {
    return this.authService.validateSignInFromGithub(req.user);
  }
}
