CREATE TABLE IF NOT EXISTS "inventory" (
	"product_id" varchar(40) PRIMARY KEY NOT NULL,
	"stock_qty" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inventory_reservations" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"order_id" varchar(60) NOT NULL,
	"product_id" varchar(40) NOT NULL,
	"qty" integer NOT NULL,
	"status" varchar(20) DEFAULT 'reserved' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Widen order_id column if table already existed with varchar(40)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory_reservations' AND column_name = 'order_id' AND character_maximum_length = 40
  ) THEN
    ALTER TABLE "inventory_reservations" ALTER COLUMN "order_id" TYPE varchar(60);
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inventory_updated_at" ON "inventory" USING btree ("updated_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inv_res_order_id" ON "inventory_reservations" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inv_res_product_id" ON "inventory_reservations" USING btree ("product_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inv_res_status" ON "inventory_reservations" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inv_res_created_at" ON "inventory_reservations" USING btree ("created_at");
