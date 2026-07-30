import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors();

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('VetSystem API')
    .setDescription(
      'API REST para la gestión de una veterinaria: dueños, mascotas, ' +
        'veterinarios, productos/stock, turnos, historia clínica y vacunas.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .addTag('auth', 'Registro, login y sesión')
    .addTag('owners', 'Dueños / clientes')
    .addTag('pets', 'Mascotas')
    .addTag('veterinarians', 'Veterinarios')
    .addTag('products', 'Catálogo de productos')
    .addTag('product-categories', 'Categorías de productos')
    .addTag('stock', 'Inventario (niveles, movimientos, ajustes)')
    .addTag('appointments', 'Turnos')
    .addTag('consultations', 'Historia clínica / consultas')
    .addTag('vaccinations', 'Vacunas aplicadas')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);
}
bootstrap();
