import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSubscriptionTables1775940030465 implements MigrationInterface {
    name = 'CreateSubscriptionTables1775940030465'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "linkedin_username" character varying NOT NULL, "auto_comment" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_b0614ca3997fe1ad6393d69396d" UNIQUE ("user_id", "linkedin_username"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."comment_suggestions_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'AUTO_POSTED')`);
        await queryRunner.query(`CREATE TABLE "comment_suggestions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "linkedin_post_id" character varying NOT NULL, "linkedin_username" character varying NOT NULL, "post_description" text NOT NULL, "suggested_comment" text NOT NULL, "status" "public"."comment_suggestions_status_enum" NOT NULL DEFAULT 'PENDING', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c4c8cc3f35218052cfe3572649a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment_suggestions" ADD CONSTRAINT "FK_1f683125634f3028a5948302f3f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment_suggestions" DROP CONSTRAINT "FK_1f683125634f3028a5948302f3f"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1"`);
        await queryRunner.query(`DROP TABLE "comment_suggestions"`);
        await queryRunner.query(`DROP TYPE "public"."comment_suggestions_status_enum"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
    }

}
