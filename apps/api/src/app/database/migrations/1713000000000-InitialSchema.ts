import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1713000000000 implements MigrationInterface {
  name = 'InitialSchema1713000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── products ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id"          UUID          NOT NULL DEFAULT gen_random_uuid(),
        "name"        VARCHAR(255)  NOT NULL,
        "description" TEXT          NOT NULL,
        "price"       NUMERIC(10,2) NOT NULL,
        "stock"       INTEGER       NOT NULL DEFAULT 0,
        "image_url"   VARCHAR(500),
        "is_active"   BOOLEAN       NOT NULL DEFAULT TRUE,
        "category"    VARCHAR(100),
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_products" PRIMARY KEY ("id")
      )
    `);

    // ── orders ────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id"                   UUID          NOT NULL DEFAULT gen_random_uuid(),
        "customer_email"       VARCHAR(255)  NOT NULL,
        "customer_first_name"  VARCHAR(100)  NOT NULL,
        "customer_last_name"   VARCHAR(100)  NOT NULL,
        "customer_phone"       VARCHAR(30),
        "shipping_address"     TEXT          NOT NULL,
        "shipping_postal_code" VARCHAR(10)   NOT NULL,
        "shipping_city"        VARCHAR(100)  NOT NULL,
        "shipping_country"     VARCHAR(2)    NOT NULL DEFAULT 'NL',
        "status"               VARCHAR(20)   NOT NULL DEFAULT 'pending',
        "total_amount"         NUMERIC(10,2) NOT NULL,
        "currency"             VARCHAR(3)    NOT NULL DEFAULT 'EUR',
        "notes"                TEXT,
        "created_at"           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_orders"        PRIMARY KEY ("id"),
        CONSTRAINT "CHK_order_status" CHECK (
          "status" IN (
            'pending','payment_pending','paid','processing',
            'shipped','completed','cancelled','failed'
          )
        )
      )
    `);

    // ── order_items ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id"           UUID          NOT NULL DEFAULT gen_random_uuid(),
        "order_id"     UUID          NOT NULL,
        "product_id"   UUID          NOT NULL,
        "product_name" VARCHAR(255)  NOT NULL,
        "unit_price"   NUMERIC(10,2) NOT NULL,
        "quantity"     INTEGER       NOT NULL,
        "total_price"  NUMERIC(10,2) NOT NULL,
        CONSTRAINT "PK_order_items"        PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_items_order"  FOREIGN KEY ("order_id")
          REFERENCES "orders"("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_order_items_qty"   CHECK ("quantity" > 0)
      )
    `);

    // ── payments ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id"                 UUID          NOT NULL DEFAULT gen_random_uuid(),
        "order_id"           UUID          NOT NULL,
        "mollie_payment_id"  VARCHAR(50)   NOT NULL,
        "method"             VARCHAR(50)   NOT NULL DEFAULT 'ideal',
        "status"             VARCHAR(20)   NOT NULL DEFAULT 'open',
        "amount"             NUMERIC(10,2) NOT NULL,
        "currency"           VARCHAR(3)    NOT NULL DEFAULT 'EUR',
        "checkout_url"       TEXT,
        "webhook_url"        TEXT,
        "redirect_url"       TEXT,
        "created_at"         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_payments"                  PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payments_order_id"         UNIQUE ("order_id"),
        CONSTRAINT "UQ_payments_mollie_id"        UNIQUE ("mollie_payment_id"),
        CONSTRAINT "FK_payments_order"            FOREIGN KEY ("order_id")
          REFERENCES "orders"("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_payment_status"           CHECK (
          "status" IN ('open','pending','authorized','expired','failed','canceled','paid')
        )
      )
    `);

    // ── audit_logs ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
        "action"      VARCHAR(60) NOT NULL,
        "entity_type" VARCHAR(50) NOT NULL,
        "entity_id"   UUID        NOT NULL,
        "actor_type"  VARCHAR(20) NOT NULL,
        "actor_ip"    INET,
        "metadata"    JSONB,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);

    // ── indexes ───────────────────────────────────────────────────────────────
    await queryRunner.query(`CREATE INDEX "IDX_orders_email"        ON "orders" ("customer_email")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_status"       ON "orders" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_order_items_order"   ON "order_items" ("order_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_mollie_id"  ON "payments" ("mollie_payment_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_entity"        ON "audit_logs" ("entity_type", "entity_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_action"        ON "audit_logs" ("action")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_created"       ON "audit_logs" ("created_at" DESC)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
  }
}
