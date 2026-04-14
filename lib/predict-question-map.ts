import predict from '@/data/predict.json';

export type PredictQuestionMeta = {
  question: string;
  category: string;
  expiresAt: string;
};

/** Resolve copy in `predict.json` by id (for dashboard / API). */
export function getPredictQuestionMeta(questionId: number): PredictQuestionMeta | null {
  const raw = predict.questions;
  if (!Array.isArray(raw)) return null;
  for (const q of raw) {
    if (typeof q !== 'object' || q === null || !('id' in q)) continue;
    const id = (q as { id: unknown }).id;
    if (typeof id !== 'number' || id !== questionId) continue;
    const question = (q as { question?: unknown }).question;
    const category = (q as { category?: unknown }).category;
    const expiresAt = (q as { expiresAt?: unknown }).expiresAt;
    return {
      question: typeof question === 'string' ? question : '',
      category: typeof category === 'string' ? category : '',
      expiresAt: typeof expiresAt === 'string' ? expiresAt : '',
    };
  }
  return null;
}
