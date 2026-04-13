CREATE TYPE "public"."provider" AS ENUM('local', 'google');--> statement-breakpoint
CREATE TABLE "urltable" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"long_url" text,
	"short_url" text,
	"click_count" integer DEFAULT 0,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "urltable_short_url_unique" UNIQUE("short_url")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"name" varchar(50) NOT NULL,
	"address" varchar(200),
	"email" varchar(50) NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(10) NOT NULL,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"refresh_token" text,
	"forgot_password_token" text,
	"forgot_password_token_expiry" timestamp with time zone,
	"google_id" text,
	"provider" "provider" DEFAULT 'local' NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
ALTER TABLE "urltable" ADD CONSTRAINT "urltable_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;