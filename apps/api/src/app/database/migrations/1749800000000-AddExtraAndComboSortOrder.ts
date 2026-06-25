import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExtraAndComboSortOrder1749800000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE product_extras ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(`
      UPDATE product_extras SET sort_order = sub.rn
      FROM (SELECT id, (ROW_NUMBER() OVER (ORDER BY name ASC))::INT - 1 AS rn FROM product_extras) sub
      WHERE product_extras.id = sub.id
    `);

    await queryRunner.query(
      `ALTER TABLE product_combos ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(`
      UPDATE product_combos SET sort_order = sub.rn
      FROM (SELECT id, (ROW_NUMBER() OVER (ORDER BY created_at ASC))::INT - 1 AS rn FROM product_combos) sub
      WHERE product_combos.id = sub.id
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE product_extras DROP COLUMN IF EXISTS sort_order`);
    await queryRunner.query(`ALTER TABLE product_combos DROP COLUMN IF EXISTS sort_order`);
  }
}
