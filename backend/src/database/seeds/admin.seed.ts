import { Logger, INestApplicationContext } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/entities/user.entity';

const SALT_ROUNDS = 10;
const logger = new Logger('AdminSeed');

export async function seedAdmin(
  app: INestApplicationContext,
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    logger.warn(
      'ADMIN_EMAIL y ADMIN_PASSWORD no están definidos, se omite el seed de admin.',
    );
    return;
  }

  const usersService = app.get(UsersService);

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
}
