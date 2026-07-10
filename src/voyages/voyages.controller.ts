import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { VoyagesService } from './voyages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface RequestWithUser {
  user: { id: string; email: string; role: string };
}

interface QuoteDto {
  shipId: string;
  cargoType: string;
  durationDays: number;
  origin: string;
  destination: string;
  distanceKm: number;
}

interface CreateVoyageDto {
  shipId: string;
  cargoType: string;
  durationDays: number;
  origin: string;
  destination: string;
  distanceKm: number;
  weightTons: number;
  departureAt: string;
}

@Controller('voyages')
export class VoyagesController {
  constructor(private readonly voyagesService: VoyagesService) {}

  // GET /api/voyages/my → cliente logueado
  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyVoyages(@Request() req: RequestWithUser) {
    return this.voyagesService.findMyVoyages(req.user.id);
  }

  // GET /api/voyages/stats → solo admins
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Get('stats')
  getStats() {
    return this.voyagesService.getStats();
  }

  // GET /api/voyages → solo admins
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Get()
  findAll() {
    return this.voyagesService.findAll();
  }

  // POST /api/voyages/quote → cualquier usuario logueado
  @UseGuards(JwtAuthGuard)
  @Post('quote')
  quote(@Body() dto: QuoteDto) {
    return this.voyagesService.quote(dto);
  }

  // POST /api/voyages → cliente logueado
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateVoyageDto, @Request() req: RequestWithUser) {
    return this.voyagesService.create(req.user.id, dto);
  }

  // GET /api/voyages/ship/:shipId → viajes de un barco específico
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAPTAIN', 'ADMIN', 'SUPERADMIN')
  @Get('ship/:shipId')
  findByShip(@Param('shipId') shipId: string) {
    return this.voyagesService.findByShip(shipId);
  }
}