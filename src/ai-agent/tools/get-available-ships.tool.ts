import { PrismaService } from '../../prisma/prisma.service';

export async function getAvailableShips(prisma: PrismaService) {
  const ships = await prisma.ship.findMany({
    where: { status: 'AVAILABLE' },
    select: {
      id: true,
      name: true,
      type: true,
      capacityTeu: true,
      maxWeightTons: true,
      basePrice: true,
    },
  });

  if (ships.length === 0) {
    return 'No hay barcos disponibles en este momento.';
  }

  return ships
    .map(
      (s) =>
        `- ${s.name} (${s.type}): capacidad ${s.capacityTeu} TEU / ${s.maxWeightTons} tons, precio base $${s.basePrice}/día.`,
    )
    .join('\n');
}