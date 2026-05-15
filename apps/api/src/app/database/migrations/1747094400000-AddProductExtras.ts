import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductExtras1747094400000 implements MigrationInterface {
  name = 'AddProductExtras1747094400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── product_extras (global pool) ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "product_extras" (
        "id"                     UUID         NOT NULL DEFAULT gen_random_uuid(),
        "name"                   VARCHAR(100) NOT NULL,
        "is_active"              BOOLEAN      NOT NULL DEFAULT TRUE,
        "default_for_categories" TEXT,
        "created_at"             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "updated_at"             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_product_extras" PRIMARY KEY ("id")
      )
    `);

    // ── product_extras_map (many-to-many join) ────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "product_extras_map" (
        "product_id"       UUID NOT NULL,
        "product_extra_id" UUID NOT NULL,
        CONSTRAINT "PK_product_extras_map" PRIMARY KEY ("product_id", "product_extra_id"),
        CONSTRAINT "FK_pem_product" FOREIGN KEY ("product_id")
          REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pem_extra" FOREIGN KEY ("product_extra_id")
          REFERENCES "product_extras"("id") ON DELETE CASCADE
      )
    `);

    // ── add selected_extras to order_items ────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "order_items"
        ADD COLUMN "selected_extras" JSONB
    `);

    // ── indexes ───────────────────────────────────────────────────────────────
    await queryRunner.query(`CREATE INDEX "IDX_pem_product" ON "product_extras_map" ("product_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_pem_extra"   ON "product_extras_map" ("product_extra_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "selected_extras"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_extras_map"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_extras"`);
  }
}
