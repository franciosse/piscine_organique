ALTER TABLE "users" ADD COLUMN "created_via_stripe" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "needs_password_reset" boolean DEFAULT false;