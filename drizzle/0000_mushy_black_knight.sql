CREATE TABLE "urltable" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"long_url" text,
	"short_url" text,
	"click_count" integer DEFAULT 0,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(10) NOT NULL,
	"password" text NOT NULL,
	"refresh_token" text,
	"name" varchar(50) NOT NULL,
	"address" varchar(200) NOT NULL,
	"email" varchar(50) NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "urltable" ADD CONSTRAINT "urltable_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;