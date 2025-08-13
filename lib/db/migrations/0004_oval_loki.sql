ALTER TABLE "course_purchases" DROP CONSTRAINT "course_purchases_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "course_purchases" DROP CONSTRAINT "course_purchases_course_id_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "course_purchases" ALTER COLUMN "amount" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "quizzes" ALTER COLUMN "max_attempts" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "course_purchases" ADD COLUMN "status" varchar(50) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "course_purchases" ADD COLUMN "payment_method" varchar(50);--> statement-breakpoint
ALTER TABLE "course_purchases" ADD COLUMN "stripe_session_id" varchar(255);--> statement-breakpoint
ALTER TABLE "course_purchases" ADD CONSTRAINT "course_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_purchases" ADD CONSTRAINT "course_purchases_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;