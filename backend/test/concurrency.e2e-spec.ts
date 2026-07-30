import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, resetDatabase } from './utils/test-app';
import { seedAdminAndLogin } from './utils/seed-admin';
import {
  AppointmentResponseBody,
  IdResponse,
  StockLevelResponseBody,
  StockMovementResponseBody,
} from './utils/types';

/**
 * P3-01 D2: pruebas de concurrencia real contra Postgres. Disparan
 * operaciones en paralelo (Promise.allSettled) y verifican que el sistema no
 * pierde ni duplica nada — turnos (advisory lock) y stock (FOR UPDATE).
 */
describe('Concurrencia (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
    token = await seedAdminAndLogin(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('turnos: solo una de N reservas simultáneas para el mismo vet/horario se crea', async () => {
    const ownerRes = await request(app.getHttpServer())
      .post('/api/owners')
      .set(auth())
      .send({ fullName: 'Dueño Concurrencia' })
      .expect(201);
    const petRes = await request(app.getHttpServer())
      .post('/api/pets')
      .set(auth())
      .send({
        ownerId: (ownerRes.body as IdResponse).id,
        name: 'Rex',
        species: 'PERRO',
      })
      .expect(201);
    const vetRes = await request(app.getHttpServer())
      .post('/api/veterinarians')
      .set(auth())
      .send({ fullName: 'Dr. Concurrente' })
      .expect(201);

    const petId = (petRes.body as IdResponse).id;
    const veterinarianId = (vetRes.body as IdResponse).id;
    const startAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const CONCURRENT = 10;
    const results = await Promise.allSettled(
      Array.from({ length: CONCURRENT }, () =>
        request(app.getHttpServer())
          .post('/api/appointments')
          .set(auth())
          .send({
            petId,
            veterinarianId,
            startAt,
            durationMinutes: 30,
            reason: 'CONTROL',
          }),
      ),
    );

    const created = results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 201,
    );
    const conflicted = results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 409,
    );

    expect(created).toHaveLength(1);
    expect(conflicted).toHaveLength(CONCURRENT - 1);

    const agendaRes = await request(app.getHttpServer())
      .get(`/api/appointments?veterinarianId=${veterinarianId}`)
      .set(auth())
      .expect(200);
    const agenda = agendaRes.body as AppointmentResponseBody[];
    const occupying = agenda.filter(
      (a) => a.status !== 'CANCELADO' && a.startAt === startAt,
    );
    expect(occupying).toHaveLength(1);
  });

  it('stock: N descuentos simultáneos del mismo producto no pierden movimientos', async () => {
    const productRes = await request(app.getHttpServer())
      .post('/api/products')
      .set(auth())
      .send({ name: 'Vacuna Concurrencia', salePrice: 1000 })
      .expect(201);
    const productId = (productRes.body as IdResponse).id;

    await request(app.getHttpServer())
      .post('/api/stock/initial')
      .set(auth())
      .send({ productId, quantity: 100 })
      .expect(201);

    const ownerRes = await request(app.getHttpServer())
      .post('/api/owners')
      .set(auth())
      .send({ fullName: 'Dueño Stock Concurrencia' })
      .expect(201);
    const petRes = await request(app.getHttpServer())
      .post('/api/pets')
      .set(auth())
      .send({
        ownerId: (ownerRes.body as IdResponse).id,
        name: 'Kira',
        species: 'GATO',
      })
      .expect(201);
    const petId = (petRes.body as IdResponse).id;

    const CONCURRENT = 20;
    const results = await Promise.allSettled(
      Array.from({ length: CONCURRENT }, () =>
        request(app.getHttpServer())
          .post('/api/vaccinations')
          .set(auth())
          .send({ petId, vaccineName: 'Dosis concurrente', productId })
          .expect(201),
      ),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    expect(succeeded).toHaveLength(CONCURRENT);

    const levelsRes = await request(app.getHttpServer())
      .get('/api/stock/levels')
      .set(auth())
      .expect(200);
    const levels = levelsRes.body as StockLevelResponseBody[];
    const level = levels.find((l) => l.productId === productId);
    expect(level?.quantity).toBe(100 - CONCURRENT);

    const movementsRes = await request(app.getHttpServer())
      .get(`/api/stock/movements?productId=${productId}`)
      .set(auth())
      .expect(200);
    const movements = movementsRes.body as StockMovementResponseBody[];
    const sum = movements.reduce((acc, m) => acc + m.quantity, 0);
    expect(sum).toBe(level?.quantity);
    expect(movements).toHaveLength(CONCURRENT + 1); // +1 por el INITIAL
  });
});
