import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';

/**
 * AuthService contiene toda la lógica de autenticación.
 * 
 * - register(): crea un usuario nuevo con password hasheado
 * - login(): verifica credenciales y genera tokens JWT
 * - generateTokens(): crea access token + refresh token
 * - refresh(): genera un nuevo access token con el refresh token
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registra un usuario nuevo.
   * 
   * 1. Verifica que el email no esté en uso
   * 2. Hashea el password con bcrypt (nunca guardamos el password en texto plano)
   * 3. Crea el usuario en la DB
   * 4. Retorna los tokens JWT para que el usuario quede logueado inmediatamente
   */
  async register(dto: RegisterDto) {
    // Verificar si el email ya existe
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('El email ya está en uso');
    }

    // Hashear el password — bcrypt agrega salt automáticamente
    // El número 10 es el "cost factor": más alto = más seguro pero más lento
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Crear el usuario en la DB
    const user = await this.prisma.user.create({
        data: {
            name: dto.name,
            email: dto.email,
            password: hashedPassword,
            role: 'CLIENT', // agregá esta línea
        },
    });

    // Generar y retornar tokens
    return this.generateTokens(user.id, user.email, user.role);
  }

  /**
   * Inicia sesión con email y password.
   * 
   * 1. Busca el usuario por email
   * 2. Compara el password con el hash guardado
   * 3. Si todo está bien, retorna los tokens JWT
   */
  async login(dto: LoginDto) {
    // Buscar el usuario
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Usamos el mismo mensaje para email y password incorrectos
      // para no dar pistas de qué campo está mal (seguridad)
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Comparar el password con el hash en la DB
    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  /**
   * Genera un nuevo access token usando el refresh token.
   * El usuario (ya validado por JwtRefreshStrategy) viene en req.user.
   */
  refresh(userId: string, email: string, role: string) {
    return this.generateTokens(userId, email, role);
}

  /**
   * Genera access token + refresh token.
   * 
   * El payload del JWT contiene:
   * - sub: ID del usuario (estándar JWT)
   * - email: para identificar al usuario fácilmente
   * - role: para verificar permisos sin ir a la DB
   */
  private generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m', // Access token dura 15 minutos
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d', // Refresh token dura 7 días
    });

    return { accessToken, refreshToken };
  }
}