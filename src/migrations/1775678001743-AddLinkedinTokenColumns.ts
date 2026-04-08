import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLinkedinTokenColumns1775678001743 implements MigrationInterface {
    name = 'AddLinkedinTokenColumns1775678001743'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "linkedin_refresh_token"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "linkedin_image_urn"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "alt_text"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "image_url"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "password" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "oficial_token" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "unofficial_token" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "linkedin_email" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "linkedin_password" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "token_version" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "token_version"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "linkedin_password"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "linkedin_email"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "unofficial_token"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "oficial_token"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "image_url" character varying`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "alt_text" character varying`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "linkedin_image_urn" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "linkedin_refresh_token" character varying`);
    }

}
