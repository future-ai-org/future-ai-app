import predict from '@/data/predict.json';

type JsonQuestion = {
  id?: unknown;
  outcome_type?: unknown;
  options?: unknown;
};

export function isValidBinaryPredictQuestionId(questionId: number): boolean {
  const raw = predict.questions;
  if (!Array.isArray(raw)) return false;
  return raw.some((q: JsonQuestion) => {
    const id = q.id;
    return (
      typeof id === 'number' &&
      id === questionId &&
      q.outcome_type === 'Binary'
    );
  });
}

/** Options list for a multiple-choice question, or null if not MC / missing. */
export function getMcOptionsForQuestion(questionId: number): readonly string[] | null {
  const raw = predict.questions;
  if (!Array.isArray(raw)) return null;
  for (const q of raw) {
    if (typeof q !== 'object' || q === null || !('id' in q)) continue;
    const id = (q as JsonQuestion).id;
    if (typeof id !== 'number' || id !== questionId) continue;
    if ((q as JsonQuestion).outcome_type !== 'Multiple Choice') return null;
    const opts = (q as JsonQuestion).options;
    if (!Array.isArray(opts)) return null;
    const strings = opts.filter((x): x is string => typeof x === 'string' && x.trim() !== '');
    return strings.length > 0 ? strings : null;
  }
  return null;
}

export function isValidMcPredictQuestionId(questionId: number): boolean {
  return getMcOptionsForQuestion(questionId) !== null;
}

export function isValidPredictQuestionId(questionId: number): boolean {
  return isValidBinaryPredictQuestionId(questionId) || isValidMcPredictQuestionId(questionId);
}

/**
 * Canonical side string for storage: lowercase yes/no for binary, exact option label for MC.
 */
export function normalizePredictBetSide(questionId: number, side: string): string | null {
  const t = side.trim();
  if (t === '') return null;
  if (isValidBinaryPredictQuestionId(questionId)) {
    const l = t.toLowerCase();
    return l === 'yes' || l === 'no' ? l : null;
  }
  const opts = getMcOptionsForQuestion(questionId);
  if (!opts) return null;
  return opts.includes(t) ? t : null;
}
