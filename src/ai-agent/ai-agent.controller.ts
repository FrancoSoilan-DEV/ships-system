import { Controller, Post, Body } from '@nestjs/common';
import { AIAgentService, ChatMessage } from './ai-agent.service';

/**
 * Body que espera el endpoint de chat.
 * El frontend manda el mensaje actual + todo el historial
 * para que la IA tenga contexto de la conversación.
 */
interface ChatDto {
  sessionId: string;
  message: string;
  history: ChatMessage[];
}

/**
 * AIAgentController maneja las rutas HTTP del agente.
 * 
 * POST /api/ai-agent/chat → enviar mensaje al agente
 */
@Controller('ai-agent')
export class AIAgentController {
  constructor(private readonly aiAgentService: AIAgentService) {}

  @Post('chat')
  chat(@Body() dto: ChatDto) {
    return this.aiAgentService.chat(
      dto.sessionId,
      dto.message,
      dto.history ?? [],
    );
  }
}