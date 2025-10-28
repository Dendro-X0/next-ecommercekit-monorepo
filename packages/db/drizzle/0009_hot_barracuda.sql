CREATE TABLE "idempotency_keys" (
	"key" varchar(120) NOT NULL,
	"scope" varchar(120) NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"response_json" text NOT NULL,
	"status" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_idem_key_scope" UNIQUE("key","scope")
);
--> statement-breakpoint
CREATE TABLE "inventory_reservations" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"order_id" varchar(60) NOT NULL,
	"product_id" varchar(40) NOT NULL,
	"qty" integer NOT NULL,
	"status" varchar(20) DEFAULT 'reserved' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"productId" varchar(40) PRIMARY KEY NOT NULL,
	"stock_qty" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_provider" varchar(20);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_ref" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "description" text;--> statement-breakpoint
CREATE INDEX "idx_idem_created_at" ON "idempotency_keys" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_inv_res_order" ON "inventory_reservations" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_inv_res_product" ON "inventory_reservations" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_updated_at" ON "inventory" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_orders_payment_ref" ON "orders" USING btree ("payment_ref");