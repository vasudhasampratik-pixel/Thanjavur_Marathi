# Copilot Agent Task: Upgrade Thanjavur Marathi Translator

## 1. Mission

Upgrade the existing Thanjavur Marathi translation application from a basic word-matching translator into a corpus-grounded translation experience.

The first version must:
1. Preserve the existing local JSON word-matching translation behavior.
2. Read the existing crowdsourced sentence data from Firebase Firestore.
3. Return exact verified crowdsourced sentences whenever the English input matches an existing crowdsourced sentence.
4. Display both:
   - Romanised Thanjavur Marathi
   - Devanagari Thanjavur Marathi
5. Add user feedback controls after every translation.
6. Clearly distinguish between:
   - Exact crowdsourced translations
   - Local JSON word-matching results
   - Future AI-generated drafts
7. Avoid introducing AI-generated sentence formation in the first implementation unless an existing, approved AI integration already exists in the codebase.

The immediate objective is trustworthy retrieval of known Thanjavur Marathi sentences, not an over-engineered AI translation system.

## 2. Important Agent Operating Instructions

Before changing code:

1. Inspect the entire repository structure.
2. Identify:
   - Application framework and entry point
   - Translation screen and components
   - Existing local JSON translation dataset
   - Firebase initialization
   - Firestore read and write logic
   - Crowdsourcing screen and submission flow
   - Current authentication flow
   - Existing styling and component conventions
3. Search for all references to likely Firestore fields, including:
   - `promptEnglish`
   - `translation`
   - `audioUrl`

4. Reuse existing project conventions wherever possible.
5. Do not rewrite unrelated components.
6. Do not replace the existing JSON translation logic.
7. Do not add an AI provider, model, or API key unless the repository already contains an approved integration.
8. Do not expose service-account credentials or private Firebase credentials in client-side code.
9. Do not weaken Firestore security rules automatically.
10. Do not use browser local storage or session storage for the initial implementation. Use in-memory caching only.
11. Do not create a large abstraction layer for a simple retrieval feature.
12. Do not commit changes unless explicitly requested.
13. After each logical implementation phase, summarize:
    - Files changed
    - Why they changed
    - Assumptions made
    - Tests run
    - Remaining risks

If the repository does not contain enough information to determine the Firestore collection or schema, make the smallest reasonable assumption, document it, and create a clearly named configuration point rather than scattering assumptions throughout the code.
---

## 3. Current Product Context
The application is a simple English-to-Thanjavur-Marathi translator.
Current capabilities:
- Text input
- Voice input
- English input
- Romanised Thanjavur Marathi output
- Devanagari Thanjavur Marathi output
- Local JSON dataset used for word-level key-value matching
- Crowdsourcing tab where users contribute:
  - `promptEnglish`
  - Romanised Thanjavur Marathi
  - Devanagari Thanjavur Marathi
  - Optional pronunciation voice/audio
- Firebase Authentication
- Firebase Firestore
- Deployment through GitHub Pages

Current limitations:
- The local JSON file supports word matching, not reliable sentence formation.
- Sentence-level translation is currently weak or unavailable.
- Thanjavur Marathi has a limited digital corpus.
- More than 1,500 crowdsourced sentence entries already exist in Firebase.
- The translation screen currently does not fully use the existing Firebase sentence corpus.
- User feedback after translation is not yet implemented.
---

## 4. Product Principle

Use the following source-of-truth hierarchy:
| Priority | Source | Intended use | Trust label |
|---|---|---|---|
| 1 | Approved crowdsourced sentence in Firestore | Exact English sentence match | Verified community translation |
| 2 | Existing local JSON dataset | Word-level or phrase-level fallback | Word-based result |
| 3 | Future AI sentence generation | Completely new sentences | AI-generated draft |
| 4 | No result | When no reliable result exists | Not available |

Do not silently present a word-matching result as a grammatically correct sentence translation.

Do not silently invent a translation when no exact crowdsourced result exists.
---

## 5. Required User Experience

### 5.1 Translation flow

Implement the following flow:

1. User enters English text or provides voice input.
2. The application converts voice input to text using the existing voice-input implementation.
3. The translation orchestrator receives the English text.
4. The orchestrator normalizes the input.
5. The orchestrator checks the Firebase crowdsourced sentence corpus for an exact match.
6. If an exact approved match exists:
   - Return the exact stored Romanised translation.
   - Return the exact stored Devanagari translation.
   - Do not modify the stored translation through an AI model.
   - Label the result as `Verified community translation`.
7. If no exact crowdsourced match exists:
   - Run the existing local JSON word-matching logic.
   - Preserve the existing behavior.
   - Label the result as `Word-based result`.
8. If neither method produces a meaningful result:
   - Show an honest no-result state.
   - Do not fabricate a sentence.
9. Display feedback controls below every result.
10. Record non-sensitive analytics for the translation journey.

### 5.2 Result labels

Use clear user-facing labels such as:

- `Verified community translation`
- `Word-based result`
- `No exact sentence found`
- `AI-generated draft` only if a future AI feature is explicitly enabled

The labels must not imply a quality level that the application cannot support.

### 5.3 Loading and error states

The translation screen must visibly handle:

- Loading the Firebase corpus
- Searching the Firebase corpus
- Running local word matching
- Firebase unavailable
- Authentication unavailable
- No match
- Malformed crowdsourced record
- Missing Romanised output
- Missing Devanagari output
- Voice-input failure
- Feedback submission failure

Avoid blank screens and silent failures.

---

## 6. Firebase Data Discovery

### 6.1 Inspect the existing implementation first

Find the code that writes crowdsourced submissions to Firestore.

Determine:

- Collection name
- Document ID format
- Field names
- Whether documents include approval status
- Whether documents include moderation status
- Whether the fields are optional
- Whether submissions belong to a user
- Whether timestamps are stored
- Whether audio is stored as a URL, binary data, or another reference

Reuse the current collection and schema where possible.

### 6.2 Expected logical record

Do not assume the physical Firestore field names exactly match this structure. Create a schema adapter that maps the real Firestore record into a normalized application object.

The application-level record should conceptually contain:

| Field | Required | Purpose |
|---|---:|---|
| `id` | Yes | Firestore document ID |
| `englishText` | Yes | Original English prompt |
| `englishNormalized` | Recommended | Normalized lookup key |
| `romanisedText` | Recommended | Romanised Thanjavur Marathi |
| `devanagariText` | Recommended | Devanagari Thanjavur Marathi |
| `audioUrl` | No | Pronunciation audio reference |
| `status` | Recommended | Approval or moderation state |
| `createdAt` | No | Creation timestamp |
| `updatedAt` | No | Last update timestamp |
| `contributorId` | No | User reference, if already supported |

The schema adapter must support the spelling variations already present in the repository.

Do not silently discard records because one optional field is missing. Instead:

- Exclude records with no usable English prompt.
- Allow a record with only one Marathi script to remain searchable.
- Display an appropriate missing-output state.
- Log a structured data-quality event without logging unnecessary personal information.

### 6.3 Approved-record filtering

Use only records intended for public translation retrieval.

Possible indicators include:

- `status == approved`
- `approved == true`
- Existing moderation state
- Existing application convention

If the current system has no moderation or approval field:

1. Do not invent a new moderation workflow in V1.
2. Use the existing application behavior only if the collection is already public and intended for display.
3. Document the assumption clearly.
4. Add a follow-up recommendation to introduce moderation before large-scale public launch.

Do not change Firestore rules automatically to make the query work.

---

## 7. Exact Sentence Matching

### 7.1 Normalization requirements

Create one reusable normalization utility for English lookup.

The utility should:

1. Apply Unicode normalization.
2. Convert text to lowercase.
3. Trim leading and trailing whitespace.
4. Collapse repeated internal whitespace.
5. Normalize common apostrophe variants.
6. Normalize common dash variants.
7. Handle repeated punctuation consistently.
8. Preserve meaningful numbers and words.
9. Avoid aggressive transformations that could merge different sentences.
10. Return an empty key for empty or whitespace-only input.

Keep the original user input unchanged for display and feedback.

Maintain both:

- A strict normalized key
- A relaxed normalized key only if needed

The first implementation should prefer precision over recall. An incorrect exact match is worse than a no-match result.

### 7.2 Lookup behavior

The lookup sequence should be:

1. Normalize the user input.
2. Search the in-memory Firebase corpus index.
3. Match only against usable English prompts.
4. Prefer approved records.
5. If multiple approved records match:
   - Prefer records with both Marathi outputs present.
   - Prefer the existing application’s documented selection rule.
   - Do not randomly select a result.
6. Return the stored Marathi output exactly as it exists in Firestore.
7. Preserve the original punctuation and line breaks in the stored Marathi result.
8. Include the matched Firestore document ID internally for analytics and feedback.
9. Do not expose internal document IDs unless the existing product design requires it.

### 7.3 Exact-match response object

Create a small application-level result structure containing:

- Original English input
- Romanised output
- Devanagari output
- Match type
- Source document ID
- Whether the result is verified
- Optional audio URL
- Lookup latency
- Data-quality warnings

Keep this structure independent of Firestore-specific field names.

---

## 8. Firebase Loading and Caching

### 8.1 Loading strategy

Do not query Firestore on every keystroke.

Use this behavior:

1. Load the crowdsourced corpus when:
   - The translation feature first opens, or
   - The user submits the first translation request
2. Cache the normalized records in memory.
3. Reuse the cache for subsequent translations during the current session.
4. Provide a refresh or retry path when loading fails.
5. Do not persist the corpus in local storage in V1.

The corpus contains more than 1,500 records. A one-time session load may be acceptable if the existing Firestore rules and billing model support it. If the repository already uses pagination, preserve that pattern.

### 8.2 Cost-conscious behavior

Avoid:

- Repeated full collection reads
- Reads triggered by every keystroke
- Multiple duplicate reads from separate components
- Unnecessary writes during translation
- Storing raw audio or raw user text in analytics by default

If the dataset grows materially, document a future optimization:

- Add a denormalized normalized-English lookup field.
- Add a server-side lookup path.
- Add moderation and indexing.
- Add a versioned corpus cache.

Do not implement a migration or server-side architecture change unless required for the existing application to function.

---

## 9. Preserve and Integrate the Existing JSON Translator

The local JSON dataset is currently used for simple key-value word matching.

This behavior must remain available.

### Required behavior

When there is no exact Firebase sentence match:

1. Pass the input through the existing JSON translator.
2. Do not rewrite the JSON format unless necessary.
3. Do not remove existing supported words.
4. Preserve existing Romanised and Devanagari output behavior.
5. Label the result as `Word-based result`.
6. Avoid presenting the result as a verified sentence.
7. If the JSON translator produces no meaningful output, show `No exact sentence found`.

Create a clear translation orchestration boundary:

1. `crowdsourcedSentenceLookup`
2. `localJsonWordMatch`
3. Optional future `aiSentenceDraft`

Do not mix these three mechanisms together in one large UI component.

---

## 10. AI Sentence Formation Boundary

AI sentence formation is a possible future enhancement, but it is not required for the first implementation.

### V1 rule

Do not call an AI model when an exact crowdsourced sentence exists.

Do not add AI sentence generation merely to make the product appear more advanced.

### Future-ready interface

If useful, create a small provider boundary for a future AI translator, but implement it as disabled by default.

The future provider may eventually:

- Use approved Thanjavur Marathi examples as context.
- Generate Romanised output.
- Generate Devanagari output.
- Return a confidence or quality flag.
- Identify that the output is a draft.
- Avoid claiming that the result is community verified.

A future AI-generated result must always be labeled:

`AI-generated draft`

The AI feature must be controlled by a feature flag and must not be enabled globally without evaluation data and cost controls.

---

## 11. Translation Feedback Feature

Add feedback immediately after the translation result.

### 11.1 Required UI

For every result, display:

- Positive feedback control
- Negative feedback control

Use simple, accessible labels such as:

- `Helpful`
- `Needs correction`

After a negative response, reveal an optional form containing:

- Suggested corrected Romanised translation
- Suggested corrected Devanagari translation
- Reason category
- Optional free-text explanation

Suggested reason categories:

- Incorrect meaning
- Grammar or sentence formation
- Spelling
- Romanisation issue
- Devanagari issue
- Missing context
- Audio or pronunciation issue
- Other

The form should not block the user from continuing unless the existing design requires it.

### 11.2 Feedback data

Create or reuse a Firestore collection intended for feedback.

Use a logical feedback record containing:

| Field | Required | Purpose |
|---|---:|---|
| `feedbackId` | Yes | Unique feedback identifier |
| `translationRequestId` | Yes | Links feedback to one translation |
| `rating` | Yes | Positive or negative |
| `reason` | No | Structured reason |
| `suggestedRomanisedText` | No | User correction |
| `suggestedDevanagariText` | No | User correction |
| `matchType` | Yes | Firebase, JSON, or future AI |
| `sourceDocumentId` | No | Matched corpus record |
| `inputType` | Yes | Text or voice |
| `appVersion` | Recommended | Release tracking |
| `createdAt` | Yes | Server timestamp |
| `userId` | No | Authenticated user reference, if appropriate |

### 11.3 Feedback privacy

Do not store raw audio in feedback unless the user explicitly submits it and the application already has a secure audio-storage pattern.

Minimize stored data.

Do not include sensitive user-entered text in analytics events by default.

If the feedback record must include the English input for review, store it only in the protected Firestore feedback collection and follow the existing security rules.

Do not store authentication tokens, private keys, or full user profiles in feedback records.

### 11.4 Feedback behavior

After submission:

1. Disable duplicate submissions for the same result.
2. Show a clear confirmation message.
3. Handle failure without losing the user’s typed correction.
4. Allow retry.
5. Do not silently overwrite the original crowdsourced sentence.
6. Treat user corrections as review candidates, not automatically approved translations.

For an exact crowdsourced result, negative feedback should identify the source document for later review.

For a JSON result, negative feedback should identify the result as word-based.

For a future AI result, feedback should be associated with the AI prompt/model/version metadata.

---

## 12. Analytics and Funnel Events

Add lightweight product analytics using the existing analytics approach, if one exists.

If no analytics framework exists, create an internal event interface without adding a heavy analytics dependency in V1.

### Suggested events

| Event | Trigger |
|---|---|
| `translation_started` | User submits text or voice input |
| `translation_corpus_loaded` | Firebase corpus becomes available |
| `translation_exact_match` | Exact Firestore sentence is returned |
| `translation_json_match` | Local JSON result is returned |
| `translation_no_match` | No usable result is found |
| `translation_completed` | Result is rendered |
| `translation_error` | Translation fails |
| `translation_feedback_opened` | User opens negative feedback form |
| `translation_feedback_submitted` | Feedback is successfully saved |
| `voice_input_started` | User starts voice input |
| `voice_input_completed` | Voice input produces text |
| `voice_input_failed` | Voice input fails |

### Event properties

Use non-sensitive properties such as:

- `inputType`
- `matchType`
- `hasRomanisedOutput`
- `hasDevanagariOutput`
- `hasAudio`
- `latencyMs`
- `corpusLoadStatus`
- `errorCategory`
- `feedbackRating`
- `feedbackReason`
- `appVersion`
- `featureFlagVersion`

Do not send the full English input or full Marathi output to analytics by default.

### Core funnel

Track:

1. Translation screen opened
2. Input submitted
3. Translation completed
4. Result displayed
5. Feedback submitted
6. User returns for another translation

The primary V1 product funnel is:

`translation_started → translation_completed → helpful_feedback_or_repeat_use`

---

## 13. Error Handling and Failure Modes

Implement explicit handling for:

| Failure | Required behavior |
|---|---|
| Firebase unavailable | Use local JSON fallback and explain that verified sentence lookup is temporarily unavailable |
| Firestore permission denied | Show a useful error state; do not bypass rules |
| Empty corpus | Continue with local JSON behavior |
| Malformed Firestore record | Skip that record, record a data-quality event, continue |
| Missing Romanised output | Display Devanagari if available and mark the missing field |
| Missing Devanagari output | Display Romanised output if available and mark the missing field |
| Duplicate English prompts | Apply a deterministic selection rule |
| No exact sentence | Use JSON fallback and label it clearly |
| JSON lookup failure | Show no-result state |
| Voice transcription failure | Allow text entry fallback |
| Feedback write failure | Preserve user input and offer retry |
| Slow corpus load | Show progress state and allow retry |
| Unexpected runtime error | Show recoverable error state and log structured diagnostics |

Never silently convert a failed Firebase lookup into a seemingly verified result.

---

## 14. Performance Requirements

The first implementation should meet these goals:

- No Firestore request on every keystroke.
- No duplicate corpus loading from multiple components.
- Translation result should render promptly after the corpus is loaded.
- Local JSON fallback should remain available when Firebase is unavailable.
- The UI should remain responsive while the corpus is loading.
- Feedback submission should not block further translations.
- Voice and text input should use the same translation orchestration path after text extraction.

Measure and record:

- Corpus load latency
- Exact lookup latency
- JSON fallback latency
- Total translation latency
- Feedback submission latency
- Firebase error rate

Do not optimize prematurely before measuring real behavior.

---

## 15. Implementation Plan

Implement in the following order.

### Phase 0: Repository inspection
Deliver:
- Repository map
- Existing translation flow
- Existing Firebase flow
- Existing crowdsourcing schema
- Existing analytics approach
- Risks and assumptions

Do not modify application behavior in this phase.

### Phase 1: Data adapter
Create a small adapter that converts Firestore documents into application-level sentence records.

Requirements:
- Handle existing field-name variations.
- Exclude records without usable English prompts.
- Preserve document IDs.
- Preserve original translation text exactly.
- Add data-quality warnings where appropriate.

### Phase 2: Normalization and lookup

Create reusable functions for:
- English input normalization
- Corpus indexing
- Exact sentence lookup
- Deterministic duplicate handling

Add unit tests before connecting the lookup to the UI.

### Phase 3: Translation orchestrator
Create a clear orchestration layer:

1. Firebase exact sentence lookup
2. Existing local JSON fallback
3. No-result state
4. Optional future AI provider boundary, disabled by default

The UI should call the orchestrator rather than directly calling Firestore and the JSON translator independently.

### Phase 4: Translation UI
Update the translation screen to:

- Load and cache Firebase corpus
- Display loading states
- Display exact crowdsourced matches
- Preserve JSON fallback
- Display source labels
- Display missing-field states
- Handle Firebase errors
- Handle no-result states

### Phase 5: Feedback
Add:
- Helpful control
- Needs-correction control
- Correction form
- Firestore feedback write
- Success state
- Retry state
- Duplicate-submission prevention

### Phase 6: Analytics and diagnostics

Add the minimum event set needed to understand:
- Whether the Firebase corpus is being used
- How often exact matches occur
- How often users fall back to JSON
- How often users receive no result
- Whether users submit negative feedback
- Whether Firebase failures are affecting the funnel

### Phase 7: Testing and release readiness

Run:
- Unit tests
- Integration tests
- Manual browser tests
- Mobile-layout tests
- Firebase permission tests
- Voice-input tests
- Feedback submission tests

Do not proceed to optional AI sentence generation until this phase is stable.
---

## 16. Acceptance Criteria

The implementation is complete only when all of the following are true.

### Firebase retrieval

- The app reads the existing crowdsourced sentence records from Firestore.
- The app does not read Firestore on every keystroke.
- The corpus is cached during the session.
- The app handles loading and permission errors.
- Only records intended for public retrieval are used.

### Exact matching

- A known English crowdsourced sentence returns the exact stored Romanised translation.
- The same sentence returns the exact stored Devanagari translation.
- Matching tolerates reasonable case and whitespace differences.
- Matching does not aggressively merge unrelated sentences.
- Duplicate matches follow a deterministic rule.
- Exact matches do not call an AI model.

### JSON fallback

- Existing local JSON word matching continues to work.
- JSON results are clearly labeled as word-based.
- JSON behavior is used when no exact Firebase sentence exists.
- The app does not claim that a JSON word match is a verified sentence.

### Feedback

- Every displayed result has feedback controls.
- Negative feedback can include a correction.
- Feedback is stored with match type and source information.
- Duplicate submissions are prevented.
- Feedback errors are recoverable.
- Original translation records are not automatically overwritten.

### Reliability

- Firebase failure does not break the entire translator.
- Voice-input failure has a text-input fallback.
- Missing translation fields are handled visibly.
- No private credentials are exposed.
- No unrelated functionality is broken.

### Observability

- Translation start and completion are measurable.
- Exact Firebase matches are measurable.
- JSON fallback usage is measurable.
- No-result usage is measurable.
- Feedback submission is measurable.
- Raw user text is not sent to analytics by default.

---

## 17. Test Cases

Create tests for at least the following cases:

1. Exact sentence with standard capitalization.
2. Exact sentence in lowercase.
3. Exact sentence with leading whitespace.
4. Exact sentence with trailing whitespace.
5. Exact sentence with repeated spaces.
6. Sentence with a different apostrophe character.
7. Sentence with terminal punctuation.
8. Empty input.
9. Whitespace-only input.
10. Exact match with Romanised output only.
11. Exact match with Devanagari output only.
12. Exact match with both outputs.
13. Duplicate English prompts.
14. Unapproved or hidden record.
15. Malformed Firestore record.
16. Firebase permission error.
17. Firebase network error.
18. Empty Firestore corpus.
19. No Firebase match with successful JSON word match.
20. No Firebase match and no JSON match.
21. JSON translator failure.
22. Text input translation.
23. Voice input translation.
24. Voice transcription failure.
25. Helpful feedback submission.
26. Negative feedback without correction.
27. Negative feedback with Romanised correction.
28. Negative feedback with Devanagari correction.
29. Feedback write failure.
30. Duplicate feedback submission.
31. Slow corpus loading.
32. User starts another translation while feedback is open.
33. User submits the same sentence twice.
34. App refresh during an active translation.
35. Mobile layout for result and feedback controls.

---

## 18. Definition of Done

Before declaring the task complete, Copilot Agent must provide:

1. A list of all changed files.
2. A short explanation of the new translation flow.
3. The discovered Firestore collection name.
4. The discovered Firestore field mapping.
5. The approval or visibility rule used.
6. The exact-match normalization behavior.
7. The JSON fallback behavior.
8. The feedback collection name and fields.
9. Analytics events added.
10. Tests added and their results.
11. Known limitations.
12. Any Firebase security-rule changes that are required but were not made.
13. A recommendation on when AI sentence generation should be considered.

Do not claim that the application now performs AI translation unless an AI provider has actually been integrated, evaluated, and enabled.

The V1 success criterion is:

> A user can enter an English sentence, receive an exact trusted Thanjavur Marathi sentence from the existing Firebase corpus when available, receive a clearly labeled local JSON fallback otherwise, and submit useful feedback after either result.