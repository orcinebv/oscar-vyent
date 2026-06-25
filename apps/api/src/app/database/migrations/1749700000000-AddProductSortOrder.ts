import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductSortOrder1749700000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0
    `);

    // Initialize sort_order based on creation order (oldest = 0)
    await queryRunner.query(`
      UPDATE products
      SET sort_order = sub.rn
      FROM (
        SELECT id, (ROW_NUMBER() OVER (ORDER BY created_at ASC))::INT - 1 AS rn
        FROM products
      ) sub
      WHERE products.id = sub.id
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE products DROP COLUMN IF EXISTS sort_order`);
  }
}
