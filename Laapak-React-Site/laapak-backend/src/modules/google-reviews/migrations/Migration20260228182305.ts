import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260228182305 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "google_review_cache" ("id" text not null, "reviews" jsonb not null, "rating" real not null, "user_ratings_total" integer not null, "last_synced_at" timestamptz not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "google_review_cache_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_google_review_cache_deleted_at" ON "google_review_cache" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "google_review_cache" cascade;`);
  }

}
