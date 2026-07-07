import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ShipsService } from './ships.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * ShipsController maneja las rutas de barcos.
 * 
 * GET /api/ships/available  → barcos disponibles (clientes)
 * GET /api/ships            → todos los barcos (admins)
 * GET /api/ships/:id        → detalle de un barco
 */
@Controller('ships')
export class ShipsController {
  constructor(private readonly shipsService: ShipsService) {}

  // Público para clientes logueados
  @UseGuards(JwtAuthGuard)
  @Get('available')
  findAvailable() {
    return this.shipsService.findAvailable();
  }

  // Para admins y superadmins
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.shipsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shipsService.findOne(id);
  }
}