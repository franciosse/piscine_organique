// // app/api/admin/chapters/[chapterId]/lessons/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/lib/db/drizzle'; // Votre instance Drizzle
// import { courseChapters, lessons, users } from '@/lib/db/schema';
// import { eq, and, max } from 'drizzle-orm';
// import { z } from 'zod';
// import { checkAdminPermission } from '../../../checkPermissionsHelper';
// import { getAuthenticatedUser } from '../../../getAuthenticatedUserHelper';

// // --- SCHEMAS ---
// const createLessonSchema = z.object({
//   title: z.string().min(1, 'Le titre est requis'),
//   content: z.string().optional(),
//   videoUrl: z.string().url().optional(),
//   duration: z.number().min(0).optional(),
// });

// const reorderLessonsSchema = z.object({
//   lessons: z.array(z.object({
//     id: z.number(),
//     position: z.number(),
//   })),
// });

// // Typage correct pour Next.js App Router
// interface RouteParams {
//   chapterId: string;
// }

// // --- SLUG GENERATOR ---
// async function generateUniqueSlug(title: string, chapterId: number): Promise<string> {
//   const baseSlug = title
//     .toLowerCase()
//     .normalize('NFD')
//     .replace(/[\u0300-\u036f]/g, '')
//     .replace(/[^a-z0-9\s-]/g, '')
//     .replace(/\s+/g, '-')
//     .replace(/-+/g, '-')
//     .trim();

//   let slug = baseSlug;
//   let counter = 1;

//   while (true) {
//     const existingLesson = await db
//       .select({ id: lessons.id })
//       .from(lessons)
//       .where(and(eq(lessons.slug, slug), eq(lessons.chapterId, chapterId)))
//       .limit(1);

//     if (existingLesson.length === 0) break;

//     slug = `${baseSlug}-${counter}`;
//     counter++;
//   }

//   return slug;
// }

// // --- GET LESSONS ---
// export async function GET(
//   req: NextRequest,
//   { params }: { params: RouteParams }
// ) {
//   try {
//     await getAuthenticatedUser(req);
//     const chapterId = parseInt(params.chapterId, 10);

//     const data = await db
//       .select()
//       .from(lessons)
//       .where(eq(lessons.chapterId, chapterId))
//       .orderBy(lessons.position);

//     return NextResponse.json(data);
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 403 });
//   }
// }

// // --- CREATE LESSON ---
// export async function POST(
//   req: NextRequest,
//   { params }: { params: RouteParams }
// ) {
//   try {
//     await checkAdminPermission(req);
//     const chapterId = parseInt(params.chapterId);
//     const body = await req.json();
//     const parsed = createLessonSchema.parse(body);

//     // Générer un slug unique
//     const slug = await generateUniqueSlug(parsed.title, chapterId);

//     // Trouver la position max pour la nouvelle leçon
//     const maxPosition = await db
//       .select({ maxPos: max(lessons.position) })
//       .from(lessons)
//       .where(eq(lessons.chapterId, chapterId));

//     const newLesson = await db
//       .insert(lessons)
//       .values({
//         chapterId,
//         title: parsed.title,
//         content: parsed.content ?? '',
//         videoUrl: parsed.videoUrl ?? '',
//         duration: parsed.duration ?? 0,
//         slug,
//         position: (maxPosition[0].maxPos ?? 0) + 1,
//       })
//       .returning();

//     return NextResponse.json(newLesson[0]);
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 400 });
//   }
// }

// // --- REORDER LESSONS ---
// export async function PATCH(
//   req: NextRequest,
//   { params }: { params: RouteParams }
// ) {
//   try {
//     await checkAdminPermission(req);
//     const chapterId = parseInt(params.chapterId);
//     const body = await req.json();
//     const parsed = reorderLessonsSchema.parse(body);

//     for (const { id, position } of parsed.lessons) {
//       await db.update(lessons)
//         .set({ position })
//         .where(and(eq(lessons.id, id), eq(lessons.chapterId, chapterId)));
//     }

//     return NextResponse.json({ success: true });
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 400 });
//   }
// }