import predict from '@/data/predict.json';

type JsonQuestion = {
  id?: unknown;
  outcome_type?: unknown;
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
