ALTER TABLE "products" ADD COLUMN "media" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "kind" varchar(20);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "shipping_required" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "weight_grams" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "digital_version" varchar(50);