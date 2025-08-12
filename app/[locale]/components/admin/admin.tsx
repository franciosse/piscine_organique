import React, { useState, useEffect } from 'react';

const api = {
  getCourses: async () => await fetch('/api/admin/courses').then(res => res.json()),
  getChapters: async (courseId: number) => await fetch(`/api/admin/courses/${courseId}/chapters`).then(res => res.json()),
  getLessons: async (chapterId: number) => await fetch(`/api/admin/chapters/${chapterId}/lessons`).then(res => res.json()),
  createCourse: async (title: string) => ({ id: Date.now(), title }),
  createChapter: async (courseId: number, title: string) => ({ id: Date.now(), title, courseId }),
  createLesson: async (chapterId: number, title: string) => ({ id: Date.now(), title, chapterId }),
};

interface AdminCoursesProps {
  onSelectCourse: (id: number) => void;
}

interface Course {
  id: number;
  title: string;}

interface Chapter {
  id: number;
  title: string;
  courseId: number;
}

interface Lesson {
  id: number;
  title: string;
  chapterId: number;
}

export function AdminCourses({ onSelectCourse }: AdminCoursesProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourseTitle, setNewCourseTitle] = useState('');

  useEffect(() => {
    api.getCourses().then(data => setCourses(data.courses || data)); // selon ton API
  }, []);

  const addCourse = async () => {
    if (!newCourseTitle.trim()) return;
    const newCourse = await api.createCourse(newCourseTitle);
    setCourses((prev) => [...prev, newCourse]);
    setNewCourseTitle('');
  };

  return (
    <div>
      <h1>Administration des Cours</h1>
      <ul>
        {courses.map(course => (
          <li key={course.id}>
            <button onClick={() => onSelectCourse(course.id)}>{course.title}</button>
          </li>
        ))}
      </ul>
      <input
        type="text"
        placeholder="Nouveau cours"
        value={newCourseTitle}
        onChange={(e) => setNewCourseTitle(e.target.value)}
      />
      <button onClick={addCourse}>Ajouter un cours</button>
    </div>
  );
}

interface AdminChaptersProps {
  courseId: number;
  onBack: () => void;
  onSelectChapter: (id: number) => void;
}

export function AdminChapters({ courseId, onBack, onSelectChapter }: AdminChaptersProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  useEffect(() => {
    api.getChapters(courseId).then(data => setChapters(data.chapters || data));
  }, [courseId]);

  const addChapter = async () => {
    if (!newChapterTitle.trim()) return;
    const newChapter = await api.createChapter(courseId, newChapterTitle);
    setChapters((prev) => [...prev, newChapter]);
    setNewChapterTitle('');
  };

  return (
    <div>
      <button onClick={onBack}>← Retour aux cours</button>
      <h2>Chapitres du cours #{courseId}</h2>
      <ul>
        {chapters.map((ch) => (
          <li key={ch.id}>
            <button onClick={() => onSelectChapter(ch.id)}>{ch.title}</button>
          </li>
        ))}
      </ul>
      <input
        type="text"
        placeholder="Nouveau chapitre"
        value={newChapterTitle}
        onChange={(e) => setNewChapterTitle(e.target.value)}
      />
      <button onClick={addChapter}>Ajouter un chapitre</button>
    </div>
  );
}

interface AdminLessonsProps {
  chapterId: number;
  onBack: () => void;
}

export function AdminLessons({ chapterId, onBack }: AdminLessonsProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [newLessonTitle, setNewLessonTitle] = useState('');

  useEffect(() => {
    api.getLessons(chapterId).then(data => setLessons(data.lessons || data));
  }, [chapterId]);

  const addLesson = async () => {
    if (!newLessonTitle.trim()) return;
    const newLesson = await api.createLesson(chapterId, newLessonTitle);
    setLessons((prev) => [...prev, newLesson]);
    setNewLessonTitle('');
  };

  return (
    <div>
      <button onClick={onBack}>← Retour aux chapitres</button>
      <h3>Leçons du chapitre #{chapterId}</h3>
      <ul>
        {lessons.map((l) => (
          <li key={l.id}>{l.title}</li>
        ))}
      </ul>
      <input
        type="text"
        placeholder="Nouvelle leçon"
        value={newLessonTitle}
        onChange={(e) => setNewLessonTitle(e.target.value)}
      />
      <button onClick={addLesson}>Ajouter une leçon</button>
    </div>
  );
}
