import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('AI Image Workflow Mini API')
    .setDescription(
      'Strict NestJS backend API for node-based AI image generation workflow editor, DAG parallel execution engine, and preset manager.',
    )
    .setVersion('1.0.0')
    .addTag('Health', 'Health check and system diagnostics')
    .addTag('Presets', 'Curated AI generation presets and prompt rules')
    .addTag('Workflows', 'Workflow graph templates and DAG validation')
    .addTag('Runs', 'Execution engine, parallel job execution and SSE streaming')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'AI Image Workflow API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });
}
