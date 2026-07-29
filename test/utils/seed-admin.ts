import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { UsersService } from '../../src/users/users.service';
import { UserRole } from '../../src/users/entities/user.entity';
import { LoginResponseBody } from './types';

/**
 * El registro público (`POST /auth/register`) siempre crea rol EMPLOYEE, así
 * que para los tests que necesitan ADMIN (crear veterinarios, dar de baja,
 * etc.) se crea el usuario directamente vía UsersService, igual que hace
 * `admin.seed.ts` en producción.
 */
export async function seedAdminAndLogin(
  app: INestApplication<App>,
  email = 'admin.e2e@vetsystem.local',
  password = 'Admin1234',
): Promise<string> {
  const usersService = app.get(UsersService);
  const hashedPassword = await bcrypt.hash(password, 10);
  await usersService.create({
    email,
    password: hashedPassword,
    fullName: 'Admin E2E',
    role: UserRole.ADMIN,
  });

  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  return (response.body as LoginResponseBody).accessToken;
}
