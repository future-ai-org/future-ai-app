import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const predictPath = path.join(repoRoot, 'data', 'predict.json');
const questionSourcePath = path.join(repoRoot, 'docs', 'predict-questions-source.json');

function fail(message) {
  throw new Error(`[predict:build] ${message}`);
}

function requireString(value, fieldName, index) {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`questions[${index}].${fieldName} must be a non-empty string`);
  }
}

function normalizeQuestion(rawQuestion, index, takenIds, nextIdRef) {
  if (typeof rawQuestion !== 'object' || rawQuestion === null) {
    fail(`questions[${index}] must be an object`);
  }

  const question = rawQuestion;
  requireString(question.category, 'category', index);
  requireString(question.question, 'question', index);
  requireString(question.expiresAt, 'expiresAt', index);

  if (question.outcomeType !== 'Binary' && question.outcomeType !== 'Multiple Choice') {
    fail(`questions[${index}].outcomeType must be "Binary" or "Multiple Choice"`);
  }

  let resolvedId;
  if (typeof question.id === 'number') {
    if (!Number.isInteger(question.id) || question.id <= 0) {
      fail(`questions[${index}].id must be a positive integer`);
    }
    resolvedId = question.id;
    if (takenIds.has(resolvedId)) {
      fail(`Duplicate question id: ${resolvedId}`);
    }
    takenIds.add(resolvedId);
    if (resolvedId >= nextIdRef.value) {
      nextIdRef.value = resolvedId + 1;
    }
  } else {
    while (takenIds.has(nextIdRef.value)) {
      nextIdRef.value += 1;
    }
    resolvedId = nextIdRef.value;
    takenIds.add(resolvedId);
    nextIdRef.value += 1;
  }

  if (question.outcomeType === 'Multiple Choice') {
    if (!Array.isArray(question.options) || question.options.length < 2) {
      fail(`questions[${index}].options must include at least 2 options for multiple choice`);
    }

    const options = [];
    const optionSet = new Set();
    for (const [optionIndex, option] of question.options.entries()) {
      if (typeof option !== 'string' || option.trim() === '') {
        fail(`questions[${index}].options[${optionIndex}] must be a non-empty string`);
      }
      if (optionSet.has(option)) {
        fail(`questions[${index}] has duplicate option "${option}"`);
      }
      optionSet.add(option);
      options.push(option);
    }

    return {
      id: resolvedId,
      category: question.category,
      question: question.question,
      outcome_type: 'Multiple Choice',
      options,
      expiresAt: question.expiresAt,
    };
  }

  if ('options' in question && Array.isArray(question.options) && question.options.length > 0) {
    fail(`questions[${index}] is Binary and cannot define options`);
  }

  return {
    id: resolvedId,
    category: question.category,
    question: question.question,
    outcome_type: 'Binary',
    expiresAt: question.expiresAt,
  };
}

async function main() {
  const [predictRaw, questionSourceRaw] = await Promise.all([
    readFile(predictPath, 'utf8'),
    readFile(questionSourcePath, 'utf8'),
  ]);

  const predictJson = JSON.parse(predictRaw);
  const questionSource = JSON.parse(questionSourceRaw);

  if (
    typeof questionSource !== 'object' ||
    questionSource === null ||
    !Array.isArray(questionSource.questions)
  ) {
    fail('docs/predict-questions-source.json must contain a top-level "questions" array');
  }

  const takenIds = new Set();
  const nextIdRef = { value: 1 };
  const normalizedQuestions = questionSource.questions.map((q, index) =>
    normalizeQuestion(q, index, takenIds, nextIdRef),
  );

  const nextPredictJson = {
    ...predictJson,
    questions: normalizedQuestions,
  };

  await writeFile(predictPath, `${JSON.stringify(nextPredictJson, null, 2)}\n`, 'utf8');
  process.stdout.write(
    `[predict:build] Wrote ${normalizedQuestions.length} questions to data/predict.json\n`,
  );
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
