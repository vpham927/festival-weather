ALTER TABLE "festivals" ADD COLUMN "category" text DEFAULT 'other' NOT NULL;--> statement-breakpoint
CREATE INDEX "festivals_category_idx" ON "festivals" USING btree ("category");