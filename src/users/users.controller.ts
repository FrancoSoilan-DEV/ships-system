import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';

interface RequestWithUser {
  user: { id: string; email: string; role: string; name: string };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /api/users/me → perfil del usuario logueado
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: RequestWithUser) {
    return this.usersService.findById(req.user.id);
  }

  // GET /api/users/stats → solo admins
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Get('stats')
  getStats() {
    return this.usersService.getStats();
  }

  // GET /api/users/clients → solo admins
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Get('clients')
  findClients() {
    return this.usersService.findClients();
  }

  // GET /api/users → solo admins
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // GET /api/users/captains → solo superadmin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  @Get('captains')
  findCaptains() {
    return this.usersService.findCaptains();
  }

  // PATCH /api/users/:id/toggle → solo superadmin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  @Patch(':id/toggle')
  toggleActive(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.usersService.toggleActive(id, body.isActive);
  }
}