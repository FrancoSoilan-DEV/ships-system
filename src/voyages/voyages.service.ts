/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VoyagesService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findMyVoyages(userId: string) {
    const client = await this.prisma.client.findUnique({ where: { userId } });
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

  async findAll() {
    return this.prisma.voyage.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        ship: { select: { name: true, type: true } },
        client: { include: { user: { select: { name: true, email: true } } } },
        cargo: true,
      },
    });
  }

  async getStats() {
    const [total, scheduled, inProgress, completed] = await Promise.all([
      this.prisma.voyage.count(),
      this.prisma.voyage.count({ where: { status: 'SCHEDULED' } }),
      this.prisma.voyage.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.voyage.count({ where: { status: 'COMPLETED' } }),
    ]);

    const revenue = await this.prisma.voyage.aggregate({
      _sum: { finalCost: true },
      where: { status: 'COMPLETED' },
    });

    return {
      total,
      scheduled,
      inProgress,
      completed,
      totalRevenue: revenue._sum.finalCost ?? 0,
    };
  }

  async quote(params: {
    shipId: string;
    cargoType: string;
    durationDays: number;
    origin: string;
    destination: string;
    distanceKm: number;
  }) {
    const ship = await this.prisma.ship.findUnique({ where: { id: params.shipId } });
    if (!ship) throw new BadRequestException('Barco no encontrado');
    if (ship.status !== 'AVAILABLE') throw new BadRequestException('El barco no está disponible');

    const shipMultiplier     = this.SHIP_MULTIPLIERS[ship.type]        ?? 1.0;
    const cargoMultiplier    = this.CARGO_MULTIPLIERS[params.cargoType] ?? 1.0;
    const distanceMultiplier = 1 + (params.distanceKm / 10000);
    const finalCost          = ship.basePrice * params.durationDays * shipMultiplier * cargoMultiplier * distanceMultiplier;

    return {
      ship: { id: ship.id, name: ship.name, type: ship.type, basePrice: ship.basePrice },
      durationDays:       params.durationDays,
      cargoType:          params.cargoType,
      origin:             params.origin,
      destination:        params.destination,
      distanceKm:         params.distanceKm,
      shipMultiplier,
      cargoMultiplier,
      distanceMultiplier: Math.round(distanceMultiplier * 100) / 100,
      finalCost:          Math.round(finalCost * 100) / 100,
    };
  }

  async create(
    userId: string,
    params: {
      shipId: string;
      cargoType: string;
      durationDays: number;
      origin: string;
      destination: string;
      distanceKm: number;
      weightTons: number;
      departureAt: string;
    },
  ) {
    const quote = await this.quote({
      shipId:       params.shipId,
      cargoType:    params.cargoType,
      durationDays: params.durationDays,
      origin:       params.origin,
      destination:  params.destination,
      distanceKm:   params.distanceKm,
    });

    let client = await this.prisma.client.findUnique({ where: { userId } });
    if (!client) {
      client = await this.prisma.client.create({ data: { userId } });
    }

    const departureAt = new Date(params.departureAt);
    const arrivalAt   = new Date(departureAt);
    arrivalAt.setDate(arrivalAt.getDate() + params.durationDays);

    const shipTypeEnum  = quote.ship.type    as any;
    const cargoTypeEnum = params.cargoType   as any;

    let tariff = await this.prisma.tariff.findFirst({
      where: { shipType: shipTypeEnum, cargoType: cargoTypeEnum },
    });

    if (!tariff) {
      tariff = await this.prisma.tariff.create({
        data: {
          name:               `${quote.ship.type} - ${params.cargoType}`,
          shipType:           shipTypeEnum,
          shipTypeMultiplier: quote.shipMultiplier,
          cargoType:          cargoTypeEnum,
          cargoMultiplier:    quote.cargoMultiplier,
          destinationRegion:  params.destination,
          distanceMultiplier: quote.distanceMultiplier,
        },
      });
    }

    const voyage = await this.prisma.voyage.create({
      data: {
        origin:       params.origin,
        destination:  params.destination,
        country:      params.destination.split(',').pop()?.trim() ?? 'Unknown',
        region:       'South America',
        durationDays: params.durationDays,
        departureAt,
        arrivalAt,
        finalCost:    quote.finalCost,
        shipId:       params.shipId,
        clientId:     client.id,
        tariffId:     tariff.id,
      },
      include: {
        ship: { select: { name: true, type: true } },
      },
    });

    await this.prisma.cargo.create({
      data: {
        type:       params.cargoType as any,
        weightTons: params.weightTons,
        teuCount:   0,
        voyageId:   voyage.id,
      },
    });

    await this.prisma.client.update({
      where: { id: client.id },
      data: {
        totalVoyages: { increment: 1 },
        totalSpent:   { increment: quote.finalCost },
      },
    });

    return voyage;
  }
  
  async findByShip(shipId: string) {
    return this.prisma.voyage.findMany({
      where: { shipId },
      orderBy: { createdAt: 'desc' },
      include: {
        client: { include: { user: { select: { name: true, email: true } } } },
        cargo: true,
      },
    });
  }
}