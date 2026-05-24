import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductCombos1748000000000 implements MigrationInterface {
  name = 'AddProductCombos1748000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── product_combos ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "product_combos" (
        "id"          UUID          NOT NULL DEFAULT gen_random_uuid(),
        "name"        VARCHAR(255)  NOT NULL,
        "description" TEXT          NOT NULL,
        "price"       NUMERIC(10,2) NOT NULL,
        "stock"       INT           NOT NULL DEFAULT 0,
        "image_url"   VARCHAR(500),
        "is_active"   BOOLEAN       NOT NULL DEFAULT TRUE,
        "category"    VARCHAR(100),
        "slot_count"  INT           NOT NULL DEFAULT 2,
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_product_combos" PRIMARY KEY ("id")
      )
    `);

    // ── product_combo_items (many-to-many junction) ───────────────────────────
    await queryRunner.query(`
      CREATE TABLE "product_combo_items" (
        "combo_id"   UUID NOT NULL,
        "product_id" UUID NOT NULL,
        CONSTRAINT "PK_product_combo_items" PRIMARY KEY ("combo_id", "product_id"),
        CONSTRAINT "FK_pci_combo"   FOREIGN KEY ("combo_id")
          REFERENCES "product_combos"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pci_product" FOREIGN KEY ("product_id")
          REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);

    // ── extend order_items for combo support ──────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "order_items"
        ALTER COLUMN "product_id" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "order_items"
        ADD COLUMN "combo_id"   UUID        NULL,
        ADD COLUMN "item_type"  VARCHAR(10) NOT NULL DEFAULT 'product'
    `);

    // ── indexes ───────────────────────────────────────────────────────────────
    await queryRunner.query(`CREATE INDEX "IDX_pci_combo"   ON "product_combo_items" ("combo_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_pci_product" ON "product_combo_items" ("product_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_order_items_combo" ON "order_items" ("combo_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_order_items_combo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pci_product"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pci_combo"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "item_type"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "combo_id"`);
    await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "product_id" SET NOT NULL`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_combo_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_combos"`);
  }
}
