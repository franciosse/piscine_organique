// app/api/admin/quiz/questions/[questionId]/answers/[answerId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  quizQuestions, 
  quizAnswers,
  quizAttempts 
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';

// --- SCHEMAS DE VALIDATION ---
const updateAnswerSchema = z.object({
  answerText: z.string()
    .min(1, 'Le texte de la réponse est requis')
    .max(500, 'Le texte de la réponse ne peut pas dépasser 500 caractères')
    .optional(),
  isCorrect: z.boolean().optional(),
  position: z.number().min(1, 'La position doit être supérieure à 0').optional(),
});

// --- UTILITAIRES ---
async function reorderAnswersAfterDelete(questionId: number, deletedPosition: number) {
  const answersToUpdate = await db
    .select({ id: quizAnswers.id, position: quizAnswers.position })
    .from(quizAnswers)
    .where(eq(quizAnswers.questionId, questionId))
    .orderBy(quizAnswers.position);

  for (const answer of answersToUpdate) {
    if (answer.position > deletedPosition) {
      await db
        .update(quizAnswers)
        .set({ position: answer.position - 1 })
        .where(eq(quizAnswers.id, answer.id));
    }
  }
}

async function validateAnswerUpdate(questionId: number, answerId: number, updates: any): Promise<string[]> {
  const errors: string[] = [];

  // Récupérer la question et ses réponses actuelles
  const question = await db
    .select({ questionType: quizQuestions.questionType })
    .from(quizQuestions)
    .where(eq(quizQuestions.id, questionId))
    .limit(1);

  if (question.length === 0) {
    errors.push('Question introuvable');
    return errors;
  }

  const allAnswers = await db
    .select()
    .from(quizAnswers)
    .where(eq(quizAnswers.questionId, questionId))
    .orderBy(quizAnswers.position);

  // Simuler les modifications
  const updatedAnswers = allAnswers.map(answer => {
    if (answer.id === answerId) {
      return { ...answer, ...updates };
    }
    return answer;
  });

  const questionType = question[0].questionType;

  // Valider selon le type de question
  switch (questionType) {
    case 'multiple_choice':
      const correctMC = updatedAnswers.filter(a => a.isCorrect);
      if (correctMC.length === 0) {
        errors.push('Au moins une réponse correcte est requise pour les questions à choix multiples');
      }
      break;

    case 'true_false':
      const correctTF = updatedAnswers.filter(a => a.isCorrect);
      if (correctTF.length !== 1) {
        errors.push('Les questions Vrai/Faux doivent avoir exactement une réponse correcte');
      }
      break;

    case 'open_ended':
      if (updatedAnswers.length > 0) {
        const hasCorrect = updatedAnswers.some(a => a.isCorrect);
        if (!hasCorrect) {
          errors.push('Si des réponses suggérées existent, au moins une doit être correcte');
        }
      }
      break;
  }

  // Vérifier les doublons de texte
  if (updates.answerText) {
    const answerTexts = updatedAnswers.map(a => a.answerText.toLowerCase().trim());
    const duplicates = answerTexts.filter((text, index) => answerTexts.indexOf(text) !== index);
    if (duplicates.length > 0) {
      errors.push('Le texte de cette réponse existe déjà pour cette question');
    }
  }

  return errors;
}

// Typage pour Next.js App Router
interface RouteParams {
  questionId: string;
  answerId: string;
}

// --- GET SINGLE ANSWER ---
export const GET = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const questionId = parseInt(resolvedParams.questionId);
  const answerId = parseInt(resolvedParams.answerId);

  if (isNaN(questionId) || isNaN(answerId)) {
    return NextResponse.json(
      { error: 'ID de question ou de réponse invalide' },
      { status: 400 }
    );
  }

  try {
    // Récupérer la réponse avec vérification qu'elle appartient à la bonne question
    const answer = await db
      .select()
      .from(quizAnswers)
      .where(
        and(
          eq(quizAnswers.id, answerId),
          eq(quizAnswers.questionId, questionId)
        )
      )
      .limit(1);

    if (answer.length === 0) {
      return NextResponse.json(
        { error: 'Réponse introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json(answer[0]);

  } catch (error: any) {
    console.error('Erreur lors de la récupération de la réponse:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la réponse' },
      { status: 500 }
    );
  }
});

// --- UPDATE ANSWER ---
export const PATCH = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const questionId = parseInt(resolvedParams.questionId);
  const answerId = parseInt(resolvedParams.answerId);

  if (isNaN(questionId) || isNaN(answerId)) {
    return NextResponse.json(
      { error: 'ID de question ou de réponse invalide' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsed = updateAnswerSchema.parse(body);

    // Vérifier que la réponse existe et appartient à la bonne question
    const existingAnswer = await db
      .select()
      .from(quizAnswers)
      .where(
        and(
          eq(quizAnswers.id, answerId),
          eq(quizAnswers.questionId, questionId)
        )
      )
      .limit(1);

    if (existingAnswer.length === 0) {
      return NextResponse.json(
        { error: 'Réponse introuvable' },
        { status: 404 }
      );
    }

    // Récupérer le quiz ID pour vérifier les tentatives
    const question = await db
      .select({ quizId: quizQuestions.quizId })
      .from(quizQuestions)
      .where(eq(quizQuestions.id, questionId))
      .limit(1);

    if (question.length === 0) {
      return NextResponse.json(
        { error: 'Question introuvable' },
        { status: 404 }
      );
    }

    // Vérifier qu'il n'y a pas de tentatives en cours
    const attempts = await db
      .select({ id: quizAttempts.id })
      .from(quizAttempts)
      .where(eq(quizAttempts.quizId, question[0].quizId))
      .limit(1);

    if (attempts.length > 0) {
      return NextResponse.json(
        { 
          error: 'Impossible de modifier la réponse car des étudiants ont déjà commencé à passer le quiz',
        },
        { status: 409 }
      );
    }

    // Valider les modifications
    const validationErrors = await validateAnswerUpdate(questionId, answerId, parsed);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Erreurs de validation',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (parsed.answerText !== undefined) updateData.answerText = parsed.answerText;
    if (parsed.isCorrect !== undefined) updateData.isCorrect = parsed.isCorrect;
    if (parsed.position !== undefined) updateData.position = parsed.position;

    // Mettre à jour la réponse
    const [updatedAnswer] = await db
      .update(quizAnswers)
      .set(updateData)
      .where(eq(quizAnswers.id, answerId))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Réponse mise à jour avec succès',
      answer: updatedAnswer,
    });

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la réponse:', error);
    
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
      { error: 'Erreur lors de la mise à jour de la réponse' },
      { status: 500 }
    );
  }
});

// --- DELETE ANSWER ---
export const DELETE = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const questionId = parseInt(resolvedParams.questionId);
  const answerId = parseInt(resolvedParams.answerId);

  if (isNaN(questionId) || isNaN(answerId)) {
    return NextResponse.json(
      { error: 'ID de question ou de réponse invalide' },
      { status: 400 }
    );
  }

  try {
    // Vérifier que la réponse existe
    const existingAnswer = await db
      .select()
      .from(quizAnswers)
      .where(
        and(
          eq(quizAnswers.id, answerId),
          eq(quizAnswers.questionId, questionId)
        )
      )
      .limit(1);

    if (existingAnswer.length === 0) {
      return NextResponse.json(
        { error: 'Réponse introuvable' },
        { status: 404 }
      );
    }

    // Récupérer la question et le quiz
    const question = await db
      .select({ 
        quizId: quizQuestions.quizId, 
        questionType: quizQuestions.questionType 
      })
      .from(quizQuestions)
      .where(eq(quizQuestions.id, questionId))
      .limit(1);

    if (question.length === 0) {
      return NextResponse.json(
        { error: 'Question introuvable' },
        { status: 404 }
      );
    }

    // Vérifier qu'il n'y a pas de tentatives en cours
    const attempts = await db
      .select({ id: quizAttempts.id })
      .from(quizAttempts)
      .where(eq(quizAttempts.quizId, question[0].quizId))
      .limit(1);

    if (attempts.length > 0) {
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer la réponse car des étudiants ont déjà commencé à passer le quiz',
        },
        { status: 409 }
      );
    }

    // Compter les réponses actuelles
    const answerCount = await db
      .select({ count: quizAnswers.id })
      .from(quizAnswers)
      .where(eq(quizAnswers.questionId, questionId));

    // Vérifications selon le type de question
    const questionType = question[0].questionType;
    
    if (questionType === 'multiple_choice' && answerCount.length <= 2) {
      return NextResponse.json(
        { error: 'Les questions à choix multiples doivent avoir au moins 2 réponses' },
        { status: 409 }
      );
    }

    if (questionType === 'true_false' && answerCount.length <= 2) {
      return NextResponse.json(
        { error: 'Les questions Vrai/Faux doivent avoir exactement 2 réponses' },
        { status: 409 }
      );
    }

    // Si c'est la seule réponse correcte, vérifier qu'on peut la supprimer
    if (existingAnswer[0].isCorrect && questionType !== 'open_ended') {
      const otherCorrectAnswers = await db
        .select({ id: quizAnswers.id })
        .from(quizAnswers)
        .where(
          and(
            eq(quizAnswers.questionId, questionId),
            eq(quizAnswers.isCorrect, true),
            // Exclure la réponse qu'on veut supprimer
            // Note: en SQL, on utiliserait != mais Drizzle utilise ne()
          )
        );

      // Pour simplifier, on compte toutes les réponses correctes et on vérifie
      const allCorrectAnswers = await db
        .select({ id: quizAnswers.id })
        .from(quizAnswers)
        .where(
          and(
            eq(quizAnswers.questionId, questionId),
            eq(quizAnswers.isCorrect, true)
          )
        );

      if (allCorrectAnswers.length <= 1) {
        return NextResponse.json(
          { 
            error: 'Impossible de supprimer la seule réponse correcte',
            suggestion: 'Marquez d\'abord une autre réponse comme correcte'
          },
          { status: 409 }
        );
      }
    }

    const deletedPosition = existingAnswer[0].position;

    // Transaction pour supprimer et réorganiser
    await db.transaction(async (tx) => {
      // Supprimer la réponse
      await tx
        .delete(quizAnswers)
        .where(eq(quizAnswers.id, answerId));

      // Réorganiser les positions
      await reorderAnswersAfterDelete(questionId, deletedPosition);
    });

    return NextResponse.json({
      success: true,
      message: 'Réponse supprimée avec succès'
    });

  } catch (error: any) {
    console.error('Erreur lors de la suppression de la réponse:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la réponse' },
      { status: 500 }
    );
  }
});