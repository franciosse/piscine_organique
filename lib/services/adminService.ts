// lib/services/adminService.ts
import logger from '@/lib/logger/logger';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  price?: number;
  published?: string;
  imageUrl?: string;
}

export interface Purchase {
  id: number;
  userId: number;
  courseId: number;
  course: Course;
  createdAt: string;
  amount: number;
  status: string;
}

export interface Progress {
  courseId: number;
  courseTitle: string;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
  lastActivity: string;
}

export const adminService = {
  async getUserById(userId: number): Promise<User> {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      const data = await response.json();
      return data.user;
    } catch (error) {
      logger.error('Error fetching user:', error);
      throw error;
    }
  },
  
  async updateUser(userId: number, userData: Partial<User>): Promise<User> {
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
      logger.error('Error updating user:', error);
      throw error;
    }
  },
  
  async getAllCourses(): Promise<Course[]> {
    try {
      const response = await fetch('/api/admin/courses');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      return data.courses;
    } catch (error) {
      logger.error('Error fetching courses:', error);
      throw error;
    }
  },
  
  async getUserPurchases(userId: number): Promise<Purchase[]> {
    try {
      const response = await fetch(`/api/admin/users/${userId}/purchases`);
      if (!response.ok) {
        throw new Error('Failed to fetch user purchases');
      }
      const data = await response.json();
      return data.purchases;
    } catch (error) {
      logger.error('Error fetching user purchases:', error);
      throw error;
    }
  },
  
  async addCoursePurchase(userId: number, courseId: number): Promise<Purchase> {
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
      logger.error('Error adding course purchase:', error);
      throw error;
    }
  },
  
  async removeCoursePurchase(userId: number, courseId: number): Promise<void> {
    try {
      const response = await fetch(`/api/admin/users/${userId}/purchases/${courseId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to remove course purchase');
      }
    } catch (error) {
      logger.error('Error removing course purchase:', error);
      throw error;
    }
  },

  async getUserProgress(userId: number): Promise<Progress[]> {
    try {
      const response = await fetch(`/api/admin/users/${userId}/progress`);
      if (!response.ok) {
        throw new Error('Failed to fetch user progress');
      }
      const data = await response.json();
      return data.progress;
    } catch (error) {
      logger.error('Error fetching user progress:', error);
      throw error;
    }
  }
};