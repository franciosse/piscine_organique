// app/api/admin/quiz/[quizId]/questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  quizzes, 
  quizQuestions, 
  quizAnswers,
  quizAttempts,
  quizAttemptAnswers 
} from '@/lib/db/schema';
import { eq, and, desc, max } from 'drizzle-orm';
import { z } from 'zod';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';
import logger from '@/lib/logger/logger';


// --- SCHEMAS DE VALIDATION ---
const answerSchema = z.object({
  answerText: z.string().min(1, 'Le texte de la réponse est requis'),
  isCorrect: z.boolean(),
});

const createQuestionSchema = z.object({
  question: z.string().min(1, 'Le texte de la question est requis'),
  questionType: z.enum(['multiple_choice', 'true_false', 'open_ended'], {
    errorMap: () => ({ message: 'Type de question invalide' })
  }),
  points: z.number().min(1, 'Les points doivent être supérieurs à 0').default(1),
  explanation: z.string().optional(),
  answers: z.array(answerSchema).min(1, 'Au moins une réponse est requise'),
});

// --- FONCTIONS DE VALIDATION MÉTIER ---
const validateQuestionAnswers = (questionType: string, answers: any[]) => {
  const errors: string[] = [];

  switch (questionType) {
    case 'multiple_choice':
      if (answers.length < 2) {
        errors.push('Les questions à choix multiples doivent avoir au moins 2 réponses');
      }
      
      const correctAnswers = answers.filter(a => a.isCorrect);
      if (correctAnswers.length === 0) {
        errors.push('Au moins une réponse correcte est requise pour les questions à choix multiples');
      }
      break;

    case 'true_false':
      if (answers.length !== 2) {
        errors.push('Les questions Vrai/Faux doivent avoir exactement 2 réponses');
      }
      
      const correctTrueFalse = answers.filter(a => a.isCorrect);
      if (correctTrueFalse.length !== 1) {
        errors.push('Les questions Vrai/Faux doivent avoir exactement une réponse correcte');
      }
      break;

    case 'open_ended':
      // Pour les questions ouvertes, on peut avoir des réponses suggérées mais pas obligatoirement
      if (answers.length > 0) {
        const hasCorrectAnswer = answers.some(a => a.isCorrect);
        if (!hasCorrectAnswer) {
          errors.push('Si vous ajoutez des réponses suggérées, au moins une doit être marquée comme correcte');
        }
      }
      break;
  }

  return errors;
};

// --- FONCTIONS UTILITAIRES ---
async function getNextPosition(quizId: number): Promise<number> {
  const result = await db
    .select({ maxPosition: max(quizQuestions.position) })
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId));
  
  return (result[0]?.maxPosition || 0) + 1;
}

async function reorderQuestions(quizId: number, excludeQuestionId?: number) {
  const questions = await db
    .select({ id: quizQuestions.id })
    .from(quizQuestions)
    .where(
      excludeQuestionId 
        ? and(eq(quizQuestions.quizId, quizId), eq(quizQuestions.id, excludeQuestionId))
        : eq(quizQuestions.quizId, quizId)
    )
    .orderBy(quizQuestions.position);

  for (let i = 0; i < questions.length; i++) {
    await db
      .update(quizQuestions)
      .set({ position: i + 1 })
      .where(eq(quizQuestions.id, questions[i].id));
  }
}

// Typage pour Next.js App Router
interface RouteParams {
  quizId: string;
}

// --- GET ALL QUESTIONS ---
export const GET = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const quizId = parseInt(resolvedParams.quizId);

  if (isNaN(quizId)) {
    return NextResponse.json(
      { error: 'ID de quiz invalide' },
      { status: 400 }
    );
  }

  try {
    // Vérifier que le quiz existe
    const quiz = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1);

    if (quiz.length === 0) {
      return NextResponse.json(
        { error: 'Quiz introuvable' },
        { status: 404 }
      );
    }

    // Récupérer toutes les questions avec leurs réponses
    const questions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(quizQuestions.position);

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

    return NextResponse.json({
      quiz: quiz[0],
      questions: questionsWithAnswers,
    });

  } catch (error: any) {
    logger.error('Erreur lors de la récupération des questions:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des questions' },
      { status: 500 }
    );
  }
});

// --- CREATE QUESTION ---
export const POST = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const quizId = parseInt(resolvedParams.quizId);

  if (isNaN(quizId)) {
    return NextResponse.json(
      { error: 'ID de quiz invalide' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsed = createQuestionSchema.parse(body);

    // Validation métier des réponses
    const validationErrors = validateQuestionAnswers(parsed.questionType, parsed.answers);
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
    const quiz = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1);

    if (quiz.length === 0) {
      return NextResponse.json(
        { error: 'Quiz introuvable' },
        { status: 404 }
      );
    }

    // Vérifier qu'il n'y a pas de tentatives en cours pour ce quiz
    const attempts = await db
      .select({ id: quizAttempts.id })
      .from(quizAttempts)
      .where(eq(quizAttempts.quizId, quizId))
      .limit(1);

    if (attempts.length > 0) {
      return NextResponse.json(
        { 
          error: 'Impossible de modifier le quiz car des étudiants ont déjà commencé à le passer',
        },
        { status: 409 }
      );
    }

    // Transaction pour créer la question et ses réponses
    const result = await db.transaction(async (tx) => {
      // Obtenir la prochaine position
      const position = await getNextPosition(quizId);

      // Créer la question
      const [question] = await tx
        .insert(quizQuestions)
        .values({
          quizId,
          question: parsed.question,
          questionType: parsed.questionType,
          points: parsed.points,
          explanation: parsed.explanation,
          position,
        })
        .returning();

      // Créer les réponses
      const createdAnswers = [];
      for (let i = 0; i < parsed.answers.length; i++) {
        const answer = parsed.answers[i];
        
        const [createdAnswer] = await tx
          .insert(quizAnswers)
          .values({
            questionId: question.id,
            answerText: answer.answerText,
            isCorrect: answer.isCorrect,
            position: i + 1,
          })
          .returning();

        createdAnswers.push(createdAnswer);
      }

      return {
        ...question,
        answers: createdAnswers,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Question créée avec succès',
      question: result,
    });

  } catch (error: any) {
    logger.error('Erreur lors de la création de la question:', error);
    
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
      { error: 'Erreur lors de la création de la question' },
      { status: 500 }
    );
  }
});