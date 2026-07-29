import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';

export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();
  return app;
}

/**
 * Deja la base de test limpia antes de correr una suite: trunca todas las
 * tablas de la app (todo menos la tabla de control de migraciones) y
 * reinicia los ids, así cada archivo de test parte de un estado conocido.
 */
export async function resetDatabase(app: INestApplication<App>): Promise<void> {
  const dataSource = app.get(DataSource);
  const tables: Array<{ tablename: string }> = await dataSource.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'migrations'`,
  );
  if (tables.length === 0) return;

  const tableNames = tables.map((t) => `"${t.tablename}"`).join(', ');
  await dataSource.query(
    `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`,
  );
}
