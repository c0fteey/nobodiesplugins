ALTER TABLE "license" ADD COLUMN "last_server" text;--> statement-breakpoint
ALTER TABLE "license" ADD COLUMN "last_ip" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "requires_license" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Plugins keep needing a license, as before
UPDATE "product" SET "requires_license" = true WHERE "type" = 'plugin';
