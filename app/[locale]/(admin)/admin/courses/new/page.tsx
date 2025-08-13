'use client';
import React, { useState } from 'react';
import CourseForm from '@/app/[locale]/components/admin/courses/courseForm';

export default function NewCoursePage() {

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Course Administration
      </h1>

        <div className="mt-8">
          <CourseForm></CourseForm>
        </div>
    </section>
  );
}
