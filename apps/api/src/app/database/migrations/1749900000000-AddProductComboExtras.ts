import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductComboExtras1749900000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS product_combo_extras (
        combo_id UUID NOT NULL REFERENCES product_combos(id) ON DELETE CASCADE,
        extra_id UUID NOT NULL REFERENCES product_extras(id) ON DELETE CASCADE,
        PRIMARY KEY (combo_id, extra_id)
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS product_combo_extras`);
  }
}
