import type { MigrationInterface, QueryRunner } from 'typeorm';

// Reuses the inventory_policy enum created with order_request, so down() keeps the type.
export class CreateSettings1795044389161 implements MigrationInterface {
  name = 'CreateSettings1795044389161';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "settings" ("id" boolean NOT NULL DEFAULT true, "inventory_policy" "public"."inventory_policy" NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_settings_single_row" CHECK ("id" = true), CONSTRAINT "PK_settings" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "settings"`);
  }
}
