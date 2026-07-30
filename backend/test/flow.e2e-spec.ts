import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, resetDatabase } from './utils/test-app';
import { seedAdminAndLogin } from './utils/seed-admin';
import {
  AppointmentResponseBody,
  IdResponse,
  PaginatedResponseBody,
  PetResponseBody,
  StockLevelResponseBody,
  StockMovementResponseBody,
} from './utils/types';

/**
 * Flujo completo del sistema (P3-01): dueño → mascota → turno → consulta
 * (marca ATENDIDO + actualiza peso) → vacuna (descuenta stock). Corre contra
 * una base Postgres de test real (vetsystem_test), no contra la de desarrollo.
 */
describe('Flujo completo (e2e)', () => {
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

  it('recorre dueño → mascota → turno → consulta → vacuna de punta a punta', async () => {
    // 1. Dueño
    const ownerRes = await request(app.getHttpServer())
      .post('/api/owners')
      .set(auth())
      .send({ fullName: 'Carla Ruiz', phone: '11-1234-5678' })
      .expect(201);
    const ownerId = (ownerRes.body as IdResponse).id;

    // 2. Mascota
    const petRes = await request(app.getHttpServer())
      .post('/api/pets')
      .set(auth())
      .send({ ownerId, name: 'Toby', species: 'PERRO' })
      .expect(201);
    const pet = petRes.body as PetResponseBody;
    expect(pet.weight).toBeNull();

    // 3. Veterinario (solo ADMIN)
    const vetRes = await request(app.getHttpServer())
      .post('/api/veterinarians')
      .set(auth())
      .send({ fullName: 'Dr. López' })
      .expect(201);
    const veterinarianId = (vetRes.body as IdResponse).id;

    // 4. Turno
    const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const appointmentRes = await request(app.getHttpServer())
      .post('/api/appointments')
      .set(auth())
      .send({
        petId: pet.id,
        veterinarianId,
        startAt,
        durationMinutes: 30,
        reason: 'CONSULTA',
      })
      .expect(201);
    const appointment = appointmentRes.body as AppointmentResponseBody;
    expect(appointment.status).toBe('PENDIENTE');

    // 5. Consulta desde el turno, con peso -> marca ATENDIDO + actualiza peso
    await request(app.getHttpServer())
      .post('/api/consultations')
      .set(auth())
      .send({
        petId: pet.id,
        appointmentId: appointment.id,
        veterinarianId,
        reason: 'Control anual',
        diagnosis: 'Sano',
        weight: 12.5,
      })
      .expect(201);

    const appointmentAfterRes = await request(app.getHttpServer())
      .get(`/api/appointments/${appointment.id}`)
      .set(auth())
      .expect(200);
    expect((appointmentAfterRes.body as AppointmentResponseBody).status).toBe(
      'ATENDIDO',
    );

    const petAfterRes = await request(app.getHttpServer())
      .get(`/api/pets/${pet.id}`)
      .set(auth())
      .expect(200);
    expect((petAfterRes.body as PetResponseBody).weight).toBe(12.5);

    // 6. Producto de inventario para la vacuna, con stock inicial
    const productRes = await request(app.getHttpServer())
      .post('/api/products')
      .set(auth())
      .send({ name: 'Vacuna Antirrábica', salePrice: 8000, cost: 4000 })
      .expect(201);
    const productId = (productRes.body as IdResponse).id;

    await request(app.getHttpServer())
      .post('/api/stock/initial')
      .set(auth())
      .send({ productId, quantity: 10 })
      .expect(201);

    // 7. Vacunar -> descuenta 1 unidad de stock en la misma transacción
    const vaccinationRes = await request(app.getHttpServer())
      .post('/api/vaccinations')
      .set(auth())
      .send({
        petId: pet.id,
        vaccineName: 'Antirrábica',
        productId,
        validDays: 365,
      })
      .expect(201);
    const vaccinationId = (vaccinationRes.body as IdResponse).id;

    const levelsRes = await request(app.getHttpServer())
      .get('/api/stock/levels')
      .set(auth())
      .expect(200);
    const levels = levelsRes.body as StockLevelResponseBody[];
    const level = levels.find((l) => l.productId === productId);
    expect(level?.quantity).toBe(9);

    const movementsRes = await request(app.getHttpServer())
      .get(`/api/stock/movements?productId=${productId}`)
      .set(auth())
      .expect(200);
    const movements = movementsRes.body as StockMovementResponseBody[];
    const vaccineMovement = movements.find(
      (m) => m.referenceType === 'VACCINE',
    );
    expect(vaccineMovement).toMatchObject({
      quantity: -1,
      referenceId: vaccinationId,
    });

    // 8. Carnet de vacunación de la mascota
    const carnetRes = await request(app.getHttpServer())
      .get(`/api/vaccinations?petId=${pet.id}`)
      .set(auth())
      .expect(200);
    expect((carnetRes.body as PaginatedResponseBody<unknown>).total).toBe(1);

    // 9. Historia clínica de la mascota
    const historyRes = await request(app.getHttpServer())
      .get(`/api/consultations?petId=${pet.id}`)
      .set(auth())
      .expect(200);
    expect((historyRes.body as PaginatedResponseBody<unknown>).total).toBe(1);
  });
});
