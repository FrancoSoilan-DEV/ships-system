import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ShipsService } from './ships.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ShipStatus } from '@prisma/client';

@Controller('ships')
export class ShipsController {
  constructor(private readonly shipsService: ShipsService) {}

  // GET /api/ships/available → clientes logueados
  @UseGuards(JwtAuthGuard)
  @Get('available')
  findAvailable() {
    return this.shipsService.findAvailable();
  }

  // GET /api/ships/stats → solo admins
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Get('stats')
  getStats() {
    return this.shipsService.getStats();
  }

  // GET /api/ships → solo admins
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Get()
  findAll() {
    return this.shipsService.findAll();
  }

  // GET /api/ships/:id → cualquier usuario logueado
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shipsService.findOne(id);
  }

  // PATCH /api/ships/:id → solo admins
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; status?: ShipStatus; basePrice?: number },
  ) {
    return this.shipsService.update(id, body);
  }

  // dentro del controller:
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Post()
  create(@Body() body: {
    name: string;
    flag: string;
    type: string;
    yearBuilt: number;
    capacityTeu: number;
    maxWeightTons: number;
    basePrice: number;
  }) {
    return this.shipsService.create(body);
  }

  // GET /api/ships/my → barco asignado al capitán logueado
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CAPTAIN')
  @Get('my')
  findMyCaptainShip(@Request() req: { user: { id: string } }) {
    return this.shipsService.findByCaptain(req.user.id);
  }
}