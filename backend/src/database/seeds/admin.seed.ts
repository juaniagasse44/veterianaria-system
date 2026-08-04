import { Logger, INestApplicationContext } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/entities/user.entity';

const SALT_ROUNDS = 10;
const logger = new Logger('AdminSeed');

const DEMO_EMAIL_DEFAULT = 'demo@vetsystem.com';
const DEMO_PASSWORD_DEFAULT = 'demo1234';

async function createUserIfNotExists(
  usersService: UsersService,
  params: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
  },
): Promise<void> {
  const existing = await usersService.findByEmail(params.email);
  if (existing) {
    logger.log(`El usuario ${params.email} ya existe, no se crea de nuevo.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(params.password, SALT_ROUNDS);
  await usersService.create({
    email: params.email,
    password: hashedPassword,
    fullName: params.fullName,
    role: params.role,
  });
  logger.log(`Usuario ${params.email} (${params.role}) creado correctamente.`);
}

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

  await createUserIfNotExists(usersService, {
    email: adminEmail,
    password: adminPassword,
    fullName: 'Administrador',
    role: UserRole.ADMIN,
  });
}

export async function seedDemoUser(
  app: INestApplicationContext,
): Promise<void> {
  const demoEmail = process.env.DEMO_EMAIL || DEMO_EMAIL_DEFAULT;
  const demoPassword = process.env.DEMO_PASSWORD || DEMO_PASSWORD_DEFAULT;

  const usersService = app.get(UsersService);

  await createUserIfNotExists(usersService, {
    email: demoEmail,
    password: demoPassword,
    fullName: 'Usuario Demo',
    role: UserRole.EMPLOYEE,
  });
}
