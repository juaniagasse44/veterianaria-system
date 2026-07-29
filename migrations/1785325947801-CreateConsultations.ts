import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateConsultations1785325947801 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'consultations',
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
            name: 'appointment_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'veterinarian_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'consultation_date',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'diagnosis',
            type: 'varchar',
            length: '1000',
            isNullable: true,
          },
          {
            name: 'treatment',
            type: 'varchar',
            length: '1000',
            isNullable: true,
          },
          {
            name: 'weight',
            type: 'decimal',
            precision: 6,
            scale: 3,
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'varchar',
            length: '1000',
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
      }),
    );

    await queryRunner.createForeignKey(
      'consultations',
      new TableForeignKey({
        name: 'FK_consultations_pet',
        columnNames: ['pet_id'],
        referencedTableName: 'pets',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'consultations',
      new TableForeignKey({
        name: 'FK_consultations_appointment',
        columnNames: ['appointment_id'],
        referencedTableName: 'appointments',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'consultations',
      new TableForeignKey({
        name: 'FK_consultations_veterinarian',
        columnNames: ['veterinarian_id'],
        referencedTableName: 'veterinarians',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'consultations',
      new TableIndex({
        name: 'IDX_consultations_pet',
        columnNames: ['pet_id', 'consultation_date'],
      }),
    );

    await queryRunner.createIndex(
      'consultations',
      new TableIndex({
        name: 'IDX_consultations_appointment',
        columnNames: ['appointment_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('consultations');
  }
}
