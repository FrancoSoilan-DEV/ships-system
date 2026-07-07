import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AIAgentModule } from './ai-agent/ai-agent.module';
import { ShipsModule } from './ships/ships.module';
import { VoyagesModule } from './voyages/voyages.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AIAgentModule,
    ShipsModule,
    VoyagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}