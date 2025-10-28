ALTER TABLE "orders" ADD COLUMN "status" varchar(20) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");