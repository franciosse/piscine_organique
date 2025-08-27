// app/[locale]/admin/courses/[courseId]/chapters/[chapterId]/lessons/[lessonId]/edit/page.tsx
'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import LessonEditor from '@/components/admin/courses/lessonEditor';

export default function CoursePage() {
  const { lessonId, chapterId } = useParams(); 
  const lesson = Number(lessonId);
  const chapter = Number(chapterId);
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Edition d&apos;une leçon
      </h1>

        <div className="mt-8">
          <LessonEditor lessonId={lesson} chapterId={chapter}></LessonEditor>
        </div>
    </section>
  );
}
