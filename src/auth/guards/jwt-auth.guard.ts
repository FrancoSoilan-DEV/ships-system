import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard protege rutas que requieren estar logueado.
 * Usa la JwtStrategy para validar el token del header.
 * 
 * Uso: @UseGuards(JwtAuthGuard) en cualquier controller o ruta.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}