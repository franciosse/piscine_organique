'use client';
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import ChapterForm from '@/app/[locale]/components/admin/courses/chapterForm';

export default function CoursePage() {
  const { courseId } = useParams(); 
  const course = Number(courseId);
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Course Administration
      </h1>

        <div className="mt-8">
          <ChapterForm courseId={course}></ChapterForm>
        </div>
    </section>
  );
}
