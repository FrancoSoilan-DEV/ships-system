import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { UsersModule } from '../users/users.module';

/**
 * AuthModule conecta todas las piezas de autenticación.
 * 
 * - Importa UsersModule para poder usar UsersService
 * - Importa PassportModule para activar el sistema de estrategias
 * - Importa JwtModule para poder firmar y verificar tokens
 * - Registra las dos estrategias como providers
 * - Registra el controller y el service
 */
@Module({
  imports: [
    // Necesitamos UsersService para buscar usuarios en login y en las strategies
    UsersModule,

    // PassportModule activa el sistema de guards y estrategias
    PassportModule,

    // JwtModule lo registramos sin configuración fija porque
    // cada token (access y refresh) usa su propia secret y expiración
    // — eso lo manejamos directamente en AuthService.generateTokens()
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // Las estrategias son providers — Passport las detecta automáticamente
    JwtStrategy,
    JwtRefreshStrategy,
  ],
})
export class AuthModule {}