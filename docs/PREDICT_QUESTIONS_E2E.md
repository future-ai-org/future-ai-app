# Predict Questions E2E

This project now treats `data/predict-questions.json` as the source of truth for prediction question strings.

`data/predict.json` remains the runtime file consumed by the app, and is generated via script.

## Files

- `data/predict-questions.json`: author-friendly question content (strings and market config)
- `scripts/generate-predict-data.mjs`: validator + generator
- `data/predict.json`: generated runtime payload used by `copy.predict`

## Add A New Question

1. Open `data/predict-questions.json`.
2. Append a new object inside `questions`.
3. Fill:
   - `category` (string)
   - `question` (string)
   - `outcomeType` (`Binary` or `Multiple Choice`)
   - `expiresAt` (`YYYY-MM-DD`)
   - `options` (required only for `Multiple Choice`, at least 2 unique strings)
4. Optional: set `id`.
   - If omitted, the generator auto-assigns the next available positive integer id.
   - If provided, it must be unique and positive.

## Build Runtime Data

Run:

```bash
npm run predict:build
```

What this does:

- Validates each question entry.
- Ensures ids are unique.
- Ensures MC questions include valid options.
- Writes normalized `questions` into `data/predict.json`.

## Validation Errors You Might See

- Missing string fields (`category`, `question`, `expiresAt`)
- Invalid `outcomeType`
- Duplicate or invalid ids
- Missing/duplicate options on multiple-choice entries
- Options present on binary entries

All errors are emitted with question index context and the command exits non-zero.

## End-To-End Verification Checklist

After generating:

1. Run `npm run lint`.
2. Run `npm run typecheck`.
3. Start app with `npm run dev`.
4. Open home page (`/`) and verify cards render with new question text.
5. Click answer/invest path to verify side labels still work.
6. Verify market odds endpoint shape:
   - `GET /api/predict/odds`
   - `GET /api/predict/footer-bets`
7. If question is multiple-choice, verify all options render and can be selected.

## Recommended Team Workflow

1. Edit only `data/predict-questions.json` for question updates.
2. Run `npm run predict:build`.
3. Review generated `data/predict.json` diff.
4. Run lint/typecheck/tests.
5. Commit both source and generated files together.
