CREATE TABLE "discord_role_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text,
	"role_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_settings" (
	"id" text PRIMARY KEY DEFAULT 'main' NOT NULL,
	"guild_id" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"auto_join" boolean DEFAULT true NOT NULL,
	"remove_roles" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_sync_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"ok" boolean NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "discord_username" text;--> statement-breakpoint
ALTER TABLE "discord_role_rule" ADD CONSTRAINT "discord_role_rule_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_sync_log" ADD CONSTRAINT "discord_sync_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "discord_rule_product_idx" ON "discord_role_rule" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "discord_log_created_idx" ON "discord_sync_log" USING btree ("created_at");