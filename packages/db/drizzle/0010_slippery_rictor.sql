CREATE TABLE "media_events" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"media_id" varchar(40),
	"action" varchar(40) NOT NULL,
	"actor_email" varchar(200),
	"ip" varchar(64),
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"provider" varchar(20) DEFAULT 's3' NOT NULL,
	"bucket" varchar(200),
	"key" varchar(500),
	"url" text NOT NULL,
	"kind" varchar(10) NOT NULL,
	"content_type" varchar(120),
	"bytes" integer,
	"width" integer,
	"height" integer,
	"checksum" varchar(128),
	"uploader_ip" varchar(64),
	"uploader_email" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"extra" jsonb
);
--> statement-breakpoint
CREATE TABLE "product_media" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"product_id" varchar(40) NOT NULL,
	"media_id" varchar(40) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_media_events_media" ON "media_events" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "idx_media_events_action" ON "media_events" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_media_events_created_at" ON "media_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_media_created_at" ON "media" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_media_uploader_ip" ON "media" USING btree ("uploader_ip");--> statement-breakpoint
CREATE INDEX "idx_product_media_product" ON "product_media" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_media_media" ON "product_media" USING btree ("media_id");