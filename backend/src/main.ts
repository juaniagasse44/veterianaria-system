import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { seedAdmin } from './database/seeds/admin.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  if (configService.get<string>('NODE_ENV') === 'production') {
    await seedAdmin(app).catch((error) => {
      new Logger('Bootstrap').error(
        'Error al ejecutar el seed de admin, la app continúa iniciando igual',
        error,
      );
    });
  }

  // Sin FRONTEND_URL (dev local) se permite cualquier origen, igual que
  // antes. En producción se restringe al/los origen(es) configurados
  // (soporta una lista separada por comas para más de un frontend).
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  app.enableCors({
    origin: frontendUrl ? frontendUrl.split(',').map((origin) => origin.trim()) : true,
  });

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
