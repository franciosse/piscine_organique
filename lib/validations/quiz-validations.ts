// lib/validations/quiz-validation.ts

import { z } from 'zod';

// --- TYPES DE BASE ---
export interface QuizValidationError {
  field: string;
  message: string;
  questionIndex?: number;
  answerIndex?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: QuizValidationError[];
  warnings?: string[];
}

// --- SCHEMAS ZOD ---
export const answerSchema = z.object({
  answerText: z.string()
    .min(1, 'Le texte de la réponse est requis')
    .max(500, 'Le texte de la réponse ne peut pas dépasser 500 caractères'),
  isCorrect: z.boolean(),
});

export const questionSchema = z.object({
  question: z.string()
    .min(1, 'Le texte de la question est requis')
    .max(1000, 'Le texte de la question ne peut pas dépasser 1000 caractères'),
  questionType: z.enum(['multiple_choice', 'true_false', 'open_ended'], {
    errorMap: () => ({ message: 'Type de question invalide' })
  }),
  points: z.number()
    .min(1, 'Les points doivent être supérieurs à 0')
    .max(100, 'Les points ne peuvent pas dépasser 100')
    .default(1),
  explanation: z.string()
    .max(1000, 'L\'explication ne peut pas dépasser 1000 caractères')
    .optional(),
  answers: z.array(answerSchema)
    .min(1, 'Au moins une réponse est requise')
    .max(10, 'Pas plus de 10 réponses par question'),
});

export const quizSchema = z.object({
  title: z.string()
    .min(1, 'Le titre du quiz est requis')
    .max(255, 'Le titre ne peut pas dépasser 255 caractères'),
  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional(),
  passingScore: z.number()
    .min(0, 'Le score minimum ne peut pas être négatif')
    .max(100, 'Le score minimum ne peut pas dépasser 100')
    .default(70),
  maxAttempts: z.number()
    .min(1, 'Au moins une tentative doit être autorisée')
    .max(10, 'Pas plus de 10 tentatives autorisées')
    .default(3),
  questions: z.array(questionSchema)
    .min(1, 'Au moins une question est requise')
    .max(50, 'Pas plus de 50 questions par quiz'),
});

// --- VALIDATIONS MÉTIER ---

/**
 * Valide une question selon son type
 */
export function validateQuestion(question: any, questionIndex: number = 0): ValidationResult {
  const errors: QuizValidationError[] = [];
  const warnings: string[] = [];

  try {
    // Validation Zod de base
    questionSchema.parse(question);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        errors.push({
          field: `questions.${questionIndex}.${err.path.join('.')}`,
          message: err.message,
          questionIndex,
        });
      });
    }
  }

  // Validations métier spécifiques par type
  const validationErrors = validateQuestionByType(question, questionIndex);
  errors.push(...validationErrors);

  // Avertissements
  const questionWarnings = generateQuestionWarnings(question, questionIndex);
  warnings.push(...questionWarnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valide une question selon son type spécifique
 */
function validateQuestionByType(question: any, questionIndex: number): QuizValidationError[] {
  const errors: QuizValidationError[] = [];

  if (!question.answers || !Array.isArray(question.answers)) {
    return errors;
  }

  switch (question.questionType) {
    case 'multiple_choice':
      errors.push(...validateMultipleChoiceQuestion(question, questionIndex));
      break;
    
    case 'true_false':
      errors.push(...validateTrueFalseQuestion(question, questionIndex));
      break;
    
    case 'open_ended':
      errors.push(...validateOpenEndedQuestion(question, questionIndex));
      break;
  }

  return errors;
}

/**
 * Valide une question à choix multiples
 */
function validateMultipleChoiceQuestion(question: any, questionIndex: number): QuizValidationError[] {
  const errors: QuizValidationError[] = [];

  if (question.answers.length < 2) {
    errors.push({
      field: `questions.${questionIndex}.answers`,
      message: 'Les questions à choix multiples doivent avoir au moins 2 réponses',
      questionIndex,
    });
  }

  if (question.answers.length > 6) {
    errors.push({
      field: `questions.${questionIndex}.answers`,
      message: 'Les questions à choix multiples ne devraient pas avoir plus de 6 réponses',
      questionIndex,
    });
  }

  const correctAnswers = question.answers.filter((a: any) => a.isCorrect);
  if (correctAnswers.length === 0) {
    errors.push({
      field: `questions.${questionIndex}.answers`,
      message: 'Au moins une réponse correcte est requise pour les questions à choix multiples',
      questionIndex,
    });
  }

  // Vérifier les doublons de réponses
  const answerTexts = question.answers.map((a: any) => a.answerText.toLowerCase().trim());
  const duplicates = answerTexts.filter((text: any, index: any) => answerTexts.indexOf(text) !== index);
  if (duplicates.length > 0) {
    errors.push({
      field: `questions.${questionIndex}.answers`,
      message: 'Les réponses ne peuvent pas être identiques',
      questionIndex,
    });
  }

  return errors;
}

/**
 * Valide une question Vrai/Faux
 */
function validateTrueFalseQuestion(question: any, questionIndex: number): QuizValidationError[] {
  const errors: QuizValidationError[] = [];

  if (question.answers.length !== 2) {
    errors.push({
      field: `questions.${questionIndex}.answers`,
      message: 'Les questions Vrai/Faux doivent avoir exactement 2 réponses',
      questionIndex,
    });
    return errors;
  }

  const correctAnswers = question.answers.filter((a: any) => a.isCorrect);
  if (correctAnswers.length !== 1) {
    errors.push({
      field: `questions.${questionIndex}.answers`,
      message: 'Les questions Vrai/Faux doivent avoir exactement une réponse correcte',
      questionIndex,
    });
  }

  // Vérifier que les réponses sont bien "Vrai" et "Faux"
  const answerTexts = question.answers.map((a: any) => a.answerText.toLowerCase().trim());
  const validAnswers = ['vrai', 'faux', 'true', 'false', 'oui', 'non', 'yes', 'no'];
  
  const hasValidAnswers = answerTexts.every((text: string | string[]) => 
    validAnswers.some(valid => text.includes(valid))
  );

  if (!hasValidAnswers) {
    errors.push({
      field: `questions.${questionIndex}.answers`,
      message: 'Pour les questions Vrai/Faux, les réponses devraient contenir "Vrai/Faux" ou "Oui/Non"',
      questionIndex,
    });
  }

  return errors;
}

/**
 * Valide une question ouverte
 */
function validateOpenEndedQuestion(question: any, questionIndex: number): QuizValidationError[] {
  const errors: QuizValidationError[] = [];

  // Les questions ouvertes peuvent avoir 0 réponses (évaluation manuelle)
  // ou des réponses suggérées pour l'auto-correction
  if (question.answers.length > 0) {
    const correctAnswers = question.answers.filter((a: any) => a.isCorrect);
    if (correctAnswers.length === 0) {
      errors.push({
        field: `questions.${questionIndex}.answers`,
        message: 'Si vous ajoutez des réponses suggérées, au moins une doit être marquée comme correcte',
        questionIndex,
      });
    }

    // Pour les questions ouvertes, limiter le nombre de réponses suggérées
    if (question.answers.length > 5) {
      errors.push({
        field: `questions.${questionIndex}.answers`,
        message: 'Les questions ouvertes ne devraient pas avoir plus de 5 réponses suggérées',
        questionIndex,
      });
    }
  }

  return errors;
}

/**
 * Génère des avertissements pour une question
 */
function generateQuestionWarnings(question: any, questionIndex: number): string[] {
  const warnings: string[] = [];

  // Avertissement si pas d'explication
  if (!question.explanation || question.explanation.trim() === '') {
    warnings.push(`Question ${questionIndex + 1}: Ajoutez une explication pour aider les étudiants à comprendre la réponse`);
  }

  // Avertissement pour les questions très courtes
  if (question.question.length < 10) {
    warnings.push(`Question ${questionIndex + 1}: La question semble très courte, assurez-vous qu'elle est claire`);
  }

  // Avertissement pour les questions très longues
  if (question.question.length > 500) {
    warnings.push(`Question ${questionIndex + 1}: La question est très longue, considérez la raccourcir`);
  }

  // Avertissement si beaucoup de points pour une question
  if (question.points > 10) {
    warnings.push(`Question ${questionIndex + 1}: Cette question a beaucoup de points (${question.points}), est-ce intentionnel ?`);
  }

  return warnings;
}

/**
 * Valide un quiz complet
 */
export function validateQuiz(quiz: any): ValidationResult {
  const errors: QuizValidationError[] = [];
  const warnings: string[] = [];

  try {
    // Validation Zod de base
    quizSchema.parse(quiz);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        errors.push({
          field: err.path.join('.'),
          message: err.message,
        });
      });
    }
  }

  // Validation de chaque question
  if (quiz.questions && Array.isArray(quiz.questions)) {
    quiz.questions.forEach((question: any, index: number) => {
      const questionValidation = validateQuestion(question, index);
      errors.push(...questionValidation.errors);
      warnings.push(...(questionValidation.warnings || []));
    });

    // Validations globales du quiz
    const globalValidation = validateQuizGlobally(quiz);
    errors.push(...globalValidation.errors);
    warnings.push(...(globalValidation.warnings || []));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validations globales du quiz
 */
function validateQuizGlobally(quiz: any): ValidationResult {
  const errors: QuizValidationError[] = [];
  const warnings: string[] = [];

  if (!quiz.questions || !Array.isArray(quiz.questions)) {
    return { isValid: true, errors, warnings };
  }

  // Calculer le score total possible
  const totalPoints = quiz.questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0);
  
  // Vérifier la cohérence du score de passage
  if (quiz.passingScore > 0) {
    const minimumPointsNeeded = Math.ceil((quiz.passingScore / 100) * totalPoints);
    
    if (minimumPointsNeeded > totalPoints) {
      errors.push({
        field: 'passingScore',
        message: `Le score de passage (${quiz.passingScore}%) est impossible à atteindre avec le total de points disponibles (${totalPoints})`,
      });
    }
  }

  // Avertissements globaux
  if (quiz.questions.length < 5) {
    warnings.push('Le quiz a moins de 5 questions, considérez en ajouter pour une évaluation plus complète');
  }

  if (quiz.questions.length > 30) {
    warnings.push('Le quiz a plus de 30 questions, cela pourrait être trop long pour les étudiants');
  }

  if (quiz.passingScore < 50) {
    warnings.push(`Le score de passage (${quiz.passingScore}%) semble bas, considérez l'augmenter`);
  }

  if (quiz.maxAttempts > 5) {
    warnings.push(`Beaucoup de tentatives autorisées (${quiz.maxAttempts}), cela pourrait diminuer l'importance du quiz`);
  }

  // Vérifier la distribution des types de questions
  const questionTypes = quiz.questions.reduce((acc: any, q: any) => {
    acc[q.questionType] = (acc[q.questionType] || 0) + 1;
    return acc;
  }, {});

  if (Object.keys(questionTypes).length === 1 && quiz.questions.length > 10) {
    warnings.push('Considérez varier les types de questions pour rendre le quiz plus engageant');
  }

  // Vérifier si toutes les questions ont le même nombre de points
  const pointsDistribution = [...new Set(quiz.questions.map((q: any) => q.points || 1))];
  if (pointsDistribution.length === 1 && quiz.questions.length > 5) {
    warnings.push('Considérez varier les points selon la difficulté des questions');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valide qu'un quiz peut être publié
 */
export function validateQuizForPublication(quiz: any): ValidationResult {
  const baseValidation = validateQuiz(quiz);
  const errors = [...baseValidation.errors];
  const warnings = [...(baseValidation.warnings || [])];

  // Validations supplémentaires pour la publication
  if (quiz.questions && Array.isArray(quiz.questions)) {
    quiz.questions.forEach((question: any, index: number) => {
      // Chaque question doit avoir une explication pour la publication
      if (!question.explanation || question.explanation.trim() === '') {
        errors.push({
          field: `questions.${index}.explanation`,
          message: `Question ${index + 1}: Une explication est requise pour publier le quiz`,
          questionIndex: index,
        });
      }

      // Les questions ouvertes sans réponses suggérées nécessitent une validation manuelle
      if (question.questionType === 'open_ended' && (!question.answers || question.answers.length === 0)) {
        warnings.push(`Question ${index + 1}: Question ouverte sans réponses suggérées - nécessitera une correction manuelle`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Utilitaire pour formater les erreurs de validation pour l'affichage
 */
export function formatValidationErrors(validation: ValidationResult): string[] {
  const formatted: string[] = [];

  validation.errors.forEach(error => {
    if (error.questionIndex !== undefined) {
      formatted.push(`Question ${error.questionIndex + 1}: ${error.message}`);
    } else {
      formatted.push(error.message);
    }
  });

  return formatted;
}

/**
 * Utilitaire pour vérifier si un quiz a des modifications non sauvegardées
 */
export function hasUnsavedChanges(originalQuiz: any, currentQuiz: any): boolean {
  // Comparaison simple - dans un vrai projet, vous pourriez utiliser une bibliothèque comme lodash.isEqual
  return JSON.stringify(originalQuiz) !== JSON.stringify(currentQuiz);
}