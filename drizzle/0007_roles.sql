CREATE TABLE "role" (
	"key" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#a1a1aa' NOT NULL,
	"system" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Built-in roles first, so every existing user.role value has a row to point at
INSERT INTO "role" ("key", "name", "color", "system", "sort_order") VALUES
	('user', 'Kullanıcı', '#a1a1aa', true, 0),
	('customer', 'Müşteri', '#22c55e', false, 10),
	('premium-customer', 'Premium Müşteri', '#f59e0b', false, 20),
	('admin', 'Yönetici', '#8b6dff', true, 100);
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE text USING "role"::text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user';--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_role_role_key_fk" FOREIGN KEY ("role") REFERENCES "public"."role"("key") ON DELETE set default ON UPDATE cascade;--> statement-breakpoint
DROP TYPE "public"."user_role";
