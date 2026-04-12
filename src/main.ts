import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const baseUrl = configService.get<string>(
    'BASE_URL',
    'http://localhost:3000',
  );
  const fallbackPort = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');

  const url = new URL(baseUrl);
  const host = url.hostname;
  const port = url.port ? parseInt(url.port, 10) : fallbackPort;

  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      forbidUnknownValues: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const swaggerEnabledValue = configService.get<string>(
    'SWAGGER_ENABLED',
    'true',
  );
  const swaggerEnabled = String(swaggerEnabledValue).toLowerCase();

  if (swaggerEnabled === 'true') {
    const config = new DocumentBuilder()
      .setTitle('LinkedIn Maxxer API')
      .setDescription('LinkedIn Maxxer Backend API Documentation')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http' }, 'AccessToken')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      jsonDocumentUrl: `/${apiPrefix}/docs-json`,
    });
  }

  await app.listen(port, host);
}

bootstrap();
