import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiGatewayService } from './services/ai-gateway.service';
import { MockAiAdapter } from './adapters/mock-ai.adapter';

@Module({
  imports: [ConfigModule],
  providers: [MockAiAdapter, AiGatewayService],
  exports: [AiGatewayService],
})
export class AiModule {}
