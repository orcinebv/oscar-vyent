import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderNumber1749500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create a dedicated sequence for human-readable order numbers
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1`);

    // Add order_number column with auto-assigned value from sequence
    await queryRunner.query(`
      ALTER TABLE "orders"
        ADD COLUMN "order_number" INTEGER UNIQUE DEFAULT nextval('order_number_seq')
    `);

    // Backfill existing rows (dev/staging only — prod would have 0 rows here)
    await queryRunner.query(`
      UPDATE "orders" SET "order_number" = nextval('order_number_seq') WHERE "order_number" IS NULL
    `);

    // Make NAW columns nullable (shop is pick-up / take-away)
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "customer_email"        DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "customer_first_name"   DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "customer_last_name"    DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shipping_address"      DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shipping_postal_code"  DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shipping_city"         DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "order_number"`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS order_number_seq`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "customer_email"       SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "customer_first_name"  SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "customer_last_name"   SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shipping_address"     SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shipping_postal_code" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shipping_city"        SET NOT NULL`);
  }
}
