'use client';
import React, { useState } from 'react';
import CoursesList from '@/components/admin/courses/coursesList';

export default function AdminPage() {

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Course Administration
      </h1>

        <div className="mt-8">
          <CoursesList></CoursesList>
        </div>
    </section>
  );
}
