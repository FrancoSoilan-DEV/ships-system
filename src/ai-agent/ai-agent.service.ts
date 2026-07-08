import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { PrismaService } from '../prisma/prisma.service';
import { getAvailableShips } from './tools/get-available-ships.tool';
import { getVoyagePricing } from './tools/get-voyage-pricing.tool';
import { getDestinationOptions } from './tools/get-destination-options.tool';
import { escalateToAdmin } from './tools/escalate-to-admin.tool';
import { createClientAccount } from './tools/create-client-account.tool';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AIAgentService {
  private groq: Groq;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.groq = new Groq({
      apiKey: this.configService.get<string>('GROQ_API_KEY'),
    });
  }

  // ── Chat público (landing) ─────────────────────────────────
  async chat(sessionId: string, message: string, history: ChatMessage[]) {
    const systemPrompt = `Sos un asistente virtual profesional de Ships System, empresa líder en gestión de flota marítima.

PERSONALIDAD:
- Amable, profesional y directo
- Respondés SIEMPRE en el mismo idioma que el usuario
- SIEMPRE usás formato estructurado con viñetas, numeración y emojis
- NUNCA respondés en un bloque de texto corrido

REGLAS DE FORMATO — SEGUÍ ESTO EN CADA RESPUESTA:
- Usá numeración (1. 2. 3.) para listas de opciones o pasos
- Usá viñetas (•) para características o detalles
- Usá emojis al inicio de cada sección: 🚢 💰 📍 📦 ❄️ 🛢️ 📊 ✅ 👤 📧 🔑
- Dejá una línea en blanco entre cada elemento o sección
- NUNCA pongas dos elementos en la misma línea
- NUNCA uses punto y coma para separar datos
- Terminá SIEMPRE con una pregunta corta

FORMATO PARA LISTAR BARCOS:
🚢 **[Nombre del barco]**
- Tipo: [tipo]
- Capacidad: [X] TEU / [Y] tons
- 💰 Precio base: $[precio]/día

FORMATO PARA COTIZACIONES:
📊 **Cotización estimada**
- 🚢 Barco: [nombre]
- 📅 Duración: [X] días
- 📦 Tipo de carga: [tipo]
- 📏 Distancia: [X] km
- 💰 **Total estimado: $[monto] USD**

FORMATO PARA CREAR CUENTA:
Para crear tu cuenta necesito:
1. 👤 Tu nombre completo
2. 📧 Tu correo electrónico

✅ **Cuenta creada exitosamente**
- 📧 Email: [email]
- 🔑 Contraseña temporal: [password]
- 🔗 Iniciá sesión en: /login.html

REGLA FINAL: Si el usuario pregunta cuántos barcos hay, usá la tool, contá y respondé con el número exacto.`;

    return this.runChat(sessionId, message, history, systemPrompt, true);
  }

  // ── Chat de soporte (portal cliente) ──────────────────────
  async supportChat(
    sessionId: string,
    message: string,
    history: ChatMessage[],
    user: { id: string; name: string; email: string; role: string },
  ) {
    const systemPrompt = `Sos un asistente de soporte de Ships System.

El usuario ya está logueado en el sistema:
- Nombre: ${user.name}
- Email: ${user.email}
- Rol: ${user.role}

REGLAS IMPORTANTES:
- NUNCA le pidas crear una cuenta — ya tiene una
- NUNCA uses la tool createClientAccount
- Si quiere contratar un viaje, indicale que use el cotizador en su portal
- Respondé siempre en el idioma del usuario
- Usá formato claro con emojis y saltos de línea
- Si el caso requiere atención humana, escalá con escalateToAdmin

FORMATO DE RESPUESTA:
- Usá viñetas y emojis para organizar la información
- Una línea en blanco entre secciones
- Terminá con una pregunta corta`;

    return this.runChat(sessionId, message, history, systemPrompt, false);
  }

  // ── Motor común ────────────────────────────────────────────
  private async runChat(
    sessionId: string,
    message: string,
    history: ChatMessage[],
    systemPrompt: string,
    includeCreateAccount: boolean,
  ) {
    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const allTools: Groq.Chat.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'getAvailableShips',
          description: 'Obtiene la lista de barcos disponibles en la flota.',
          parameters: { type: 'object', properties: {}, required: [] },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getVoyagePricing',
          description: 'Calcula el costo estimado de un viaje marítimo.',
          parameters: {
            type: 'object',
            properties: {
              basePrice:    { type: 'number', description: 'Precio base del barco por día en USD' },
              durationDays: { type: 'number', description: 'Duración del viaje en días' },
              shipType:     { type: 'string', description: 'Tipo de barco: CONTAINER, BULK_CARRIER, TANKER, REEFER, HEAVY_LIFT' },
              cargoType:    { type: 'string', description: 'Tipo de carga: GENERAL, REFRIGERATED, HAZARDOUS, BULK, OVERSIZED' },
              distanceKm:   { type: 'number', description: 'Distancia del viaje en kilómetros' },
            },
            required: ['basePrice', 'durationDays', 'shipType', 'cargoType', 'distanceKm'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getDestinationOptions',
          description: 'Obtiene las rutas y destinos disponibles.',
          parameters: { type: 'object', properties: {}, required: [] },
        },
      },
      {
        type: 'function',
        function: {
          name: 'escalateToAdmin',
          description: 'Escala la conversación a un asesor humano cuando el caso es complejo.',
          parameters: {
            type: 'object',
            properties: {
              reason: { type: 'string', description: 'Motivo de la escalación' },
            },
            required: ['reason'],
          },
        },
      },
    ];

    if (includeCreateAccount) {
      allTools.push({
        type: 'function',
        function: {
          name: 'createClientAccount',
          description: 'Crea una cuenta de cliente cuando el usuario decide contratar.',
          parameters: {
            type: 'object',
            properties: {
              name:  { type: 'string', description: 'Nombre completo del cliente' },
              email: { type: 'string', description: 'Email del cliente' },
            },
            required: ['name', 'email'],
          },
        },
      });
    }

    const response = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      tools: allTools,
      tool_choice: 'auto',
      max_tokens: 1024,
    });

    const responseMessage = response.choices[0].message;

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;

      let toolResult: string;

      switch (toolName) {
        case 'getAvailableShips':
          toolResult = await getAvailableShips(this.prisma);
          break;
        case 'getVoyagePricing':
          toolResult = JSON.stringify(getVoyagePricing(toolArgs as Parameters<typeof getVoyagePricing>[0]));
          break;
        case 'getDestinationOptions':
          toolResult = getDestinationOptions();
          break;
        case 'createClientAccount':
          toolResult = await createClientAccount(this.prisma, toolArgs as { name: string; email: string });
          break;
        case 'escalateToAdmin':
          toolResult = await escalateToAdmin(this.prisma, sessionId, toolArgs.reason as string);
          break;
        default:
          toolResult = 'Tool no encontrada';
      }

      const secondResponse = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          ...messages,
          responseMessage,
          { role: 'tool', tool_call_id: toolCall.id, content: toolResult },
        ],
        max_tokens: 1024,
      });

      return {
        message: secondResponse.choices[0].message.content,
        sessionId,
      };
    }

    return {
      message: responseMessage.content,
      sessionId,
    };
  }
}