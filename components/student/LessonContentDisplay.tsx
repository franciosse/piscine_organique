// components/student/LessonContentDisplay.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sprout } from 'lucide-react';
import { useSanitizedHTML } from '@/lib/security/sanitizer';

interface LessonWithQuiz {
  id: number;
  title: string;
  duration: number | null;
  videoUrl: string | null;
  position: number;
  content: string | null;
  isCompleted?: boolean;
  quiz?: {
    id: number;
    title: string;
    questions: any[];
    isCompleted?: boolean;
    passingScore: number;
  };
}

interface LessonContentDisplayProps {
  lesson: LessonWithQuiz;
}

export function LessonContentDisplay({ lesson }: LessonContentDisplayProps) {
  const content = lesson.content;
  const sanitizedPreview = useSanitizedHTML(content!, 'LESSON_CONTENT');

  if (!content) {
    return (
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden mt-6">
        <CardContent className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <div className="text-amber-600 mb-2">📝</div>
            <p className="text-amber-800 font-medium">Contenu en préparation</p>
            <p className="text-amber-700 text-sm mt-1">
              Le contenu écrit de cette leçon sera bientôt disponible.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden mt-6">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
        <CardTitle className="flex items-center gap-2 text-emerald-800">
          <Sprout className="h-5 w-5" />
          Contenu de la leçon
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="prose prose-lg max-w-none prose-emerald">
          <div 
            className="whitespace-pre-wrap text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizedPreview }}
          />
        </div>
      </CardContent>
    </Card>
  );
}