/**
 * DTO de registro. Define qué datos debe enviar el cliente
 * cuando quiere crear una cuenta en POST /api/auth/register.
 * 
 * Por ahora sin validaciones externas — más adelante podemos
 * agregar class-validator para validar email, longitud de password, etc.
 */
export class  RegisterDto{
    name!: string;
    email!: string;
    password!: string;
}