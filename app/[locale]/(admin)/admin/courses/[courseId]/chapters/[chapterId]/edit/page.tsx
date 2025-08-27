'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import ChapterEditor from '@/components/admin/courses/chapterEditor';

export default function CoursePage() {
  const { courseId, chapterId } = useParams(); 
  const chapter = Number(chapterId);
  const course= Number(courseId);
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Edition du chapitre
      </h1>

        <div className="mt-8">
          <ChapterEditor courseId={course} chapterId={chapter}></ChapterEditor>
        </div>
    </section>
  );
}
