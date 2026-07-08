import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AIAgentService, ChatMessage } from './ai-agent.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface ChatDto {
  sessionId: string;
  message: string;
  history: ChatMessage[];
}

interface RequestWithUser {
  user: { id: string; name: string; email: string; role: string };
}

@Controller('ai-agent')
export class AIAgentController {
  constructor(private readonly aiAgentService: AIAgentService) {}

  // Para visitantes en la landing (puede crear cuentas)
  @Post('chat')
  chat(@Body() dto: ChatDto) {
    return this.aiAgentService.chat(
      dto.sessionId,
      dto.message,
      dto.history ?? [],
    );
  }

  // Para usuarios logueados en el portal (NO crea cuentas)
  @UseGuards(JwtAuthGuard)
  @Post('support')
  support(
    @Body() dto: ChatDto,
    @Request() req: RequestWithUser,
  ) {
    return this.aiAgentService.supportChat(
      dto.sessionId,
      dto.message,
      dto.history ?? [],
      req.user,
    );
  }
}