import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateStockLevelsAndMovements1785323529155
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'stock_levels',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'product_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 14,
            scale: 4,
            isNullable: false,
            default: 0,
          },
          {
            name: 'min_quantity',
            type: 'decimal',
            precision: 14,
            scale: 4,
            isNullable: false,
            default: 0,
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
      'stock_levels',
      new TableForeignKey({
        name: 'FK_stock_levels_product',
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createIndex(
      'stock_levels',
      new TableIndex({
        name: 'UQ_stock_levels_product',
        columnNames: ['product_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'stock_movements',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'product_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 14,
            scale: 4,
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'unit_cost',
            type: 'decimal',
            precision: 20,
            scale: 6,
            isNullable: true,
          },
          {
            name: 'reference_type',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'reference_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'varchar',
            length: '300',
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
      'stock_movements',
      new TableForeignKey({
        name: 'FK_stock_movements_product',
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createIndex(
      'stock_movements',
      new TableIndex({
        name: 'IDX_movements_product',
        columnNames: ['product_id'],
      }),
    );

    await queryRunner.createIndex(
      'stock_movements',
      new TableIndex({
        name: 'IDX_movements_reference',
        columnNames: ['reference_type', 'reference_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('stock_movements');
    await queryRunner.dropTable('stock_levels');
  }
}
