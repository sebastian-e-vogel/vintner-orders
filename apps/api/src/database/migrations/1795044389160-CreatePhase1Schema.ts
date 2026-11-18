import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePhase1Schema1795044389160 implements MigrationInterface {
  name = 'CreatePhase1Schema1795044389160';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "customer" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying NOT NULL, "contact_name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying NOT NULL, CONSTRAINT "PK_a7a13f4cacb744524e44dfdad32" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sales_rep" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying NOT NULL, "email" character varying NOT NULL, CONSTRAINT "UQ_62d96d9ab3ec5efa2a7ebff6238" UNIQUE ("email"), CONSTRAINT "PK_a48f255fcc738653b321fd41a01" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "historical_order" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "customer_id" uuid NOT NULL, "sales_rep_id" uuid NOT NULL, "ordered_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_06aac8be66e31ad8f23c2a20de5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_beed2b2b78b0f101b565deaa99" ON "historical_order"  ("sales_rep_id", "ordered_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_44c867f590e8550df4467eeee9" ON "historical_order"  ("customer_id", "ordered_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "wine" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying NOT NULL, "producer" character varying NOT NULL, "vintage" integer, "format" character varying NOT NULL, "sku" character varying NOT NULL, "available" integer NOT NULL, CONSTRAINT "UQ_f63a43e334e18a9a6082f0f4a51" UNIQUE ("sku"), CONSTRAINT "CHK_wine_available_non_negative" CHECK ("available" >= 0), CONSTRAINT "PK_37fafeb69e78f7c842d28cf5005" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "historical_order_item" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "order_id" uuid NOT NULL, "wine_id" uuid NOT NULL, "quantity" integer NOT NULL, CONSTRAINT "CHK_historical_order_item_quantity_positive" CHECK ("quantity" > 0), CONSTRAINT "PK_7ffdad99901fbe513cfbf2c5435" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_67416a6d254c7af3e601f67bb3" ON "historical_order_item"  ("order_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_46213796b96262951641c77d21" ON "historical_order_item"  ("wine_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inventory_policy" AS ENUM('strict', 'flexible')`,
    );
    await queryRunner.query(
      `CREATE TABLE "order_request" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "idempotency_key" uuid NOT NULL, "request_hash" text NOT NULL, "customer_id" uuid NOT NULL, "sales_rep_id" uuid NOT NULL, "contact_name" character varying NOT NULL, "phone" character varying NOT NULL, "notes" text NOT NULL DEFAULT '', "inventory_policy" "public"."inventory_policy" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_8018e06aeddd0dc97a2c7168145" UNIQUE ("idempotency_key"), CONSTRAINT "PK_787e7fd11e2728d4b2de2c94e80" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d2eb7934039a0a98083315df80" ON "order_request"  ("sales_rep_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cfa9bd82c4c885ab43f4c6ed9b" ON "order_request"  ("customer_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "order_request_item" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "request_id" uuid NOT NULL, "wine_id" uuid NOT NULL, "quantity" integer NOT NULL, "available_at_save" integer NOT NULL, CONSTRAINT "CHK_order_request_item_quantity_positive" CHECK ("quantity" > 0), CONSTRAINT "PK_c6158151473e1d060775c49d729" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0a80262b44aeef8607c5c1f312" ON "order_request_item"  ("wine_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d38659790f19fe93e8c3b3f9e3" ON "order_request_item"  ("request_id", "wine_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "historical_order" ADD CONSTRAINT "FK_8fb27f9f75e005084c53f77cf88" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "historical_order" ADD CONSTRAINT "FK_522e27ed7c4311f53dc0f685855" FOREIGN KEY ("sales_rep_id") REFERENCES "sales_rep"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "historical_order_item" ADD CONSTRAINT "FK_67416a6d254c7af3e601f67bb38" FOREIGN KEY ("order_id") REFERENCES "historical_order"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "historical_order_item" ADD CONSTRAINT "FK_46213796b96262951641c77d21a" FOREIGN KEY ("wine_id") REFERENCES "wine"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_request" ADD CONSTRAINT "FK_5083d8a820102614ff9d0f1352c" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_request" ADD CONSTRAINT "FK_a41d34b1c08327918a48f4acada" FOREIGN KEY ("sales_rep_id") REFERENCES "sales_rep"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_request_item" ADD CONSTRAINT "FK_f3eda494c111e8a66d6ba584f46" FOREIGN KEY ("request_id") REFERENCES "order_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_request_item" ADD CONSTRAINT "FK_0a80262b44aeef8607c5c1f3127" FOREIGN KEY ("wine_id") REFERENCES "wine"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_request_item" DROP CONSTRAINT "FK_0a80262b44aeef8607c5c1f3127"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_request_item" DROP CONSTRAINT "FK_f3eda494c111e8a66d6ba584f46"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_request" DROP CONSTRAINT "FK_a41d34b1c08327918a48f4acada"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_request" DROP CONSTRAINT "FK_5083d8a820102614ff9d0f1352c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "historical_order_item" DROP CONSTRAINT "FK_46213796b96262951641c77d21a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "historical_order_item" DROP CONSTRAINT "FK_67416a6d254c7af3e601f67bb38"`,
    );
    await queryRunner.query(
      `ALTER TABLE "historical_order" DROP CONSTRAINT "FK_522e27ed7c4311f53dc0f685855"`,
    );
    await queryRunner.query(
      `ALTER TABLE "historical_order" DROP CONSTRAINT "FK_8fb27f9f75e005084c53f77cf88"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d38659790f19fe93e8c3b3f9e3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0a80262b44aeef8607c5c1f312"`,
    );
    await queryRunner.query(`DROP TABLE "order_request_item"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cfa9bd82c4c885ab43f4c6ed9b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d2eb7934039a0a98083315df80"`,
    );
    await queryRunner.query(`DROP TABLE "order_request"`);
    await queryRunner.query(`DROP TYPE "public"."inventory_policy"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_46213796b96262951641c77d21"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_67416a6d254c7af3e601f67bb3"`,
    );
    await queryRunner.query(`DROP TABLE "historical_order_item"`);
    await queryRunner.query(`DROP TABLE "wine"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_44c867f590e8550df4467eeee9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_beed2b2b78b0f101b565deaa99"`,
    );
    await queryRunner.query(`DROP TABLE "historical_order"`);
    await queryRunner.query(`DROP TABLE "sales_rep"`);
    await queryRunner.query(`DROP TABLE "customer"`);
  }
}
