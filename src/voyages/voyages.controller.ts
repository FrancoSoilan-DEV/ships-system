import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { VoyagesService } from './voyages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyVoyages(@Request() req: RequestWithUser) {
    return this.voyagesService.findMyVoyages(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('quote')
  quote(@Body() dto: QuoteDto) {
    return this.voyagesService.quote(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateVoyageDto, @Request() req: RequestWithUser) {
    return this.voyagesService.create(req.user.id, dto);
  }
}