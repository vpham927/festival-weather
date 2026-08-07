ALTER TABLE "festivals" ADD COLUMN "popularity_rank" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "festivals_popularity_rank_idx" ON "festivals" USING btree ("popularity_rank");