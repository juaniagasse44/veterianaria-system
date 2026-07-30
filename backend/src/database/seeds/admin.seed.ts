import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../app.module';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/entities/user.entity';

const SALT_ROUNDS = 10;
const logger = new Logger('AdminSeed');

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    logger.error(
      'ADMIN_EMAIL y ADMIN_PASSWORD deben estar definidos en el env',
    );
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    const existing = await usersService.findByEmail(adminEmail);
    if (existing) {
      logger.log(`El admin ${adminEmail} ya existe, no se crea de nuevo.`);
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);
    await usersService.create({
      email: adminEmail,
      password: hashedPassword,
      fullName: 'Administrador',
      role: UserRole.ADMIN,
    });
    logger.log(`Admin ${adminEmail} creado correctamente.`);
  } finally {
    await app.close();
  }
}

seedAdmin().catch((error) => {
  logger.error('Error al ejecutar el seed de admin', error);
  process.exit(1);
});
