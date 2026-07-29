import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateVaccinations1785327387741 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'vaccinations',
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
            name: 'product_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'vaccine_name',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'applied_date',
            type: 'date',
            default: 'now()',
          },
          {
            name: 'next_dose_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'veterinarian_id',
            type: 'int',
            isNullable: true,
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
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'vaccinations',
      new TableForeignKey({
        name: 'FK_vaccinations_pet',
        columnNames: ['pet_id'],
        referencedTableName: 'pets',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'vaccinations',
      new TableForeignKey({
        name: 'FK_vaccinations_product',
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'vaccinations',
      new TableForeignKey({
        name: 'FK_vaccinations_veterinarian',
        columnNames: ['veterinarian_id'],
        referencedTableName: 'veterinarians',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'vaccinations',
      new TableIndex({
        name: 'IDX_vaccinations_pet',
        columnNames: ['pet_id', 'applied_date'],
      }),
    );

    await queryRunner.createIndex(
      'vaccinations',
      new TableIndex({
        name: 'IDX_vaccinations_next_dose',
        columnNames: ['next_dose_date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('vaccinations');
  }
}
