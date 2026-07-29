import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateOwners1785283711711 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'owners',
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
            name: 'document',
            type: 'varchar',
            length: '30',
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
            name: 'address',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'varchar',
            length: '500',
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
      'owners',
      new TableIndex({
        name: 'UQ_owners_document',
        columnNames: ['document'],
        isUnique: true,
        where: 'document IS NOT NULL',
      }),
    );

    await queryRunner.createIndex(
      'owners',
      new TableIndex({
        name: 'IDX_owners_full_name',
        columnNames: ['full_name'],
      }),
    );

    await queryRunner.createIndex(
      'owners',
      new TableIndex({
        name: 'IDX_owners_phone',
        columnNames: ['phone'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('owners');
  }
}
