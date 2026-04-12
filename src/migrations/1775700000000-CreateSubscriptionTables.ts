import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptionTables1775700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "linkedin_username" varchar NOT NULL,
        "auto_comment" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_subscriptions_user_username" UNIQUE ("user_id", "linkedin_username"),
        CONSTRAINT "FK_subscriptions_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "comment_suggestion_status_enum" AS ENUM (
        'PENDING', 'APPROVED', 'REJECTED', 'AUTO_POSTED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "comment_suggestions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "linkedin_post_id" varchar NOT NULL,
        "linkedin_username" varchar NOT NULL,
        "post_description" text NOT NULL,
        "suggested_comment" text NOT NULL,
        "status" "comment_suggestion_status_enum" NOT NULL DEFAULT 'PENDING',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_comment_suggestions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_comment_suggestions_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "comment_suggestions"`);
    await queryRunner.query(`DROP TYPE "comment_suggestion_status_enum"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
  }
}
