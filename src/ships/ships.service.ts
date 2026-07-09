/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShipStatus } from '@prisma/client';

@Injectable()
export class ShipsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAvailable() {
    return this.prisma.ship.findMany({
      where: { status: ShipStatus.AVAILABLE },
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

  async update(id: string, data: {
    name?: string;
    status?: ShipStatus;
    basePrice?: number;
  }) {
    return this.prisma.ship.update({
      where: { id },
      data,
    });
  }

  async getStats() {
    const [total, available, maintenance, inVoyage] = await Promise.all([
      this.prisma.ship.count(),
      this.prisma.ship.count({ where: { status: ShipStatus.AVAILABLE } }),
      this.prisma.ship.count({ where: { status: ShipStatus.MAINTENANCE } }),
      this.prisma.ship.count({ where: { status: ShipStatus.ON_VOYAGE } }),
    ]);

    return { total, available, maintenance, onVoyage: inVoyage };
  }

  async create(data: {
    name: string;
    flag: string;
    type: string;
    yearBuilt: number;
    capacityTeu: number;
    maxWeightTons: number;
    basePrice: number;
  }) {
    return this.prisma.ship.create({
      data: {
        name: data.name,
        flag: data.flag,
        type: data.type as any,
        yearBuilt: data.yearBuilt,
        capacityTeu: data.capacityTeu,
        maxWeightTons: data.maxWeightTons,
        basePrice: data.basePrice,
        totalNauticalMiles: 0,
      },
    });
  }
}