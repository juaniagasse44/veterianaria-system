import { Body, Controller, INestApplication, Post, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IsString } from 'class-validator';
import request from 'supertest';
import { App } from 'supertest/types';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

/**
 * F-01 no crea entidades de negocio, así que este controlador existe solo
 * dentro del test para verificar el ValidationPipe/AllExceptionsFilter
 * globales de punta a punta (mismo wiring que main.ts).
 */
class PingDto {
  @IsString()
  message: string;
}

@Controller('ping-test')
class PingTestController {
  @Post()
  ping(@Body() body: PingDto) {
    return body;
  }
}

describe('Global pipes/filters (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PingTestController],
    }).compile();

    app = moduleFixture.createNestApplication();
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts a valid body', () => {
    return request(app.getHttpServer())
      .post('/api/ping-test')
      .send({ message: 'hi' })
      .expect(201)
      .expect({ message: 'hi' });
  });

  it('rejects an unexpected field with 400 and the D4 error format', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/ping-test')
      .send({ message: 'hi', extra: 'not allowed' })
      .expect(400);

    expect(res.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      path: '/api/ping-test',
    });
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('timestamp');
  });
});
