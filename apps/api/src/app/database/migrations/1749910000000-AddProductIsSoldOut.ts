import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductIsSoldOut1749910000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS is_sold_out BOOLEAN NOT NULL DEFAULT FALSE`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE products DROP COLUMN IF EXISTS is_sold_out`);
  }
}
