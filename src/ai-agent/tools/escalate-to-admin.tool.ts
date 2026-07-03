import { PrismaService } from '../../prisma/prisma.service';

/**
 * Tool: escalateToAdmin
 * 
 * Cuando el caso es complejo o el cliente lo pide,
 * la IA crea un job de escalación para que un admin humano
 * tome el control de la conversación.
 * 
 * Más adelante esto se conecta con BullMQ.
 */
export async function escalateToAdmin(
  prisma: PrismaService,
  sessionId: string,
  reason: string,
) {
  await prisma.escalationJob.create({
    data: {
      sessionId,
      reason,
      status: 'PENDING',
    },
  });

  return 'He escalado tu consulta a un asesor humano. Te contactaremos pronto. ¿Hay algo más en lo que pueda ayudarte mientras tanto?';
}