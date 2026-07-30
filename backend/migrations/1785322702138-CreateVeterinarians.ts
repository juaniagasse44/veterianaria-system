import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateVeterinarians1785322702138 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'veterinarians',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'full_name',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'license_number',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'specialty',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '150',
            isNullable: true,
          },
          {
            name: 'active',
            type: 'boolean',
            isNullable: false,
            default: true,
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

    await queryRunner.createIndex(
      'veterinarians',
      new TableIndex({
        name: 'UQ_veterinarians_license',
        columnNames: ['license_number'],
        isUnique: true,
        where: 'license_number IS NOT NULL',
      }),
    );

    await queryRunner.createIndex(
      'veterinarians',
      new TableIndex({
        name: 'IDX_veterinarians_full_name',
        columnNames: ['full_name'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('veterinarians');
  }
}
