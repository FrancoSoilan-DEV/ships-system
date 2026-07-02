import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from '@nestjs/passport';

/**
 * AuthController maneja las rutas HTTP de autenticación.
 * 
 * Con el prefijo global 'api' del main.ts, las rutas quedan:
 * POST /api/auth/register  → crear cuenta
 * POST /api/auth/login     → iniciar sesión
 * POST /api/auth/refresh   → renovar access token
 * 
 * El controller NO contiene lógica — solo recibe la request,
 * llama al AuthService, y retorna la respuesta.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/register
   * 
   * Body esperado:
   * {
   *   "name": "Franco",
   *   "email": "franco@email.com",
   *   "password": "123456"
   * }
   * 
   * @Body() extrae el body de la request y lo convierte al DTO
   */
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /api/auth/login
   * 
   * Body esperado:
   * {
   *   "email": "franco@email.com",
   *   "password": "123456"
   * }
   * 
   * Retorna: { accessToken, refreshToken }
   */
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * POST /api/auth/refresh
   * 
   * Header esperado:
   * Authorization: Bearer <refreshToken>
   * 
   * UseGuards(AuthGuard('jwt-refresh')) activa la JwtRefreshStrategy
   * que valida el refresh token antes de entrar al método.
   * Si el token es inválido, Passport lanza 401 automáticamente.
   * 
   * req.user viene de lo que retorna JwtRefreshStrategy.validate()
   */
  @UseGuards(AuthGuard('jwt-refresh'))
    @Post('refresh')
    refresh(@Request() req: { user: { id: string; email: string; role: string } }) {
    return this.authService.refresh(
        req.user.id,
        req.user.email,
        req.user.role,
    );
    }
}