import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

/**
 * AppController expone endpoints públicos de estadísticas
 * para que la landing page muestre datos reales de la DB.
 */
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  // GET /api/stats
  @Get('stats')
  async getStats() {
    const [totalShips, availableShips, totalVoyages, featuredShip] = await Promise.all([
      this.prisma.ship.count(),
      this.prisma.ship.count({ where: { status: 'AVAILABLE' } }),
      this.prisma.voyage.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.ship.findFirst({
        where: { status: 'AVAILABLE' },
        orderBy: { capacityTeu: 'desc' },
        select: {
          name: true,
          type: true,
          capacityTeu: true,
          maxWeightTons: true,
          basePrice: true,
          flag: true,
        },
      }),
    ]);

    return {
      totalShips,
      availableShips,
      activeVoyages: totalVoyages,
      featuredShip,
    };
  }
}