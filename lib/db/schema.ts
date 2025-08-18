import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  decimal,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Tables existantes (avec quelques modifications)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('student'), // Changé de 'member' à 'student'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
  isVerified: boolean('is_verified').default(false),
});



export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});


// LMS ENTITIES - Tables mises à jour et enrichies

export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  price: integer('price').notNull().default(0), // en centimes
  stripePriceId: varchar('stripe_price_id', { length: 255 }), // ID du prix Stripe
  published: timestamp('published_at'),
  imageUrl: varchar('image_url', { length: 2048 }),
  difficultyLevel: varchar('difficulty_level', { length: 20 }).default('beginner'), // beginner, intermediate, advanced
  estimatedDuration: integer('estimated_duration'), // durée estimée en minutes
  authorId: integer('author_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Nouvelle table pour les chapitres de cours
export const courseChapters = pgTable('course_chapters', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  position: integer('position').notNull(),
  published: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueCoursePosition: unique().on(table.courseId, table.position),
}));

// Table lessons mise à jour
export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  chapterId: integer('chapter_id')
    .notNull()
    .references(() => courseChapters.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  content: text('content'), // HTML / Markdown / RichText
  videoUrl: varchar('video_url', { length: 2048 }),
  position: integer('position').notNull().default(0),
  duration: integer('duration'), // durée en secondes
  published: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueChapterPosition: unique().on(table.chapterId, table.position),
}));

// Nouvelle table pour les ressources attachées aux leçons
export const lessonAttachments = pgTable('lesson_attachments', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  filename: varchar('filename', { length: 255 }).notNull(),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(),
  fileSize: integer('file_size'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Table enrollments renommée en coursePurchases avec plus d'infos
export const coursePurchases = pgTable('course_purchases', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull().default(0), // Prix en centimes
  status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending', 'completed', 'failed'
  paymentMethod: varchar('payment_method', { length: 50 }), // 'stripe', 'free'
  stripeSessionId: varchar('stripe_session_id', { length: 255 }),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  currency: varchar('currency', { length: 3 }).default('EUR'),
  purchasedAt: timestamp('purchased_at').notNull().defaultNow(),
}, (table) => ({
  uniqueUserCourse: unique().on(table.userId, table.courseId),
}));

// Table progress mise à jour
export const studentProgress = pgTable('student_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  courseId: integer('course_id').notNull().references(() => courses.id),
  lessonId: integer('lesson_id').notNull().references(() => lessons.id),
  completed: boolean('completed').default(false),
  completedAt: timestamp('completed_at'),
  watchTime: integer('watch_time').default(0), // temps de visionnage en secondes
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueUserLesson: unique().on(table.userId, table.lessonId),
}));

// Table quizzes mise à jour
export const quizzes = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  passingScore: integer('passing_score').notNull().default(70), // score minimum pour réussir (en %)
  maxAttempts: integer('max_attempts').notNull().default(3),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Table questions mise à jour
export const quizQuestions = pgTable('quiz_questions', {
  id: serial('id').primaryKey(),
  quizId: integer('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  questionType: varchar('question_type', { length: 20 }).default('multiple_choice'), // multiple_choice, true_false, open_ended
  points: integer('points').default(1),
  position: integer('position').notNull(),
  explanation: text('explanation'), // explication de la réponse correcte
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Table answers mise à jour
export const quizAnswers = pgTable('quiz_answers', {
  id: serial('id').primaryKey(),
  questionId: integer('question_id').notNull().references(() => quizQuestions.id, { onDelete: 'cascade' }),
  answerText: text('answer_text').notNull(),
  isCorrect: boolean('is_correct').default(false),
  position: integer('position').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Nouvelles tables pour les tentatives de quiz
export const quizAttempts = pgTable('quiz_attempts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  quizId: integer('quiz_id').notNull().references(() => quizzes.id),
  score: integer('score').notNull(), // score obtenu en pourcentage
  passed: boolean('passed').default(false),
  attemptNumber: integer('attempt_number').notNull(),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  uniqueUserQuizAttempt: unique().on(table.userId, table.quizId, table.attemptNumber),
}));

export const quizAttemptAnswers = pgTable('quiz_attempt_answers', {
  id: serial('id').primaryKey(),
  attemptId: integer('attempt_id').notNull().references(() => quizAttempts.id, { onDelete: 'cascade' }),
  questionId: integer('question_id').notNull().references(() => quizQuestions.id),
  selectedAnswerId: integer('selected_answer_id').references(() => quizAnswers.id),
  openAnswer: text('open_answer'), // pour les questions ouvertes
  isCorrect: boolean('is_correct').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// RELATIONS

export const usersRelations = relations(users, ({ many }) => ({
  coursesCreated: many(courses),
  coursePurchases: many(coursePurchases),
  studentProgress: many(studentProgress),
  quizAttempts: many(quizAttempts),
}));


export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// Relations LMS
export const coursesRelations = relations(courses, ({ one, many }) => ({
  author: one(users, {
    fields: [courses.authorId],
    references: [users.id],
  }),
  chapters: many(courseChapters),
  purchases: many(coursePurchases),
  studentProgress: many(studentProgress),
}));

export const courseChaptersRelations = relations(courseChapters, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseChapters.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  chapter: one(courseChapters, {
    fields: [lessons.chapterId],
    references: [courseChapters.id],
  }),
  attachments: many(lessonAttachments),
  quizzes: many(quizzes),
  studentProgress: many(studentProgress),
}));

export const lessonAttachmentsRelations = relations(lessonAttachments, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonAttachments.lessonId],
    references: [lessons.id],
  }),
}));

export const coursePurchasesRelations = relations(coursePurchases, ({ one }) => ({
  user: one(users, {
    fields: [coursePurchases.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [coursePurchases.courseId],
    references: [courses.id],
  }),
}));

export const studentProgressRelations = relations(studentProgress, ({ one }) => ({
  user: one(users, {
    fields: [studentProgress.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [studentProgress.courseId],
    references: [courses.id],
  }),
  lesson: one(lessons, {
    fields: [studentProgress.lessonId],
    references: [lessons.id],
  }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [quizzes.lessonId],
    references: [lessons.id],
  }),
  questions: many(quizQuestions),
  attempts: many(quizAttempts),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [quizQuestions.quizId],
    references: [quizzes.id],
  }),
  answers: many(quizAnswers),
  attemptAnswers: many(quizAttemptAnswers),
}));

export const quizAnswersRelations = relations(quizAnswers, ({ one, many }) => ({
  question: one(quizQuestions, {
    fields: [quizAnswers.questionId],
    references: [quizQuestions.id],
  }),
  attemptAnswers: many(quizAttemptAnswers),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one, many }) => ({
  user: one(users, {
    fields: [quizAttempts.userId],
    references: [users.id],
  }),
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
  answers: many(quizAttemptAnswers),
}));

export const quizAttemptAnswersRelations = relations(quizAttemptAnswers, ({ one }) => ({
  attempt: one(quizAttempts, {
    fields: [quizAttemptAnswers.attemptId],
    references: [quizAttempts.id],
  }),
  question: one(quizQuestions, {
    fields: [quizAttemptAnswers.questionId],
    references: [quizQuestions.id],
  }),
  selectedAnswer: one(quizAnswers, {
    fields: [quizAttemptAnswers.selectedAnswerId],
    references: [quizAnswers.id],
  }),
}));

// TYPES
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;

// Types LMS
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type CourseChapter = typeof courseChapters.$inferSelect;
export type NewCourseChapter = typeof courseChapters.$inferInsert;
export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
export type LessonAttachment = typeof lessonAttachments.$inferSelect;
export type NewLessonAttachment = typeof lessonAttachments.$inferInsert;
export type CoursePurchase = typeof coursePurchases.$inferSelect;
export type NewCoursePurchase = typeof coursePurchases.$inferInsert;
export type StudentProgress = typeof studentProgress.$inferSelect;
export type NewStudentProgress = typeof studentProgress.$inferInsert;
export type Quiz = typeof quizzes.$inferSelect;
export type NewQuiz = typeof quizzes.$inferInsert;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type NewQuizQuestion = typeof quizQuestions.$inferInsert;
export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type NewQuizAnswer = typeof quizAnswers.$inferInsert;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type NewQuizAttempt = typeof quizAttempts.$inferInsert;
export type QuizAttemptAnswer = typeof quizAttemptAnswers.$inferSelect;
export type NewQuizAttemptAnswer = typeof quizAttemptAnswers.$inferInsert;

// Types composés
export type CourseWithDetails = Course & {
  author: Pick<User, 'id' | 'name' | 'email'>;
  chapters: (CourseChapter & {
    lessons: (Lesson & {
      quizzes: Quiz[];
      attachments: LessonAttachment[];
    })[];
  })[];
  _count?: {
    purchases: number;
    lessons: number;
  };
};

export type LessonWithDetails = Lesson & {
  chapter: CourseChapter & {
    course: Course;
  };
  quizzes: (Quiz & {
    questions: (QuizQuestion & {
      answers: QuizAnswer[];
    })[];
  })[];
  attachments: LessonAttachment[];
  studentProgress?: StudentProgress;
};

// Enums
export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  // Nouveaux types d'activité LMS
  CREATE_COURSE = 'CREATE_COURSE',
  PUBLISH_COURSE = 'PUBLISH_COURSE',
  PURCHASE_COURSE = 'PURCHASE_COURSE',
  COMPLETE_LESSON = 'COMPLETE_LESSON',
  COMPLETE_QUIZ = 'COMPLETE_QUIZ',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
}

export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin',
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  OPEN_ENDED = 'open_ended',
}