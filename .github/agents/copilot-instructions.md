# Local IndicTrans2 Integration Instructions

## 1. Project objective

Integrate AI4Bharat IndicTrans2 as a locally running, backend-only translation service.

The current phase is intentionally simple:

- No fine-tuning
- No LoRA
- No custom model training
- No prompt engineering
- No hosted translation API
- No Thanjavur Marathi claims
- No changes to the existing speech-to-text provider unless required for integration

IndicTrans2 will initially produce standard Marathi.

The application must clearly label its output as AI-generated standard Marathi and must not represent it as Thanjavur Marathi.

## 2. Required translation flow

Preserve the existing application behavior and add IndicTrans2 only as a fallback.

The intended flow is:

1. The user types English or speaks English.
2. Existing speech-to-text converts audio into English text.
3. The application validates the English text.
4. Existing approved exact-sentence lookup runs first.
5. Existing approved glossary lookup runs next for single words or supported terms.
6. Existing crowdsourced and legacy behavior remains available according to current application rules.
7. If no verified result is found, the backend calls local IndicTrans2.
8. The frontend displays the translation and its source category.
9. Every translation response includes latency and model metadata.

Do not remove or silently change existing lookup, crowdsourcing, glossary, or word-by-word functionality.

## 3. Repository inspection before coding

Before creating or modifying files:

- Inspect the complete repository structure.
- Identify the frontend framework.
- Identify the backend framework.
- Identify the current translation endpoint.
- Identify the current translation service or utility.
- Identify the existing glossary lookup.
- Identify the existing crowd-sourced lookup.
- Identify the existing word-by-word fallback.
- Identify the English speech-to-text integration.
- Identify environment-variable loading.
- Identify test commands.
- Identify local development and deployment commands.
- Identify whether Python is already used.
- Identify whether a separate Python service is necessary.

Do not make implementation changes during the first inspection.

If the application already has a Python backend, prefer an isolated IndicTrans2 module inside that backend.

If the application uses Node.js, TypeScript, Java, or another non-Python backend, create a small separate Python translation service only if needed. Do not create a second backend unnecessarily.

Explain the architecture choice before implementing it.

## 4. Local-only architecture

IndicTrans2 must run locally or on the application's controlled server.

The application must not call a hosted Hugging Face inference API during normal translation.

Hugging Face Hub may be used only for the initial model download, unless the project explicitly requires another approved model distribution method.

The preferred architecture is:

- Existing frontend
- Existing application backend
- Local IndicTrans2 Python service or isolated Python module
- Local model files stored outside source control
- Backend-to-model communication only
- No direct frontend-to-model communication

The frontend must never receive:

- Hugging Face tokens
- Model access tokens
- Internal model paths
- Python stack traces
- Internal server errors
- Private configuration values

## 5. Model configuration

Use the current official AI4Bharat IndicTrans2 model repository and verify the exact repository name against the current official model documentation before implementation.

The initial English-to-Marathi model should default to:

`ai4bharat/indictrans2-en-indic-dist-200M`

Use these language codes:

- English: `eng_Latn`
- Marathi: `mar_Deva`

For the first milestone, implement English-to-Marathi only unless the existing application already requires reverse translation.

If reverse translation is implemented, verify the current official IndicTrans2 Indic-to-English model identifier before adding it. Do not guess or invent a model name.

The tokenizer must come from the same model repository as the model checkpoint.

Do not use a different tokenizer unless the official model documentation specifically requires it.

## 6. Model download behavior

Create a one-time model bootstrap or download command.

The bootstrap process must:

- Download the configured model files.
- Download the matching tokenizer files.
- Store them in a local model directory.
- Avoid storing model files in Git.
- Print the local model directory after a successful download.
- Fail with a clear message if the model cannot be downloaded.
- Never print an authentication token.
- Support an optional Hugging Face token through a server-side environment variable.

After the initial download, production or offline runtime should load the model from the local model directory.

Do not silently download a model during every translation request.

Add the model directory to `.gitignore`.

Use a configurable model directory rather than hardcoding a user-specific computer path.

## 7. Authentication and secrets

Do not assume that an API key is required for local inference.

Support an optional server-side `HF_TOKEN` environment variable only when needed for model download or repository access.

Never place `HF_TOKEN` in:

- Frontend source code
- Browser JavaScript
- Public frontend environment variables
- Variables beginning with `PUBLIC_`
- Variables beginning with `NEXT_PUBLIC_`
- Local storage
- Session storage
- Git commits
- Test fixtures
- Logs
- API responses
- Copilot prompts

Create or update `.env.example` with placeholder variable names only.

Do not create a real `.env` file containing a secret.

Add a startup validation that confirms whether the token exists without printing its value.

## 8. Environment configuration

Use environment variables for all deployment-dependent configuration.

Support configuration equivalent to:

- `HF_TOKEN`
- `INDICTRANS_EN_INDIC_MODEL`
- `INDICTRANS_MODEL_DIR`
- `INDICTRANS_DEVICE`
- `INDICTRANS_MAX_INPUT_LENGTH`
- `INDICTRANS_MAX_OUTPUT_LENGTH`
- `INDICTRANS_ENABLED`
- `INDICTRANS_SERVICE_URL`, if a separate Python service is used

The default device should be automatic:

- Use CUDA when properly available.
- Otherwise use CPU.
- Do not make GPU hardware mandatory for local development.

The initial default model is the 200M distilled English-to-Indic model, subject to official model-name verification.

## 9. Official model processing requirements

Use the official IndicTrans2 processing pattern.

The implementation must:

- Load the matching tokenizer.
- Load the configured model.
- Use the official `IndicProcessor` or current equivalent from `IndicTransToolkit`.
- Preprocess the input with the correct source and target language codes.
- Tokenize the preprocessed input.
- Generate the translation.
- Decode the output correctly.
- Postprocess the result using the official toolkit flow.

Verify the exact current import name and API from the installed IndicTransToolkit package and official examples.

Do not guess the toolkit API.

Use `trust_remote_code` only when required by the official AI4Bharat model implementation and only for the configured official model repository.

Document why it is required.

Do not enable arbitrary remote code execution for user-provided or untrusted model repositories.

## 10. Model lifecycle

Load the model and tokenizer once per process.

Use a safe singleton, startup loader, or equivalent lifecycle mechanism.

Do not load, download, or initialize the model for every request.

Put the model into evaluation mode after loading.

Use inference-only execution for translation requests.

Ensure the model-loading logic is safe if multiple requests arrive at the same time.

If model startup is slow, expose a health state that distinguishes:

- Service not started
- Model loading
- Model ready
- Model failed

## 11. Translation generation behavior

The first baseline must be deterministic and reproducible.

Use settings equivalent to:

- Sampling disabled
- One returned sequence
- Beam search enabled
- A reasonable beam count
- A reasonable maximum output length

Do not add temperature as a dialect-control mechanism.

Do not claim that temperature can make standard Marathi become Thanjavur Marathi.

Record the generation settings used for every experiment or baseline comparison.

## 12. Backend translation interface

Create one isolated backend translation function or service.

Use the existing application conventions for naming and error handling.

The service should accept:

- Input text
- Translation direction
- Input source, such as typed or speech
- Optional request identifier

For the initial direction, support:

- `eng_Latn` to `mar_Deva`

Validate:

- Empty input
- Whitespace-only input
- Unsupported direction
- Maximum input length
- Malformed request data

Return a structured result containing equivalent information:

- `translated_text`
- `source_type`
- `verification_status`
- `model_name`
- `model_version`
- `source_language`
- `target_language`
- `latency_ms`
- `input_source`
- `warning`
- `error_code`, when applicable

Do not expose stack traces or secrets to the frontend.

## 13. Source categories

Use explicit source categories.

The initial categories should distinguish:

- `verified_sentence`
- `verified_glossary`
- `base_indictrans2_marathi`
- `crowdsourced_unreviewed`
- `legacy_word_by_word`
- `translation_error`

Use `base_indictrans2_marathi` for the current IndicTrans2 result.

Do not use `tm_adapter_ai` until a Thanjavur Marathi model has actually been trained and evaluated.

Do not classify a result as Thanjavur Marathi merely because it came from a Marathi-capable model.

## 14. Routing priority

Preserve the application's existing logic, but use this priority unless the repository already has an equivalent approved rule:

1. Validate the input.
2. Determine the translation direction.
3. Search for an approved exact sentence.
4. Search the approved glossary when applicable.
5. Preserve existing approved or reviewed crowd behavior.
6. Call local IndicTrans2 when no verified result exists.
7. Use the existing legacy fallback only according to current application behavior.
8. Return a source category for every result.

Never silently overwrite a verified result with an AI-generated result.

Never silently present an unreviewed crowd result as verified.

## 15. Standard Marathi warning

When the result comes from the base model, return a warning equivalent to:

“AI-generated standard Marathi. This result has not been adapted for Thanjavur Marathi.”

The frontend should display a friendly label equivalent to:

“AI-generated standard Marathi”

The user should be able to distinguish:

- Verified stored translation
- Verified glossary result
- AI-generated standard Marathi
- Unreviewed community suggestion
- Legacy word-by-word result

## 16. Speech-to-text integration

Keep the existing English speech-to-text integration unchanged unless a small adapter is required.

IndicTrans2 receives text, not audio.

The flow must remain:

- Audio input
- Existing English speech-to-text
- English transcript
- Existing translation route
- Local IndicTrans2 fallback when needed

Record `input_source` as either:

- `typed`
- `speech`

Track speech-to-text timing separately from translation timing.

Do not attribute speech-recognition errors to IndicTrans2.

## 17. Observability and logging

Measure separately:

- Model download time
- Model load time
- Translation inference time
- Total backend request time
- Speech-to-text time
- Lookup time
- Model fallback rate
- Lookup hit rate
- Translation error rate

For each translation request, log only information allowed by the repository's privacy rules.

Useful metadata includes:

- Request identifier
- Direction
- Input source
- Input character count
- Output character count
- Source category
- Model name
- Model version, when available
- Device
- Latency
- Success or failure
- Error category

Do not log:

- Authentication tokens
- Full sensitive user text unless already permitted by the project
- Audio
- Internal stack traces in user-facing responses

## 18. Error handling

Create friendly errors for:

- Missing model files
- Failed model download
- Failed model loading
- Missing optional authentication
- Invalid language direction
- Empty input
- Input too long
- Translation timeout
- Out-of-memory failure
- Unexpected model output

If IndicTrans2 fails, preserve the existing fallback behavior where appropriate.

The frontend must receive a usable error category, not a raw exception.

Do not silently substitute a hosted translation API.

## 19. Testing requirements

Create unit tests that do not download the model.

Mock or isolate model inference for:

- Empty input
- Invalid direction
- Successful translation
- Model failure
- Timeout
- Fallback routing
- Source-category assignment
- Secret masking

Create a separate live smoke test that requires the local model files.

The live smoke test should:

- Load the local model.
- Translate at least 10 English sentences into Marathi.
- Print or save the output.
- Report latency.
- Report model name and device.
- Avoid printing secrets.
- Clearly state that the result is standard Marathi.

Use typed English test inputs first.

Then test the same route with English speech-to-text output.

## 20. Acceptance criteria

The implementation is complete only when all of the following are true:

- The model can be downloaded once.
- The model files are excluded from Git.
- The tokenizer loads from the matching checkpoint.
- The model loads once per process.
- Local translation works without a hosted inference API.
- English-to-Marathi translation works using `eng_Latn` and `mar_Deva`.
- Existing approved lookup behavior still works.
- IndicTrans2 is used only when appropriate.
- Every result has a source category.
- Base-model results are labelled standard Marathi.
- No result is falsely labelled Thanjavur Marathi.
- The frontend never receives the Hugging Face token.
- Model load time and inference time are measured separately.
- Unit tests pass without downloading the model.
- The live smoke test works when local model files are available.
- The application has a clear recovery path when the model is unavailable.

## 21. Copilot working rules

Work in small, reviewable phases.

Before changing files:

- Explain the proposed files.
- Explain the proposed architecture.
- Identify assumptions.
- Identify risks.
- Identify commands that will be run.

After changing files:

- Summarize each changed file.
- Explain how to run the change.
- Explain how to test the change.
- Report unresolved errors.
- Do not claim success without running or describing the relevant test.

Do not rewrite unrelated application code.

Do not rename existing public API fields unless necessary.

Do not create fake model outputs or fake API responses.

Do not invent a Thanjavur Marathi model.

Do not implement fine-tuning in this phase.

Do not add a hosted API fallback.

Do not put secrets in source code.

Do not proceed to the next phase until the current phase is working.

## 22. Required implementation phases

Implement in this order:

### Phase 1: Repository audit

Inspect the repository and produce an architecture summary.

Make no code changes.

### Phase 2: Local model bootstrap

Add the model download process, local model directory configuration, dependency changes, and a live smoke test.

### Phase 3: IndicTrans2 service

Add model loading, tokenizer loading, official preprocessing, inference, postprocessing, validation, and error handling.

### Phase 4: Backend integration

Add IndicTrans2 after the existing approved lookup path.

Preserve the existing API response compatibility.

### Phase 5: Frontend display

Display the translation, source category, standard Marathi warning, and latency.

### Phase 6: Testing and documentation

Add tests, run the smoke test, document setup, and document known limitations.

Stop after each phase and report the result.