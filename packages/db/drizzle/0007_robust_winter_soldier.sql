CREATE TABLE "wishlist_items" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"wishlist_id" varchar(60) NOT NULL,
	"product_id" varchar(60) NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_wishlist_product" UNIQUE("wishlist_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "wishlists" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"user_id" varchar(60),
	"guest_id" varchar(80),
	"name" varchar(120) DEFAULT 'My Wishlist' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_wishlist_owner" UNIQUE("user_id","guest_id")
);
--> statement-breakpoint
CREATE INDEX "idx_wishlist_items_wishlist_id" ON "wishlist_items" USING btree ("wishlist_id");--> statement-breakpoint
CREATE INDEX "idx_wishlist_items_product_id" ON "wishlist_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_wishlists_created_at" ON "wishlists" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_wishlists_user_id" ON "wishlists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_wishlists_guest_id" ON "wishlists" USING btree ("guest_id");