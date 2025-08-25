// app/admin/users/[userId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import logger from '@/lib/logger/logger';

const api = {
  getUserById: async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      const data = await response.json();
      return data.user;
    } catch (error) {
      logger.error('Error fetching user:'+ error);
      throw error;
    }
  },
  
  updateUser: async (userId: number, userData: Partial<User>) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      const data = await response.json();
      return data.user;
    } catch (error) {
      logger.error('Error updating user:'+ error);
      throw error;
    }
  },
  
  getAllCourses: async () => {
    try {
      const response = await fetch('/api/admin/courses');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      return data.courses;
    } catch (error) {
      logger.error('Error fetching courses:'+ error);
      throw error;
    }
  },
  
  getUserPurchases: async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/purchases`);
      if (!response.ok) {
        throw new Error('Failed to fetch user purchases');
      }
      const data = await response.json();
      return data.purchases;
    } catch (error) {
      logger.error('Error fetching user purchases:'+ error);
      throw error;
    }
  },
  
  addCoursePurchase: async (userId: number, courseId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });
      if (!response.ok) {
        throw new Error('Failed to add course purchase');
      }
      const data = await response.json();
      return data.purchase;
    } catch (error) {
      logger.error('Error adding course purchase:'+ error);
      throw error;
    }
  },
  
  removeCoursePurchase: async (userId: number, courseId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/purchases/${courseId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to remove course purchase');
      }
      return true;
    } catch (error) {
      logger.error('Error removing course purchase:'+ error);
      throw error;
    }
  },

  getUserProgress: async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/progress`);
      if (!response.ok) {
        throw new Error('Failed to fetch user progress');
      }
      const data = await response.json();
      return data.progress;
    } catch (error) {
      logger.error('Error fetching user progress:'+ error);
      throw error;
    }
  }
};

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Course {
  id: number;
  title: string;
  description?: string;
  price?: number;
  published?: string;
  imageUrl?: string;
}

interface Purchase {
  id: number;
  userId: number;
  courseId: number;
  course: Course;
  createdAt: string;
  amount: number;
  status: string;
}

interface Progress {
  courseId: number;
  courseTitle: string;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
  lastActivity: string;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.userId as string);

  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userPurchases, setUserPurchases] = useState<Purchase[]>([]);
  const [userProgress, setUserProgress] = useState<Progress[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [userData, coursesData, purchasesData, progressData] = await Promise.all([
        api.getUserById(userId),
        api.getAllCourses(),
        api.getUserPurchases(userId),
        api.getUserProgress(userId).catch(() => []) // Progress est optionnel
      ]);
      
      setUser(userData);
      setEditForm(userData);
      setCourses(coursesData);
      setUserPurchases(purchasesData);
      setUserProgress(progressData);
      
      // Calculer les cours disponibles
      const purchasedCourseIds = purchasesData.map((p: Purchase) => p.courseId);
      const available = coursesData.filter((course: Course) => 
        !purchasedCourseIds.includes(course.id) && course.published
      );
      setAvailableCourses(available);
      
    } catch (error) {
      setError('Erreur lors du chargement des données utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!user) return;
    
    setActionLoading(true);
    setError(null);
    
    try {
      const updatedUser = await api.updateUser(user.id, editForm);
      setUser(updatedUser);
      setIsEditing(false);
      setSuccess('Utilisateur modifié avec succès');
    } catch (error) {
      setError('Erreur lors de la modification de l\'utilisateur');
    } finally {
      setActionLoading(false);
    }
  }
}