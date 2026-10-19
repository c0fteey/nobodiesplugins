ALTER TABLE "discord_role_rule" ADD COLUMN "site_role" text;--> statement-breakpoint
ALTER TABLE "role" ADD COLUMN "min_spend_cents" integer;--> statement-breakpoint
ALTER TABLE "discord_role_rule" ADD CONSTRAINT "discord_role_rule_site_role_role_key_fk" FOREIGN KEY ("site_role") REFERENCES "public"."role"("key") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
-- Default auto roles: first order makes a customer, 50 EUR total makes a premium customer
UPDATE "role" SET "min_spend_cents" = 0 WHERE "key" = 'customer';--> statement-breakpoint
UPDATE "role" SET "min_spend_cents" = 5000 WHERE "key" = 'premium-customer';
