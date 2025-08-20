// app/api/admin/quiz/[quizId]/questions/[questionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  quizzes, 
  quizQuestions, 
  quizAnswers,
  quizAttempts 
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';

// --- SCHEMAS DE VALIDATION ---
const answerSchema = z.object({
  answerText: z.string().min(1, 'Le texte de la réponse est requis'),
  isCorrect: z.boolean(),
});

const updateQuestionSchema = z.object({
  question: z.string().min(1, 'Le texte de la question est requis').optional(),
  questionType: z.enum(['multiple_choice', 'true_false', 'open_ended']).optional(),
  points: z.number().min(1, 'Les points doivent être supérieurs à 0').optional(),
  explanation: z.string().optional(),
  position: z.number().min(1, 'La position doit être supérieure à 0').optional(),
  answers: z.array(answerSchema).optional(),
});

// --- FONCTIONS DE VALIDATION ---
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

// --- UTILITAIRES ---
async function reorderQuestionsAfterDelete(quizId: number, deletedPosition: number) {
  const questionsToUpdate = await db
    .select({ id: quizQuestions.id, position: quizQuestions.position })
    .from(quizQuestions)
    .where(
      and(
        eq(quizQuestions.quizId, quizId),
        // Toutes les questions après la position supprimée
      )
    )
    .orderBy(quizQuestions.position);

  // Décrémenter la position de toutes les questions suivantes
  for (const question of questionsToUpdate) {
    if (question.position > deletedPosition) {
      await db
        .update(quizQuestions)
        .set({ position: question.position - 1 })
        .where(eq(quizQuestions.id, question.id));
    }
  }
}

// Typage pour Next.js App Router
interface RouteParams {
  quizId: string;
  questionId: string;
}

// --- GET SINGLE QUESTION ---
export const GET = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const quizId = parseInt(resolvedParams.quizId);
  const questionId = parseInt(resolvedParams.questionId);

  if (isNaN(quizId) || isNaN(questionId)) {
    return NextResponse.json(
      { error: 'ID de quiz ou de question invalide' },
      { status: 400 }
    );
  }

  try {
    // Récupérer la question avec vérification qu'elle appartient au bon quiz
    const question = await db
      .select()
      .from(quizQuestions)
      .where(
        and(
          eq(quizQuestions.id, questionId),
          eq(quizQuestions.quizId, quizId)
        )
      )
      .limit(1);

    if (question.length === 0) {
      return NextResponse.json(
        { error: 'Question introuvable' },
        { status: 404 }
      );
    }

    // Récupérer les réponses
    const answers = await db
      .select()
      .from(quizAnswers)
      .where(eq(quizAnswers.questionId, questionId))
      .orderBy(quizAnswers.position);

    const questionWithAnswers = {
      ...question[0],
      answers,
    };

    return NextResponse.json(questionWithAnswers);

  } catch (error: any) {
    console.error('Erreur lors de la récupération de la question:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la question' },
      { status: 500 }
    );
  }
});

// --- UPDATE QUESTION ---
export const PATCH = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const quizId = parseInt(resolvedParams.quizId);
  const questionId = parseInt(resolvedParams.questionId);

  if (isNaN(quizId) || isNaN(questionId)) {
    return NextResponse.json(
      { error: 'ID de quiz ou de question invalide' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsed = updateQuestionSchema.parse(body);

    // Vérifier que la question existe et appartient au bon quiz
    const existingQuestion = await db
      .select()
      .from(quizQuestions)
      .where(
        and(
          eq(quizQuestions.id, questionId),
          eq(quizQuestions.quizId, quizId)
        )
      )
      .limit(1);

    if (existingQuestion.length === 0) {
      return NextResponse.json(
        { error: 'Question introuvable' },
        { status: 404 }
      );
    }

    // Vérifier qu'il n'y a pas de tentatives en cours
    const attempts = await db
      .select({ id: quizAttempts.id })
      .from(quizAttempts)
      .where(eq(quizAttempts.quizId, quizId))
      .limit(1);

    if (attempts.length > 0) {
      return NextResponse.json(
        { 
          error: 'Impossible de modifier la question car des étudiants ont déjà commencé à passer le quiz',
        },
        { status: 409 }
      );
    }

    // Si des réponses sont fournies, valider selon le type de question
    if (parsed.answers) {
      const questionType = parsed.questionType || existingQuestion[0].questionType!;
      const validationErrors = validateQuestionAnswers(questionType, parsed.answers);
      
      if (validationErrors.length > 0) {
        return NextResponse.json(
          { 
            error: 'Erreurs de validation',
            details: validationErrors
          },
          { status: 400 }
        );
      }
    }

    // Transaction pour mettre à jour la question et ses réponses
    const result = await db.transaction(async (tx) => {
      // Préparer les données de mise à jour
      const updateData: any = {};
      
      if (parsed.question) updateData.question = parsed.question;
      if (parsed.questionType) updateData.questionType = parsed.questionType;
      if (parsed.points) updateData.points = parsed.points;
      if (parsed.explanation !== undefined) updateData.explanation = parsed.explanation;
      if (parsed.position) updateData.position = parsed.position;

      // Mettre à jour la question si nécessaire
      let updatedQuestion = existingQuestion[0];
      if (Object.keys(updateData).length > 0) {
        const [updated] = await tx
          .update(quizQuestions)
          .set(updateData)
          .where(eq(quizQuestions.id, questionId))
          .returning();
        
        updatedQuestion = updated;
      }

      // Mettre à jour les réponses si fournies
      let updatedAnswers;
      if (parsed.answers) {
        // Supprimer les anciennes réponses
        await tx
          .delete(quizAnswers)
          .where(eq(quizAnswers.questionId, questionId));

        // Créer les nouvelles réponses
        updatedAnswers = [];
        for (let i = 0; i < parsed.answers.length; i++) {
          const answer = parsed.answers[i];
          
          const [createdAnswer] = await tx
            .insert(quizAnswers)
            .values({
              questionId: questionId,
              answerText: answer.answerText,
              isCorrect: answer.isCorrect,
              position: i + 1,
            })
            .returning();

          updatedAnswers.push(createdAnswer);
        }
      } else {
        // Récupérer les réponses existantes
        updatedAnswers = await tx
          .select()
          .from(quizAnswers)
          .where(eq(quizAnswers.questionId, questionId))
          .orderBy(quizAnswers.position);
      }

      return {
        ...updatedQuestion,
        answers: updatedAnswers,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Question mise à jour avec succès',
      question: result,
    });

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la question:', error);
    
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
      { error: 'Erreur lors de la mise à jour de la question' },
      { status: 500 }
    );
  }
});

// --- DELETE QUESTION ---
export const DELETE = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const quizId = parseInt(resolvedParams.quizId);
  const questionId = parseInt(resolvedParams.questionId);

  if (isNaN(quizId) || isNaN(questionId)) {
    return NextResponse.json(
      { error: 'ID de quiz ou de question invalide' },
      { status: 400 }
    );
  }

  try {
    // Vérifier que la question existe
    const existingQuestion = await db
      .select()
      .from(quizQuestions)
      .where(
        and(
          eq(quizQuestions.id, questionId),
          eq(quizQuestions.quizId, quizId)
        )
      )
      .limit(1);

    if (existingQuestion.length === 0) {
      return NextResponse.json(
        { error: 'Question introuvable' },
        { status: 404 }
      );
    }

    // Vérifier qu'il n'y a pas de tentatives en cours
    const attempts = await db
      .select({ id: quizAttempts.id })
      .from(quizAttempts)
      .where(eq(quizAttempts.quizId, quizId))
      .limit(1);

    if (attempts.length > 0) {
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer la question car des étudiants ont déjà commencé à passer le quiz',
        },
        { status: 409 }
      );
    }

    // Vérifier qu'il restera au moins une question après suppression
    const questionCount = await db
      .select({ count: quizQuestions.id })
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId));

    if (questionCount.length <= 1) {
      return NextResponse.json(
        { error: 'Impossible de supprimer la dernière question du quiz' },
        { status: 409 }
      );
    }

    const deletedPosition = existingQuestion[0].position;

    // Transaction pour supprimer la question et réorganiser
    await db.transaction(async (tx) => {
      // 1. Supprimer les réponses
      await tx
        .delete(quizAnswers)
        .where(eq(quizAnswers.questionId, questionId));

      // 2. Supprimer la question
      await tx
        .delete(quizQuestions)
        .where(eq(quizQuestions.id, questionId));

      // 3. Réorganiser les positions des questions restantes
      await reorderQuestionsAfterDelete(quizId, deletedPosition);
    });

    return NextResponse.json({
      success: true,
      message: 'Question supprimée avec succès'
    });

  } catch (error: any) {
    console.error('Erreur lors de la suppression de la question:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la question' },
      { status: 500 }
    );
  }
});