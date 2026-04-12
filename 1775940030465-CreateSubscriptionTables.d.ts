import { MigrationInterface, QueryRunner } from "typeorm";
export declare class CreateSubscriptionTables1775940030465 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
