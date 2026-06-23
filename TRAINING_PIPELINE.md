# TM Sentence Training Pipeline

## 1. Prepare data (Phase 1 + 2)

Run:

```bash
npm run data:prepare
```

Generated files (under `src/data/processed`):

- `cleaned_lexicon.json`: one unique row per meaning, canonical TM form, alternates, quality field.
- `cleaned_lexicon_quarantine.json`: suspicious lexicon rows to review.
- `sentences_expanded_all.json`: one row per sentence variant with speaker metadata.
- `sentences_quarantine.json`: sentence rows excluded from training.
- `sentences_missing_for_training.json`: source rows with missing targets/variants.
- `training_rows.json` and `training_rows.jsonl`: model-ready rows.
- `retrieval_corpus.json`: normalized rows for top-k retrieval.
- `feedback_gold.jsonl`: reviewer correction log.

If you maintain a separate curated correction log, place it in `feedback_gold.jsonl` before exporting datasets.

Model-ready row shape:

```json
{
  "source_english": "Please give me water.",
  "speaker_profile": "young_female",
  "sentence_family": "imperative",
  "target_tm_romanized": "daya karun mala paani de",
  "quality_score": 1,
  "source_id": "ST074::young_female"
}
```

## 2. Train sequence model (Phase 3)

Recommended first model:

- `google/byt5-small` (best for noisy romanization)
- fallback: `google/mt5-small`

Input format suggestion:

```text
[PROFILE=young_female] [FAMILY=imperative] Please give me water.
```

Target:

```text
daya karun mala paani de
```

Use only rows from `training_rows.jsonl` and optionally up-weight `quality_score == 1` rows.

## 3. Retrieval before generation (Phase 4)

Run a quick retrieval query:

```bash
npm run retrieve -- "Please give me water" 5
```

Use top 3-5 matches as context in inference or as a reranking signal.

## 4. Curated corrections

If you maintain a separate gold set, append validated rows to `src/data/processed/feedback_gold.jsonl` with your own offline process before exporting datasets.

Recommended retraining policy:

- periodic fine-tune with `training_rows` + `feedback_gold` corrected targets.
- prioritize newer and high-confidence reviewer rows.

## 5. Export Hugging Face dataset

Run:

```bash
npm run data:export:hf
```

Generated:

- `hf_dataset_all.jsonl`
- `hf_dataset_train.jsonl`
- `hf_dataset_eval.jsonl`
- `hf_dataset_summary.json`

Each row uses:

```json
{
  "input_text": "[PROFILE=young_female] [FAMILY=imperative] Please give me water.",
  "target_text": "daya karun mala paani de",
  "weight": 1,
  "source_id": "ST074::young_female",
  "source_type": "training"
}
```
