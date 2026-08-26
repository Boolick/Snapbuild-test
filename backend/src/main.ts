import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { StrictValidationPipe } from './core/pipes/strict-validation.pipe';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';
import { TransformInterceptor } from './core/interceptors/transform.interceptor';
import { setupSwagger } from './core/swagger/swagger.config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 4000;
  const corsOrigins = configService.get<string[]>('app.corsOrigins') || [
    'http://localhost:5173',
    'http://localhost:3000',
  ];

  // 1. Global Prefix
  app.setGlobalPrefix('api/v1');

  // 2. CORS Security
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || corsOrigins.includes(origin) || corsOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true); // Dev-friendly permissive fallback
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // 3. Global Pipes (Strict DTO validation, whitelisting, transformations)
  app.useGlobalPipes(new StrictValidationPipe());

  // 4. Global Exception Filters
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // 5. Global Interceptors (Logging, Execution Timing, Transform Envelope)
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // 6. OpenAPI / Swagger Documentation
  setupSwagger(app);

  // 7. Enable Graceful Shutdown Hooks
  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`====================================================`);
  logger.log(`🚀 AI Image Workflow Backend is running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`🎨 Active AI Provider: ${configService.get('app.aiProvider')}`);
  logger.log(`====================================================`);
}

bootstrap();
