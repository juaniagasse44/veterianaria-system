import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableCheck,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateAppointments1785325047643 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'appointments',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'pet_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'veterinarian_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'start_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'end_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '30',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            isNullable: false,
            default: "'PENDIENTE'",
          },
          {
            name: 'notes',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'creation_date',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'last_update_date',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        checks: [
          new TableCheck({
            name: 'CHK_appointments_end_after_start',
            expression: '"end_at" > "start_at"',
          }),
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'appointments',
      new TableForeignKey({
        name: 'FK_appointments_pet',
        columnNames: ['pet_id'],
        referencedTableName: 'pets',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'appointments',
      new TableForeignKey({
        name: 'FK_appointments_veterinarian',
        columnNames: ['veterinarian_id'],
        referencedTableName: 'veterinarians',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createIndex(
      'appointments',
      new TableIndex({
        name: 'IDX_appointments_vet_start',
        columnNames: ['veterinarian_id', 'start_at'],
      }),
    );

    await queryRunner.createIndex(
      'appointments',
      new TableIndex({
        name: 'IDX_appointments_pet',
        columnNames: ['pet_id'],
      }),
    );

    await queryRunner.createIndex(
      'appointments',
      new TableIndex({
        name: 'IDX_appointments_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('appointments');
  }
}
