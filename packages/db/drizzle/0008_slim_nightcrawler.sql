CREATE TABLE "affiliate_clicks" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"code" varchar(40) NOT NULL,
	"user_id" varchar(60),
	"ip_hash" varchar(64) NOT NULL,
	"ua_hash" varchar(64) NOT NULL,
	"source" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"converted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "affiliate_conversion_events" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"conversion_id" varchar(60) NOT NULL,
	"actor_email" varchar(200),
	"action" varchar(40) NOT NULL,
	"from_status" varchar(20),
	"to_status" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_conversions" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"click_id" varchar(60) NOT NULL,
	"order_id" varchar(60) NOT NULL,
	"user_id" varchar(60),
	"code" varchar(40) NOT NULL,
	"commission_cents" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	CONSTRAINT "uq_affiliate_order_id" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "affiliate_profiles" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"user_id" varchar(60) NOT NULL,
	"code" varchar(40) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_affiliate_user_id" UNIQUE("user_id"),
	CONSTRAINT "uq_affiliate_code" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(200) NOT NULL,
	"subject" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"phone" varchar(50),
	"ip" varchar(45) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"user_id" varchar(60),
	"product_id" varchar(60) NOT NULL,
	"rating" integer NOT NULL,
	"title" varchar(200),
	"content" text,
	"status" varchar(20) DEFAULT 'Pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "affiliate_code" varchar(20);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "affiliate_click_id" varchar(60);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "affiliate_commission_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "affiliate_status" varchar(16) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "affiliate_attributed_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_affiliate_clicks_code" ON "affiliate_clicks" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_affiliate_clicks_created_at" ON "affiliate_clicks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_affiliate_clicks_converted_at" ON "affiliate_clicks" USING btree ("converted_at");--> statement-breakpoint
CREATE INDEX "idx_conv_events_conversion_id" ON "affiliate_conversion_events" USING btree ("conversion_id");--> statement-breakpoint
CREATE INDEX "idx_conv_events_created_at" ON "affiliate_conversion_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_affiliate_conversions_code" ON "affiliate_conversions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_affiliate_conversions_status" ON "affiliate_conversions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_affiliate_conversions_created_at" ON "affiliate_conversions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_affiliate_created_at" ON "affiliate_profiles" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_contacts_email" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_contacts_created_at" ON "contacts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_reviews_product" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_user" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_status" ON "reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reviews_created_at" ON "reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_affiliate_code" ON "orders" USING btree ("affiliate_code");--> statement-breakpoint
CREATE INDEX "idx_orders_affiliate_status" ON "orders" USING btree ("affiliate_status");