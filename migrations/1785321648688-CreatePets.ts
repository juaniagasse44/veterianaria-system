import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreatePets1785321648688 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pets',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'owner_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'species',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'breed',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'sex',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'birth_date',
            type: 'date',
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
            name: 'color',
            type: 'varchar',
            length: '60',
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

    await queryRunner.createForeignKey(
      'pets',
      new TableForeignKey({
        name: 'FK_pets_owner',
        columnNames: ['owner_id'],
        referencedTableName: 'owners',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createIndex(
      'pets',
      new TableIndex({
        name: 'IDX_pets_owner',
        columnNames: ['owner_id'],
      }),
    );

    await queryRunner.createIndex(
      'pets',
      new TableIndex({
        name: 'IDX_pets_name',
        columnNames: ['name'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('pets');
  }
}
