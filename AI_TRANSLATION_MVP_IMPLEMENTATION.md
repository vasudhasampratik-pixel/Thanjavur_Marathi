# AI Translation MVP — Implementation Spec 

0. How to Use This Doc
This is a build spec for an existing app. Inspect the repo first, adapt to its conventions, and implement in small tested increments. Do not rewrite the app or add frameworks unless the current stack genuinely can't host the MVP.
Hard rules (never violate):

- Don't delete existing data or behavior; back it up first.
- Never treat unreviewed crowd responses as authoritative output.
- Never present AI output as human-verified; never show a confidence % without real calibration.
- No secrets, model weights, or private datasets in Git or client-side code.
- Speech: only English STT (already built) + English TTS on output. Text MVP must work before touching anything speech-adjacent.
- Document every new service, config value, and data step.

1. What Exists Today
- App with a Translate tab and a Contribute (crowdsourcing) tab.
- approx 800-word JSON glossary in codebase (dictionary.json); ~2,200 crowdsourced sentences in Firestore.
- Deterministic exact-match word/phrase lookup. - Crowdsourced sentences are echoed back verbatim on exact match (unreviewed — to be fixed).
- No ML model, no generalization to unseen sentences.

2. What the MVP Adds
- Marathi-capable translation model + inference wrapper → verified-lookup fallback → output validation → provenance labels → review workflow → dataset prep/validation → LoRA fine-tuning experiment → automated + human evaluation → latency/version/error logging.

## Objective
A credible AI product prototype demonstrating the full lifecycle (data prep → model selection → inference → fine-tuning → evaluation → human review → failure analysis → cost/latency/accuracy trade-offs). Not production-grade.
The product ≠ the model. It = model + training data + review workflow + eval set + provenance + monitoring + UX + release process.

3. Product Goal & Promise
A user enters a sentence in English or Thanjavur Marathi and gets a useful translation the other way, that:

- Handles previously unseen short sentences and preserves meaning.
- Labels whether the answer is a verified phrase or AI output.
- Accepts corrections; never lets unreviewed submissions become authoritative.
- For EN→Marathi, output must be Thanjavur dialect, not generic Marathi.

- Result must display: original input · detected/selected source lang · target lang · translation · provenance · model version (if applicable) · feedback controls · warning when AI-generated & unverified.
Provenance labels (fixed set): verified_lookup · ai_generated · community_suggestion · human_corrected · translation_error.

4. Scope
In scope:
- EN ↔ Thanjavur Marathi text translation.
- English STT (input) — already implemented; keep.
- English TTS (output) — when translating Thanjavur Marathi → English, play the English result as audio ("translate by voice"). Simple, because English TTS is widely available.
- Marathi-capable pretrained model + inference service; integrate existing exact-match lookup.
- Review statuses (approved/rejected/pending); data cleaning, dedup, train/val/test split; ~300-pair reviewed eval set.
- LoRA fine-tuning experiment; base vs fine-tuned comparison; quality + operational metrics.
Feedback workflow; evaluation dashboard/report; docs + demo.

Out of scope (core MVP):
- Thanjavur Marathi STT (user speaking Thanjavur Marathi into Translate tab).
- Thanjavur Marathi TTS (audio for Marathi output on EN→Marathi). Blocked: needs more Thanjavur Marathi voice samples — collect these before attempting.
- Real-time voice translation; long-document, legal/medical/safety-critical translation; autonomous data approval; custom tokenizer; training from scratch; enterprise multi-user admin; production-scale serving; automated dialect-authenticity claims.

Stretch (only after core MVP): reviewer analytics; model-quality dashboard.

5. Assumptions (override only if repo says otherwise)

Working translate screen and phrase lookup exist; wrap lookup behind a service/repository layer.
5,000 words = glossary/lexicon; 2,000 sentences may be noisy/unreviewed.
Dialect represented via the model's Marathi config; Devanagari default script unless data shows otherwise.
Detect + log Romanized/mixed script. Fine-tune with LoRA. Introduce a separate Python service only if the current backend can't host the model.
Thanjavur Marathi is low-resource: models may emit standard Marathi → human review is mandatory.

6. Architecture
Inference path:
input (text / English STT) → lang & script selection → normalize → verified lookup → model (if no match) → output validation → response w/ provenance → [English TTS if target=English] → feedback/correction
Data loop:
contribution → pending queue → human review → approved pair → train/val/eval dataset → experiment → evaluation → release decision

7. Model Strategy

- Primary: Marathi-capable Indic model (e.g., IndicTrans2). Verify current install steps + language codes (Marathi ≈ mar_Deva, checkpoint-dependent). Centralize all lang codes/model values in config — never hardcode.
- Backup: NLLB-200 Marathi checkpoint or another stable OSS model if primary can't run within 1 working day.
Freeze model choice by end of Week 2. Don't burn the month comparing models.

Model adapter must: load once at startup (no per-request download) · support both directions · accept configurable generation params · return model version + latency · return structured errors · run CPU (dev) and GPU (fine-tune) · stay isolated from business logic.

8. Repo Discovery (do first, no file changes)
Produce a written inventory: app/frontend/backend entry points · translate & crowdsourcing files · data storage · phrase-lookup logic · DB schema · API endpoints · tests · deployment config · env files · dataset files · auth · logging.

9. Suggested Layout (adapt to existing conventions)
Unknowndocs/        spec, model card, dataset card, eval report, failure-mode catalogue
data/raw/    original corpus + crowdsourced sentences (never overwrite)
data/processed/  normalized, deduped, train/val/test
data/evaluation/ reviewed benchmark + human results
scripts/     audit, normalize, dedup, split, evaluate, finetune
services/translation/  model adapter, lookup, routing, validation
api/         translate, feedback, review endpoints
tests/       data, translation, api, evaluation
configs/     model + evaluation config


10. Data Model
Canonical record fields: id · source_text · target_text · source_language · target_language · source_script · target_script · dialect · domain · review_status · reviewer_id · source_type · quality_score · split · created_at · updated_at · dataset_version.

review_status: pending_review · approved · rejected · needs_adjudication · evaluation_only · training_only
source_script: English · Devanagari · Romanized · Tamil · mixed
source_type: crowd · expert · imported · synthetic · user_correction

Rules: never overwrite raw data · store normalized data + reviewer decisions separately · keep rejected records for audit · a record can't be in test if used in training · both directions of a pair stay in the same split · log every transformation.
11. Data Audit
Script that reports: total words/sentences · missing source/target · empty strings · exact & near duplicates · mixed scripts · over-long sentences · unsupported chars · possible PII · missing review status/direction · likely reversed pairs · multiple/conflicting translations per source. Output a human-readable report.
Quality rules: pairs need both texts + explicit languages + explicit direction; source≠target unless allowed; keep names/numbers/dates; PII never goes into external model prompts; unreviewed crowd data is not a gold reference.
12. Lexicon Usage
Use the 5,000 words as glossary + validation only: show definitions, detect dialect terms, check term preservation, flag unknown vocab, build per-word test cases, flag standard-Marathi terms in output.
Do NOT word-substitute before translation (breaks grammar, order, tense, case, gender, politeness, idioms, entities).
13. Cleaning & Normalization
Repeatable pipeline: trim/collapse whitespace, normalize line breaks + Unicode, preserve punctuation/numbers/entities, don't lowercase Marathi, don't silently transliterate, record every transform. Explicitly detect English/Devanagari/Romanized/Tamil/mixed/unknown; on unsupported script return a clear message, not garbage. Keep Romanized handling a separate, script-tracked module.
14. Dedup & Split Prevention
Exact + normalized + source-target + near-duplicate detection; grouped train/val/test split so a sentence never trains in one direction and tests in the reverse.
15. Evaluation Set
~300 reviewed pairs covering: statements/questions/commands/negations · past/present/future · singular/plural · formal/informal · numbers/dates/names/places · food/household · idioms · code-switching · short/long · dialect-specific vocab.
Rules: reviewed · never used in training · versioned · changes documented · comparable across model versions. No fluent reviewer → label the whole project an AI-assisted prototype, not a validated translator.

16. Baselines (evaluate 3 systems)

A – Existing lookup: exact-match coverage, % unseen failures, latency, % approved vs unreviewed, retrieval quality.
B – Pretrained model (no fine-tune): meaning, fluency, dialect authenticity, latency, failure modes, handling of names/numbers/negation/unseen.
C – Hybrid: approved lookup + fine-tuned model + glossary checks + feedback + provenance. This is the recommended MVP unless eval says otherwise.

17. Routing Logic

Validate input → 2. Determine direction → 3. Normalize → 4. Exact approved-lookup search → 5. Match ⇒ return verified_lookup → 6. No match ⇒ call model → 7. Validate output → 8. Return ai_generated → 9. Offer unreviewed matches only as community_suggestion → 10. Allow correction.
Never: return unreviewed crowd data as official · label AI as verified · show uncalibrated confidence % · hide failures · auto-add corrections to training · promote model output to approved phrase without review.

18. API (adapt to existing conventions)

POST /translate — req: text, source_lang, target_lang, optional mode, optional include-community. resp: original, normalized, translation, source/target lang, provenance, model name+version, dataset_version, latency, verified_used flag, validation warnings, error info.
POST /translation-feedback — req: translation_request_id, feedback_type, corrected_translation, optional issue category, optional reviewer/contributor id, timestamp. Types: correct · incorrect · unnatural · wrong_dialect · wrong_meaning · missing_content · wrong_tense · wrong_number · wrong_entity · other.
GET /review-queue · POST /review-queue/{id}/approve|reject|adjudicate — authorized reviewers only.

19. Output Validation (flag, never silently rewrite)
Check: empty · over-long / abnormally short · unchanged when it shouldn't be · wrong script · missing numbers/entities · dropped negation · unsupported chars · error markers · repeated phrases.

20. Fine-Tuning (LoRA / PEFT only — no full fine-tune)

Exp 1: pretrained on held-out eval, record all metrics.
Exp 2: LoRA on cleaned/reviewed pairs, fixed val set, eval per epoch, save best checkpoint, record config + dataset_version.
Exp 3: hybrid product system.

Starting settings (change one thing at a time): 3–5 epochs · small LR · small batch + grad accumulation · mixed precision if available · max_len ≈128 · early stopping · best-checkpoint selection.
Keep fine-tuned model only if it improves human-rated quality without unacceptable regression in critical-meaning errors, latency, stability, script correctness, or generalization. If it's worse, keep pretrained and document it — that's a valid result.
21. Tokenizer
Don't extend it first. Measure tokens/sentence, dialect-word fragmentation, unknown chars. Consider changes only if key terms fragment badly / script is poorly represented / enough data exists / feasible within the month. Optional — must not block MVP.
22. Metrics
Automated: chrF/chrF++ (primary), BLEU (regression only), COMET (optional, directional).
Human (0–2 each): meaning preservation · fluency · dialect authenticity · terminology · completeness.
Critical error flags (track separately): wrong negation/tense/person/number/entity · invented content · missing content · wrong dialect term · script failure · untranslated text · offensive/inappropriate output.
Operational: p50/p95 latency · model load time · error rate · lookup coverage · AI fallback rate · acceptance rate · correction rate · review turnaround · cost per 1k chars/requests · model + dataset version.
23. MVP Targets (working, not universal)
≥85% meaning preservation on simple reviewed sentences · <5% critical errors on test set · ≥15pt human-naturalness gain fine-tuned vs pretrained (if data supports) · p95 text latency <3s · provenance on every result · no unreviewed authoritative output · reproducible version comparison · documented failure-mode catalogue. If unmet, report honestly and explain why.

24. Human Review Workflow
Submission → pending_review → reviewer sees source/current/proposed + metadata → approve/reject/adjudicate → approved becomes lookup-eligible + possible training data → evaluation_only stays out of training → every decision logged.
Reviewer screen: source · proposed target · dictionary terms · model output · user submission · direction · script · domain · contributor · approve/reject controls · rejection reason · adjudication notes.
25. UI Changes
Translate tab: source/target selectors · input area · translate button · English STT mic (existing) · loading state · result · provenance label · model version · latency · feedback controls · community-suggestion section (with unreviewed warning) · "Play in English" TTS button shown only when target = English.
Contribute tab: source · proposed translation · submission + review status · reviewer feedback · edit-previous ability · clear "requires review" message.
Behavior: don't block UI on model load · clear loading state · actionable errors (no stack traces) · never imply AI is authoritative · preserve existing design language.
26. Logging & Observability
Per request: id · timestamp · direction · input/output length · provenance · model + dataset version · latency · error category · feedback status. No PII unless explicitly approved.
Dashboard: requests by direction · lookup vs AI · avg/p95 latency · error rate · feedback + correction rate · categories · version comparison · eval scores · top failure modes.
27. Tests
Unit: direction/empty-input validation · script detection · normalization · lookup (approved vs not) · routing · provenance · model-failure handling · output validation · feedback creation · status transitions.
Integration: translate req/resp · lookup fallback · model fallback · feedback submit · review approve/reject · dataset export · eval run.
Regression (fixed set): statements · questions · negation · tense · numbers · names · dialect vocab · unseen · mixed script · long sentences. Run whenever model/lookup/preprocessing changes.

28. Config (externalize all)
model name/version · dataset version · source/target lang + lang codes · max input/output len · temperature · beam size · lookup on/off · fallback on/off · logging level · review on/off · device · cache location. No hardcoded secrets; no weights/private data in Git.

29. Four-Week Plan
W1 Data & baseline: repo inventory · audit report · canonical schema · cleaned dataset · dedup report · initial ~300 benchmark · lookup baseline metrics · pretrained feasibility test.
W2 Model integration: adapter (load at startup) · both directions · lookup routing + AI fallback · /translate API · provenance + version metadata · latency logging · error handling · base-model eval · freeze model.
W3 Fine-tune & eval: LoRA pipeline · fine-tuned adapter · base-vs-tuned comparison · automated metrics · human rubric · per-epoch eval + best checkpoint · failure-mode catalogue · document regressions.
W4 Productize & demo: hybrid routing · review queue · feedback workflow · English TTS on output · dashboard/report · model card · dataset card · cost/latency analysis · final benchmark + regression tests · 5-min demo · decide fine-tune keep/drop · next-phase roadmap.

30. Definition of Done
[ ] Existing app still works
[ ] EN→Marathi and Marathi→EN work
[ ] Unseen short sentences reach the model
[ ] Approved lookup preserved; unreviewed crowd data never authoritative
[ ] Provenance visible; model + dataset versions tracked
[ ] Input validation + model-failure handling exist
[ ] Latency measured
[ ] Audit + dedup done; train/val/test separated; reversed pairs same split
[ ] Reviewed test set exists; base-model eval done
[ ] Fine-tune experiment done or documented as blocked
[ ] Human rubric + automated metrics exist; failure modes documented
[ ] Feedback submittable; review status changeable
[ ] English TTS plays on English output
[ ] Automated tests pass; 5-min demo possible; next-phase roadmap exists

31. Risks & Mitigations
Risk
Mitigation

Noisy crowd data
Human review + status routing

Too little dialect data
Position as prototype; collect reviewed data

Model emits standard Marathi
Human dialect eval + glossary checks

Split data leakage
Grouped split + dedup

Fine-tune overfits
Early stopping + held-out val

Unsupported script
Explicit detection + user message

Model too slow
Load once, measure p95, smaller checkpoint

Model too costly
Compare local vs hosted inference

Reviewer disagreement
Adjudication workflow

Unreviewed data goes authoritative
Strict review-status routing

PII to external model
Avoid sensitive data; verify approved tooling

Speech scope creep
Keep TM STT/TTS out; only English STT+TTS

Not enough TM voice samples
Blocks TM TTS — collect samples before future speech work

32. Cost/Latency/Accuracy Trade-offs

Approach
Accuracy
Cost
Latency
Risk


Approved lookup
High (known)
Very low
Very low
No generalization


Pretrained OSS
Moderate
Low
Moderate
Standard Marathi


LoRA fine-tuned
Potentially higher
Low–mod
Moderate
Overfitting


Large hosted
Potentially high
Usage-based
Variable
Cost/dependency


Hybrid
High known / mod new
Moderate
Moderate
Routing complexity


Recommended MVP: approved lookup + Marathi-capable pretrained model + LoRA experiment + human review + English STT/TTS.
33. Release Criteria
Release only if: model handles unseen sentences · users can tell verified from AI results · review workflow blocks unreviewed authoritative output · eval set held out from training · quality + latency measured · failure modes visible · team can explain model choice, whether fine-tuning helped, and what's next.
The success test isn't "impressive" — it's that the product can answer: When does this work, when does it fail, how do we know, and what next?