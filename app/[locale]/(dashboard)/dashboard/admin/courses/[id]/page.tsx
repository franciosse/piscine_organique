'use client';
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import CourseEditor from '@/app/[locale]/components/admin/courses/courseEditor';

export default function CoursePage() {
  const { id } = useParams(); 
  const courseId = Number(id);
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Course Administration
      </h1>

        <div className="mt-8">
          <CourseEditor courseId={courseId}></CourseEditor>
        </div>
    </section>
  );
}
