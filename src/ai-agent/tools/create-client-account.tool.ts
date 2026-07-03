import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

/**
 * Tool: createClientAccount
 * 
 * La IA llama a esta función cuando el cliente decide contratar.
 * Crea la cuenta automáticamente y retorna las credenciales
 * para que la IA se las comunique al cliente.
 */
export async function createClientAccount(
  prisma: PrismaService,
  params: {
    name: string;
    email: string;
  },
) {
  // Verificar si el email ya existe
  const existing = await prisma.user.findUnique({
    where: { email: params.email },
  });

  if (existing) {
    return `Ya existe una cuenta con el email ${params.email}. El cliente puede iniciar sesión directamente.`;
  }

  // Generar password temporal
  const tempPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  // Crear usuario con rol CLIENT
  const user = await prisma.user.create({
    data: {
      name: params.name,
      email: params.email,
      password: hashedPassword,
      role: 'CLIENT',
    },
  });

  // Crear perfil de cliente
  await prisma.client.create({
    data: { userId: user.id },
  });

  return `Cuenta creada exitosamente. 
  - Email: ${params.email}
  - Contraseña temporal: ${tempPassword}
  - Por favor iniciá sesión en /login.html y cambiá tu contraseña.`;
}