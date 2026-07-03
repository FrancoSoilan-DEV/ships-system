import { Module } from '@nestjs/common';
import { AIAgentService } from './ai-agent.service';
import { AIAgentController } from './ai-agent.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * AIAgentModule agrupa todo lo relacionado al agente de IA.
 * Importa PrismaModule para que AIAgentService pueda
 * consultar la DB cuando ejecuta las tools.
 */
@Module({
  imports: [PrismaModule],
  controllers: [AIAgentController],
  providers: [AIAgentService],
})
export class AIAgentModule {}