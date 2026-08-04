import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { seedAdmin, seedDemoUser } from './database/seeds/admin.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  if (configService.get<string>('NODE_ENV') === 'production') {
    const bootstrapLogger = new Logger('Bootstrap');
    await seedAdmin(app).catch((error) => {
      bootstrapLogger.error(
        'Error al ejecutar el seed de admin, la app continúa iniciando igual',
        error,
      );
    });
    await seedDemoUser(app).catch((error) => {
      bootstrapLogger.error(
        'Error al ejecutar el seed de usuario demo, la app continúa iniciando igual',
        error,
      );
    });
  }

  // Sin FRONTEND_URL (dev local) se permite cualquier origen, igual que
  // antes. En producción se restringe al/los origen(es) configurados
  // (soporta una lista separada por comas para más de un frontend).
  // Se normalizan espacios y barras finales porque el Origin que manda el
  // browser nunca trae trailing slash, y es un error común al pegar la
  // URL en las env vars de Render/Vercel.
  const corsLogger = new Logger('CORS');
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  const allowedOrigins = frontendUrl
    ? frontendUrl
        .split(',')
        .map((origin) => origin.trim().replace(/\/+$/, ''))
        .filter(Boolean)
    : null;

  app.enableCors({
    origin: (origin, callback) => {
      // Sin header Origin (curl, health checks, server-to-server) o sin
      // restricción configurada: se permite.
      if (!allowedOrigins || !origin) {
        callback(null, true);
        return;
      }
      const normalizedOrigin = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
        return;
      }
      corsLogger.warn(
        `Origin rechazado: "${origin}". Permitidos: ${allowedOrigins.join(', ')}`,
      );
      callback(null, false);
    },
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
