// app/api/admin/quiz/questions/[questionId]/answers/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  quizQuestions, 
  quizAnswers,
  quizAttempts 
} from '@/lib/db/schema';
import { eq, max } from 'drizzle-orm';
import { z } from 'zod';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';
import logger from '@/lib/logger/logger';


// --- SCHEMAS DE VALIDATION ---
const createAnswerSchema = z.object({
  answerText: z.string()
    .min(1, 'Le texte de la réponse est requis')
    .max(500, 'Le texte de la réponse ne peut pas dépasser 500 caractères'),
  isCorrect: z.boolean().default(false),
});

const bulkCreateAnswersSchema = z.object({
  answers: z.array(createAnswerSchema)
    .min(1, 'Au moins une réponse est requise')
    .max(10, 'Pas plus de 10 réponses par question'),
});

// --- UTILITAIRES ---
async function getNextAnswerPosition(questionId: number): Promise<number> {
  const result = await db
    .select({ maxPosition: max(quizAnswers.position) })
    .from(quizAnswers)
    .where(eq(quizAnswers.questionId, questionId));
  
  return (result[0]?.maxPosition || 0) + 1;
}

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

async function validateQuestionAnswers(questionId: number, answers: any[]): Promise<string[]> {
  const errors: string[] = [];

  // Récupérer le type de question
  const question = await db
    .select({ questionType: quizQuestions.questionType })
    .from(quizQuestions)
    .where(eq(quizQuestions.id, questionId))
    .limit(1);

  if (question.length === 0) {
    errors.push('Question introuvable');
    return errors;
  }

  const questionType = question[0].questionType;

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

  // Vérifier les doublons
  const answerTexts = answers.map(a => a.answerText.toLowerCase().trim());
  const duplicates = answerTexts.filter((text, index) => answerTexts.indexOf(text) !== index);
  if (duplicates.length > 0) {
    errors.push('Les réponses ne peuvent pas être identiques');
  }

  return errors;
}

// Typage pour Next.js App Router
interface RouteParams {
  questionId: string;
}

// --- GET ALL ANSWERS ---
export const GET = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const questionId = parseInt(resolvedParams.questionId);

  if (isNaN(questionId)) {
    return NextResponse.json(
      { error: 'ID de question invalide' },
      { status: 400 }
    );
  }

  try {
    // Vérifier que la question existe
    const question = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.id, questionId))
      .limit(1);

    if (question.length === 0) {
      return NextResponse.json(
        { error: 'Question introuvable' },
        { status: 404 }
      );
    }

    // Récupérer toutes les réponses
    const answers = await db
      .select()
      .from(quizAnswers)
      .where(eq(quizAnswers.questionId, questionId))
      .orderBy(quizAnswers.position);

    return NextResponse.json({
      question: question[0],
      answers,
    });

  } catch (error: any) {
    logger.error('Erreur lors de la récupération des réponses:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des réponses' },
      { status: 500 }
    );
  }
});

// --- CREATE ANSWER ---
export const POST = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const questionId = parseInt(resolvedParams.questionId);

  if (isNaN(questionId)) {
    return NextResponse.json(
      { error: 'ID de question invalide' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    
    // Supporter à la fois la création d'une seule réponse ou multiple
    let parsedData;
    if (body.answers) {
      parsedData = bulkCreateAnswersSchema.parse(body);
    } else {
      const singleAnswer = createAnswerSchema.parse(body);
      parsedData = { answers: [singleAnswer] };
    }

    // Vérifier que la question existe et récupérer son quiz
    const question = await db
      .select({ 
        id: quizQuestions.id, 
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
          error: 'Impossible de modifier les réponses car des étudiants ont déjà commencé à passer le quiz',
        },
        { status: 409 }
      );
    }

    // Récupérer les réponses existantes
    const existingAnswers = await db
      .select()
      .from(quizAnswers)
      .where(eq(quizAnswers.questionId, questionId));

    // Valider l'ensemble des réponses (existantes + nouvelles)
    const allAnswers = [...existingAnswers, ...parsedData.answers];
    const validationErrors = await validateQuestionAnswers(questionId, allAnswers);
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Erreurs de validation',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Créer les nouvelles réponses
    const createdAnswers = [];
    for (let i = 0; i < parsedData.answers.length; i++) {
      const answer = parsedData.answers[i];
      const position = await getNextAnswerPosition(questionId);
      
      const [createdAnswer] = await db
        .insert(quizAnswers)
        .values({
          questionId,
          answerText: answer.answerText,
          isCorrect: answer.isCorrect,
          position,
        })
        .returning();

      createdAnswers.push(createdAnswer);
    }

    return NextResponse.json({
      success: true,
      message: `${createdAnswers.length} réponse(s) créée(s) avec succès`,
      answers: createdAnswers,
    });

  } catch (error: any) {
    logger.error('Erreur lors de la création des réponses:', error);
    
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
      { error: 'Erreur lors de la création des réponses' },
      { status: 500 }
    );
  }
});

// --- BULK UPDATE ANSWERS ---
export const PUT = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const questionId = parseInt(resolvedParams.questionId);

  if (isNaN(questionId)) {
    return NextResponse.json(
      { error: 'ID de question invalide' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsed = bulkCreateAnswersSchema.parse(body);

    // Vérifier que la question existe
    const question = await db
      .select({ 
        id: quizQuestions.id, 
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
          error: 'Impossible de modifier les réponses car des étudiants ont déjà commencé à passer le quiz',
        },
        { status: 409 }
      );
    }

    // Valider les nouvelles réponses
    const validationErrors = await validateQuestionAnswers(questionId, parsed.answers);
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Erreurs de validation',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Transaction pour remplacer toutes les réponses
    const result = await db.transaction(async (tx) => {
      // Supprimer toutes les anciennes réponses
      await tx
        .delete(quizAnswers)
        .where(eq(quizAnswers.questionId, questionId));

      // Créer les nouvelles réponses
      const createdAnswers = [];
      for (let i = 0; i < parsed.answers.length; i++) {
        const answer = parsed.answers[i];
        
        const [createdAnswer] = await tx
          .insert(quizAnswers)
          .values({
            questionId,
            answerText: answer.answerText,
            isCorrect: answer.isCorrect,
            position: i + 1,
          })
          .returning();

        createdAnswers.push(createdAnswer);
      }

      return createdAnswers;
    });

    return NextResponse.json({
      success: true,
      message: 'Réponses mises à jour avec succès',
      answers: result,
    });

  } catch (error: any) {
    logger.error('Erreur lors de la mise à jour des réponses:', error);
    
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
      { error: 'Erreur lors de la mise à jour des réponses' },
      { status: 500 }
    );
  }
});

// --- DELETE ALL ANSWERS ---
export const DELETE = withAdminAuth(async (req, adminUser, { params }) => {
  const resolvedParams = await params;
  const questionId = parseInt(resolvedParams.questionId);

  if (isNaN(questionId)) {
    return NextResponse.json(
      { error: 'ID de question invalide' },
      { status: 400 }
    );
  }

  try {
    // Vérifier que la question existe
    const question = await db
      .select({ 
        id: quizQuestions.id, 
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
          error: 'Impossible de supprimer les réponses car des étudiants ont déjà commencé à passer le quiz',
        },
        { status: 409 }
      );
    }

    // Les questions ouvertes peuvent n'avoir aucune réponse, mais pas les autres types
    if (question[0].questionType !== 'open_ended') {
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer toutes les réponses pour ce type de question',
          suggestion: 'Les questions à choix multiples et Vrai/Faux doivent avoir au moins une réponse'
        },
        { status: 409 }
      );
    }

    // Supprimer toutes les réponses
    const deletedAnswers = await db
      .delete(quizAnswers)
      .where(eq(quizAnswers.questionId, questionId))
      .returning();

    return NextResponse.json({
      success: true,
      message: `${deletedAnswers.length} réponse(s) supprimée(s) avec succès`,
      deletedCount: deletedAnswers.length,
    });

  } catch (error: any) {
    logger.error('Erreur lors de la suppression des réponses:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression des réponses' },
      { status: 500 }
    );
  }
});