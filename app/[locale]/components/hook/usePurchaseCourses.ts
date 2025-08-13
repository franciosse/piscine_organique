// hooks/usePurchasedCourses.ts
'use client';

import { useState, useEffect } from 'react';

export function usePurchasedCourses() {
  const [purchasedCourses, setPurchasedCourses] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchasedCourses();
  }, []);

  const fetchPurchasedCourses = async () => {
    try {
      const response = await fetch('/api/user/purchased-courses');
      if (response.ok) {
        const data = await response.json();
        setPurchasedCourses(new Set(data.courseIds));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des cours achetés:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPurchased = (courseId: number) => purchasedCourses.has(courseId);

  const addPurchasedCourse = (courseId: number) => {
    setPurchasedCourses(prev => new Set([...prev, courseId]));
  };

  return {
    isPurchased,
    addPurchasedCourse,
    loading,
    refresh: fetchPurchasedCourses,
  };
}