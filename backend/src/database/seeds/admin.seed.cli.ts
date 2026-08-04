import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { seedAdmin, seedDemoUser } from './admin.seed';

const logger = new Logger('AdminSeed');

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    await seedAdmin(app);
    await seedDemoUser(app);
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  logger.error('Error al ejecutar el seed de admin', error);
  process.exit(1);
});
