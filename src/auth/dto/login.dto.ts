/**
 * DTO de login. Define qué datos debe enviar el cliente
 * cuando quiere iniciar sesión en POST /api/auth/login.
 */
export class LoginDto {
  email!: string;
  password!: string;
}