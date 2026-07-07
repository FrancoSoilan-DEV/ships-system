import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * ShipsService maneja toda la lógica de negocio de barcos.
 * Por ahora solo lectura — el admin podrá crear/editar más adelante.
 */
@Injectable()
export class ShipsService {
  constructor(private readonly prisma: PrismaService) {}

  // Todos los barcos disponibles (para clientes)
  async findAvailable() {
    return this.prisma.ship.findMany({
      where: { status: 'AVAILABLE' },
      orderBy: { basePrice: 'asc' },
      select: {
        id: true,
        name: true,
        flag: true,
        type: true,
        status: true,
        yearBuilt: true,
        capacityTeu: true,
        maxWeightTons: true,
        basePrice: true,
        imageUrl: true,
      },
    });
  }

  // Todos los barcos (para admins)
  async findAll() {
    return this.prisma.ship.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        captain: {
          include: { user: { select: { name: true, email: true } } },
        },
        _count: { select: { voyages: true, crew: true } },
      },
    });
  }

  // Un barco por ID
  async findOne(id: string) {
    return this.prisma.ship.findUnique({
      where: { id },
      include: {
        captain: {
          include: { user: { select: { name: true, email: true } } },
        },
        crew: true,
        _count: { select: { voyages: true } },
      },
    });
  }
}