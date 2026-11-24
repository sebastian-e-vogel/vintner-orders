import type { MigrationInterface, QueryRunner } from 'typeorm';

// Existing rows get region 'Unknown'. format is parsed into millilitres ("750 ml",
// "1.5 L", "75cl"); any value that does not parse aborts the migration.
export class WineRegionAndSizeMl1795044389162 implements MigrationInterface {
  name = 'WineRegionAndSizeMl1795044389162';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wine" ADD "region" character varying`,
    );
    await queryRunner.query(
      `UPDATE "wine" SET "region" = 'Unknown' WHERE "region" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "wine" ALTER COLUMN "region" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "wine" ADD "size_ml" integer`);
    await queryRunner.query(
      `UPDATE "wine" SET "size_ml" = round(
         substring(lower(trim("format")) from '^[0-9]+(?:\\.[0-9]+)?')::numeric
         * CASE substring(lower(trim("format")) from '[a-z]+$')
             WHEN 'ml' THEN 1 WHEN 'cl' THEN 10 ELSE 1000 END
       )::integer
       WHERE lower(trim("format")) ~ '^[0-9]+(\\.[0-9]+)?\\s*(ml|cl|l)$'`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
         IF EXISTS (SELECT 1 FROM "wine" WHERE "size_ml" IS NULL OR "size_ml" <= 0) THEN
           RAISE EXCEPTION 'wine.format cannot be converted to size_ml for: %',
             (SELECT string_agg(DISTINCT "format", ', ') FROM "wine" WHERE "size_ml" IS NULL OR "size_ml" <= 0);
         END IF;
       END $$`,
    );
    await queryRunner.query(
      `ALTER TABLE "wine" ALTER COLUMN "size_ml" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "wine" ADD CONSTRAINT "CHK_wine_size_ml_positive" CHECK ("size_ml" > 0)`,
    );
    await queryRunner.query(`ALTER TABLE "wine" DROP COLUMN "format"`);
  }

  // The region is not restored: format has no place to keep it.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wine" ADD "format" character varying`,
    );
    await queryRunner.query(
      `UPDATE "wine" SET "format" = CASE
         WHEN "size_ml" % 1000 = 0 THEN ("size_ml" / 1000) || ' L'
         WHEN "size_ml" >= 1000 AND "size_ml" % 100 = 0 THEN to_char("size_ml" / 1000.0, 'FM0.0') || ' L'
         ELSE "size_ml" || ' ml' END`,
    );
    await queryRunner.query(
      `ALTER TABLE "wine" ALTER COLUMN "format" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "wine" DROP CONSTRAINT "CHK_wine_size_ml_positive"`,
    );
    await queryRunner.query(`ALTER TABLE "wine" DROP COLUMN "size_ml"`);
    await queryRunner.query(`ALTER TABLE "wine" DROP COLUMN "region"`);
  }
}
