import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import { getPredictQuestionMeta } from '@/lib/predict-question-map';
import {
  formatPermilleAsPercent,
  marketPermilleByChoice,
  marketPermilleFromSideCoins,
} from '@/lib/predict-market-odds';
import { getMcOptionsForQuestion, isValidBinaryPredictQuestionId } from '@/lib/predict-validate';

export type FooterBetItem = {
  questionId: number;
  question: string;
  leadingSide: string;
  leadingPercent: string;
  href: string;
};

async function computeHomepageFooterBets(): Promise<FooterBetItem[]> {
  const rows = await prisma.predictBet.groupBy({
    by: ['questionId', 'side'],
    _sum: { coins: true },
  });

  const coinsByQuestion = new Map<number, Map<string, number>>();
  for (const row of rows) {
    const coins = row._sum.coins ?? 0;
    const inner = coinsByQuestion.get(row.questionId) ?? new Map<string, number>();
    const key = isValidBinaryPredictQuestionId(row.questionId)
      ? row.side.trim().toLowerCase()
      : row.side;
    inner.set(key, (inner.get(key) ?? 0) + coins);
    coinsByQuestion.set(row.questionId, inner);
  }

  const items: Array<FooterBetItem & { score: number }> = [];
  for (const [questionId, sideMap] of coinsByQuestion) {
    const meta = getPredictQuestionMeta(questionId);
    const question =
      meta && meta.question.trim() !== '' ? meta.question : `question #${questionId}`;

    if (isValidBinaryPredictQuestionId(questionId)) {
      const yesCoins = sideMap.get('yes') ?? 0;
      const noCoins = sideMap.get('no') ?? 0;
      const { yesPermille, noPermille } = marketPermilleFromSideCoins(yesCoins, noCoins);
      const leadingPermille = Math.max(yesPermille, noPermille);
      if (leadingPermille === 500) continue;
      const leadingSide = yesPermille >= noPermille ? 'Yes' : 'No';
      items.push({
        questionId,
        question,
        leadingSide,
        leadingPercent: formatPermilleAsPercent(leadingPermille),
        href: `/#predict-question-${questionId}`,
        score: leadingPermille,
      });
      continue;
    }

    const mcOptions = getMcOptionsForQuestion(questionId);
    if (!mcOptions) continue;

    const choiceMap = new Map<string, number>();
    for (const opt of mcOptions) {
      choiceMap.set(opt, sideMap.get(opt) ?? 0);
    }
    const permilles = marketPermilleByChoice(choiceMap, mcOptions);
    let bestOption = '';
    let bestPermille = -1;
    for (const opt of mcOptions) {
      const p = permilles.get(opt) ?? 0;
      if (p > bestPermille) {
        bestPermille = p;
        bestOption = opt;
      }
    }
    if (bestPermille === 500) continue;
    if (bestPermille < 0 || bestOption.trim() === '') continue;
    items.push({
      questionId,
      question,
      leadingSide: bestOption,
      leadingPercent: formatPermilleAsPercent(bestPermille),
      href: `/#predict-question-${questionId}`,
      score: bestPermille,
    });
  }

  return items
    .sort((a, b) => b.score - a.score || a.questionId - b.questionId)
    .map(item => ({
      questionId: item.questionId,
      question: item.question,
      leadingSide: item.leadingSide,
      leadingPercent: item.leadingPercent,
      href: item.href,
    }));
}

export const getHomepageFooterBets = unstable_cache(
  async () => computeHomepageFooterBets(),
  ['homepage-footer-bets-v1'],
  { revalidate: 60 },
);
