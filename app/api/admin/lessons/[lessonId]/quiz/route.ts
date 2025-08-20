// app/api/admin/lessons/[lessonId]/quiz/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  lessons, 
  quizzes, 
  quizQuestions, 
  quizAnswers,
  quizAttempts,
  quizAttemptAnswers 
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';

// --- SCHEMAS DE VALIDATION ---
const answerSchema = z.object({
  answerText: z.string().min(1, 'Le texte de la réponse est requis'),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  question: z.string().min(1, 'Le texte de la question est requis'),
  questionType: z.enum(['multiple_choice', 'true_false', 'open_ended']),
  points: z.number().min(1, 'Les points doivent être supérieurs à 0').default(1),
  explanation: z.string().optional(),
  answers: z.array(answerSchema).min(1, 'Au moins une réponse est requise'),
});

const quizSchema = z.object({
  title: z.string().min(1, 'Le titre du quiz est requis'),
  description: z.string().optional(),
  passingScore: z.number().min(0).max(100, 'Le score doit être entre 0 et 100').default(70),
  maxAttempts: z.number().min(1, 'Au moins une tentative doit être autorisée').default(3),
  questions: z.array(questionSchema).min(1, 'Au moins une question est requise'),
});

// --- VALIDATION MÉTIER ---
const validateQuestions = (questions: any[]) => {
  const errors: string[] = [];

  questions.forEach((question, qIndex) => {
    if (question.questionType === 'multiple_choice' || question.questionType === 'true_false') {
      const correctAnswers = question.answers.filter((a: any) => a.isCorrect);
      
      if (correctAnswers.length === 0) {
        errors.push(`Question ${qIndex + 1}: Au moins une réponse correcte est requise`);
      }

      if (question.questionType === 'true_false' && question.answers.length !== 2) {
        errors.push(`Question ${qIndex + 1}: Les questions Vrai/Faux doivent avoir exactement 2 réponses`);
      }

      if (question.questionType === 'multiple_choice' && question.answers.length < 2) {
        errors.push(`Question ${qIndex + 1}: Les questions à choix multiples doivent avoir au moins 2 réponses`);
      }
    }

    // Vérifier les doublons de réponses
    const answerTexts = question.answers.map((a: any) => a.answerText.toLowerCase().trim());
    const duplicates = answerTexts.filter((text: string, index: number) => answerTexts.indexOf(text) !== index);
    if (duplicates.length > 0) {
      errors.push(`Question ${qIndex + 1}: Les réponses ne peuvent pas être identiques`);
    }
  });

  return errors;
};

// Typage pour Next.js App Router
interface RouteParams {
  lessonId: string;
}

// --- GET QUIZ ---
export const GET = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const lessonId = parseInt(resolvedParams.lessonId);

  if (isNaN(lessonId)) {
    return NextResponse.json(
      { error: 'ID de leçon invalide' },
      { status: 400 }
    );
  }

  try {
    // Vérifier que la leçon existe
    const lesson = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (lesson.length === 0) {
      return NextResponse.json(
        { error: 'Leçon introuvable' },
        { status: 404 }
      );
    }

    // Récupérer le quiz avec toutes ses questions et réponses
    const quiz = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.lessonId, lessonId))
      .limit(1);

    if (quiz.length === 0) {
      return NextResponse.json(
        { error: 'Aucun quiz trouvé pour cette leçon' },
        { status: 404 }
      );
    }

    // Récupérer les questions
    const questions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quiz[0].id))
      .orderBy(quizQuestions.position);

    // Récupérer les réponses pour chaque question
    const questionsWithAnswers = await Promise.all(
      questions.map(async (question) => {
        const answers = await db
          .select()
          .from(quizAnswers)
          .where(eq(quizAnswers.questionId, question.id))
          .orderBy(quizAnswers.position);

        return {
          ...question,
          answers,
        };
      })
    );

    const fullQuiz = {
      ...quiz[0],
      questions: questionsWithAnswers,
    };

    return NextResponse.json({
      success: true,
      quiz: fullQuiz,
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération du quiz:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du quiz' },
      { status: 500 }
    );
  }
});

// --- CREATE QUIZ ---
export const POST = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const lessonId = parseInt(resolvedParams.lessonId);

  if (isNaN(lessonId)) {
    return NextResponse.json(
      { error: 'ID de leçon invalide' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsed = quizSchema.parse(body);

    // Validation supplémentaire des questions
    const validationErrors = validateQuestions(parsed.questions);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Erreurs de validation',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Vérifier que la leçon existe
    const lesson = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (lesson.length === 0) {
      return NextResponse.json(
        { error: 'Leçon introuvable' },
        { status: 404 }
      );
    }

    // Vérifier qu'il n'y a pas déjà un quiz pour cette leçon
    const existingQuiz = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.lessonId, lessonId))
      .limit(1);

    if (existingQuiz.length > 0) {
      return NextResponse.json(
        { error: 'Un quiz existe déjà pour cette leçon. Utilisez PATCH pour le modifier.' },
        { status: 409 }
      );
    }

    // Transaction pour créer le quiz complet
    const result = await db.transaction(async (tx) => {
      // 1. Créer le quiz
      const [quiz] = await tx
        .insert(quizzes)
        .values({
          lessonId,
          title: parsed.title,
          description: parsed.description,
          passingScore: parsed.passingScore,
          maxAttempts: parsed.maxAttempts,
        })
        .returning();

      // 2. Créer les questions
      const createdQuestions = [];
      for (let i = 0; i < parsed.questions.length; i++) {
        const question = parsed.questions[i];
        
        const [createdQuestion] = await tx
          .insert(quizQuestions)
          .values({
            quizId: quiz.id,
            question: question.question,
            questionType: question.questionType,
            points: question.points,
            explanation: question.explanation,
            position: i + 1,
          })
          .returning();

        // 3. Créer les réponses pour cette question
        const createdAnswers = [];
        for (let j = 0; j < question.answers.length; j++) {
          const answer = question.answers[j];
          
          const [createdAnswer] = await tx
            .insert(quizAnswers)
            .values({
              questionId: createdQuestion.id,
              answerText: answer.answerText,
              isCorrect: answer.isCorrect,
              position: j + 1,
            })
            .returning();

          createdAnswers.push(createdAnswer);
        }

        createdQuestions.push({
          ...createdQuestion,
          answers: createdAnswers,
        });
      }

      return {
        ...quiz,
        questions: createdQuestions,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Quiz créé avec succès',
      quiz: result,
    });

  } catch (error: any) {
    console.error('Erreur lors de la création du quiz:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Données invalides',
          details: error.errors.map(e => ({ 
            field: e.path.join('.'), 
            message: e.message 
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du quiz' },
      { status: 500 }
    );
  }
});

// --- UPDATE QUIZ ---
export const PATCH = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const lessonId = parseInt(resolvedParams.lessonId);

  if (isNaN(lessonId)) {
    return NextResponse.json(
      { error: 'ID de leçon invalide' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsed = quizSchema.parse(body);

    // Validation supplémentaire des questions
    const validationErrors = validateQuestions(parsed.questions);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Erreurs de validation',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Vérifier que le quiz existe
    const existingQuiz = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.lessonId, lessonId))
      .limit(1);

    if (existingQuiz.length === 0) {
      return NextResponse.json(
        { error: 'Quiz introuvable pour cette leçon. Utilisez POST pour en créer un.' },
        { status: 404 }
      );
    }

    const quizId = existingQuiz[0].id;

    // Vérifier s'il y a des tentatives en cours
    const attempts = await db
      .select({ id: quizAttempts.id })
      .from(quizAttempts)
      .where(eq(quizAttempts.quizId, quizId))
      .limit(1);

    if (attempts.length > 0) {
      return NextResponse.json(
        { 
          error: 'Impossible de modifier le quiz car des étudiants ont déjà commencé à le passer',
          suggestion: 'Créez un nouveau quiz ou attendez que toutes les tentatives soient terminées'
        },
        { status: 409 }
      );
    }

    // Transaction pour mettre à jour le quiz complet
    const result = await db.transaction(async (tx) => {
      // 1. Mettre à jour le quiz
      const [updatedQuiz] = await tx
        .update(quizzes)
        .set({
          title: parsed.title,
          description: parsed.description,
          passingScore: parsed.passingScore,
          maxAttempts: parsed.maxAttempts,
        })
        .where(eq(quizzes.id, quizId))
        .returning();

      // 2. Supprimer toutes les anciennes réponses et questions
      // D'abord les réponses (à cause des contraintes de clé étrangère)
      await tx.delete(quizAnswers).where(
        eq(quizAnswers.questionId, 
          db.select({ id: quizQuestions.id })
            .from(quizQuestions)
            .where(eq(quizQuestions.quizId, quizId))
        )
      );
      
      // Puis les questions
      await tx.delete(quizQuestions).where(eq(quizQuestions.quizId, quizId));

      // 3. Recréer les questions et réponses
      const createdQuestions = [];
      for (let i = 0; i < parsed.questions.length; i++) {
        const question = parsed.questions[i];
        
        const [createdQuestion] = await tx
          .insert(quizQuestions)
          .values({
            quizId: updatedQuiz.id,
            question: question.question,
            questionType: question.questionType,
            points: question.points,
            explanation: question.explanation,
            position: i + 1,
          })
          .returning();

        const createdAnswers = [];
        for (let j = 0; j < question.answers.length; j++) {
          const answer = question.answers[j];
          
          const [createdAnswer] = await tx
            .insert(quizAnswers)
            .values({
              questionId: createdQuestion.id,
              answerText: answer.answerText,
              isCorrect: answer.isCorrect,
              position: j + 1,
            })
            .returning();

          createdAnswers.push(createdAnswer);
        }

        createdQuestions.push({
          ...createdQuestion,
          answers: createdAnswers,
        });
      }

      return {
        ...updatedQuiz,
        questions: createdQuestions,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Quiz mis à jour avec succès',
      quiz: result,
    });

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du quiz:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Données invalides',
          details: error.errors.map(e => ({ 
            field: e.path.join('.'), 
            message: e.message 
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du quiz' },
      { status: 500 }
    );
  }
});

// --- DELETE QUIZ ---
export const DELETE = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const lessonId = parseInt(resolvedParams.lessonId);

  if (isNaN(lessonId)) {
    return NextResponse.json(
      { error: 'ID de leçon invalide' },
      { status: 400 }
    );
  }

  try {
    // Vérifier que le quiz existe
    const existingQuiz = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.lessonId, lessonId))
      .limit(1);

    if (existingQuiz.length === 0) {
      return NextResponse.json(
        { error: 'Quiz introuvable pour cette leçon' },
        { status: 404 }
      );
    }

    const quizId = existingQuiz[0].id;

    // Vérifier s'il y a des tentatives de quiz
    const attempts = await db
      .select({ id: quizAttempts.id })
      .from(quizAttempts)
      .where(eq(quizAttempts.quizId, quizId))
      .limit(1);

    if (attempts.length > 0) {
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer ce quiz car des étudiants ont déjà tenté de le passer',
          suggestion: 'Vous pouvez modifier le quiz ou désactiver la leçon.'
        },
        { status: 409 }
      );
    }

    // Transaction pour supprimer le quiz et ses dépendances
    await db.transaction(async (tx) => {
      // 1. Supprimer les réponses
      await tx.delete(quizAnswers).where(
        eq(quizAnswers.questionId,
          db.select({ id: quizQuestions.id })
            .from(quizQuestions)
            .where(eq(quizQuestions.quizId, quizId))
        )
      );

      // 2. Supprimer les questions
      await tx.delete(quizQuestions).where(eq(quizQuestions.quizId, quizId));

      // 3. Supprimer le quiz
      await tx.delete(quizzes).where(eq(quizzes.id, quizId));
    });

    return NextResponse.json({
      success: true,
      message: `Quiz "${existingQuiz[0].title}" supprimé avec succès`
    });

  } catch (error: any) {
    console.error('Erreur lors de la suppression du quiz:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du quiz' },
      { status: 500 }
    );
  }
});