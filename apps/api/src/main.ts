import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { validateConfig } from './config/config.validation';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

if (process.env.NODE_ENV !== 'production') {
  config({ path: '.env.local', override: true });
}

async function bootstrap() {
  validateConfig();

  const { AppModule } = await import('./app.module');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5180',
    credentials: true,
  });

  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv !== 'production') {
    const openApiConfig = new DocumentBuilder()
      .setTitle('Drive-Thru Survey API')
      .setDescription('Post-order pilot survey for AI drive-thru')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, openApiConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
      jsonDocumentUrl: 'api/docs-json',
    });
  }

  const port = process.env.PORT ?? 3010;
  await app.listen(port, '0.0.0.0');
  console.log(`Survey API listening on :${port} (${nodeEnv})`);
}

void bootstrap();
