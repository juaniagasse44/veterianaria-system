import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateProductCategoriesAndProducts1785323512815
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'product_categories',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '120',
            isNullable: false,
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
      'product_categories',
      new TableIndex({
        name: 'IDX_product_categories_name',
        columnNames: ['name'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'category_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'sku',
            type: 'varchar',
            length: '60',
            isNullable: true,
          },
          {
            name: 'barcode',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'sale_price',
            type: 'decimal',
            precision: 20,
            scale: 6,
            isNullable: false,
          },
          {
            name: 'cost',
            type: 'decimal',
            precision: 20,
            scale: 6,
            isNullable: false,
            default: 0,
          },
          {
            name: 'vat_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'unit',
            type: 'varchar',
            length: '20',
            isNullable: false,
            default: "'UNIDAD'",
          },
          {
            name: 'track_stock',
            type: 'boolean',
            isNullable: false,
            default: true,
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
      'products',
      new TableForeignKey({
        name: 'FK_products_category',
        columnNames: ['category_id'],
        referencedTableName: 'product_categories',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'UQ_products_sku',
        columnNames: ['sku'],
        isUnique: true,
        where: 'sku IS NOT NULL',
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_barcode',
        columnNames: ['barcode'],
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_name',
        columnNames: ['name'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('products');
    await queryRunner.dropTable('product_categories');
  }
}
