'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import CourseEditor from '@/components/admin/courses/courseEditor';

export default function CoursePage() {
  const { courseId } = useParams(); 
  const course = Number(courseId);
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Edition du cours
      </h1>

        <div className="mt-8">
          <CourseEditor courseId={course}></CourseEditor>
        </div>
    </section>
  );
}
