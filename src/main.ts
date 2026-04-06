import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true, credentials: true });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const configService = app.get(ConfigService);

  const swaggerEnabled = configService
    .get<string>('SWAGGER_ENABLED', 'true')
    .toLowerCase();

  if (swaggerEnabled === 'true') {
    const config = new DocumentBuilder()
      .setTitle('LinkedIn Maxxer API')
      .setDescription('LinkedIn Maxxer Backend API Documentation')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http' }, 'AccessToken')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      jsonDocumentUrl: '/api/docs-json',
    });
  }

  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);
  console.log(` Application is running on: http://localhost:${port}`);
  if (swaggerEnabled === 'true') {
    console.log(` Swagger documentation: http://localhost:${port}/api/docs`);
  }
}
bootstrap();
