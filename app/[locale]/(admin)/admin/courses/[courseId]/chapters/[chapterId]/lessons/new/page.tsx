'use client';
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import LessonForm from '@/components/admin/courses/lessonForm';

export default function CoursePage() {
  const { courseId, chapterId } = useParams();
  const chapter = Number(chapterId);
  const course = Number(courseId);
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Nouvelle leçon
      </h1>

        <div className="mt-8">
          <LessonForm courseId={course} chapterId={chapter}></LessonForm>
        </div>
    </section>
  );
}
