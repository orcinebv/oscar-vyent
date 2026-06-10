import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppSettings1749600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "app_settings" (
        "key"        VARCHAR(100) NOT NULL,
        "value"      TEXT         NOT NULL,
        "updated_at" TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_app_settings" PRIMARY KEY ("key")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "app_settings" ("key", "value")
      VALUES ('mail.to', 'orcinebv@gmail.com')
      ON CONFLICT ("key") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "app_settings"`);
  }
}
