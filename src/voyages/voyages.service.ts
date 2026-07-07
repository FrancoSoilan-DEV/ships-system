import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * VoyagesService maneja la lógica de viajes.
 * 
 * - findMyVoyages: viajes del cliente logueado
 * - quote: calcular cotización sin crear el viaje
 * - create: contratar un viaje
 */
@Injectable()
export class VoyagesService {
  constructor(private readonly prisma: PrismaService) {}

  // Multiplicadores de precio
  private readonly SHIP_MULTIPLIERS: Record<string, number> = {
    CONTAINER:    1.0,
    BULK_CARRIER: 1.1,
    TANKER:       1.3,
    REEFER:       1.5,
    HEAVY_LIFT:   1.8,
  };

  private readonly CARGO_MULTIPLIERS: Record<string, number> = {
    GENERAL:      1.0,
    REFRIGERATED: 1.4,
    HAZARDOUS:    1.6,
    BULK:         1.1,
    OVERSIZED:    2.0,
  };

  // Viajes del cliente logueado
  async findMyVoyages(userId: string) {
    const client = await this.prisma.client.findUnique({
      where: { userId },
    });

    if (!client) return [];

    return this.prisma.voyage.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
      include: {
        ship: { select: { name: true, type: true, flag: true } },
        cargo: true,
      },
    });
  }

  // Calcular cotización sin crear el viaje
  async quote(params: {
    shipId: string;
    cargoType: string;
    durationDays: number;
    origin: string;
    destination: string;
    distanceKm: number;
  }) {
    const ship = await this.prisma.ship.findUnique({
      where: { id: params.shipId },
    });

    if (!ship) throw new BadRequestException('Barco no encontrado');
    if (ship.status !== 'AVAILABLE') throw new BadRequestException('El barco no está disponible');

    const shipMultiplier  = this.SHIP_MULTIPLIERS[ship.type]       ?? 1.0;
    const cargoMultiplier = this.CARGO_MULTIPLIERS[params.cargoType] ?? 1.0;
    const distanceMultiplier = 1 + (params.distanceKm / 10000);

    const finalCost = ship.basePrice * params.durationDays * shipMultiplier * cargoMultiplier * distanceMultiplier;

    return {
      ship: {
        id: ship.id,
        name: ship.name,
        type: ship.type,
        basePrice: ship.basePrice,
      },
      durationDays: params.durationDays,
      cargoType: params.cargoType,
      origin: params.origin,
      destination: params.destination,
      distanceKm: params.distanceKm,
      shipMultiplier,
      cargoMultiplier,
      distanceMultiplier: Math.round(distanceMultiplier * 100) / 100,
      finalCost: Math.round(finalCost * 100) / 100,
    };
  }
}