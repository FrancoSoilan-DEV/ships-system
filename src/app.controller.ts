import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  // GET /api/stats → público, para la landing
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

    return { totalShips, availableShips, activeVoyages: totalVoyages, featuredShip };
  }

  // GET /api/escalations → solo admins
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Get('escalations')
  async getEscalations() {
    return this.prisma.escalationJob.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}