# Technical notes for the API-backed tabs
This document focuses only on the tabs that actually use networked or browser APIs in the current implementation: Contribute, Leaderboard, and Translate.

## 1. API inventory used by these tabs
### 1.1 Firebase services
The app initializes Firebase in src/firebase.ts and exposes:
- Firebase App
- Firebase Authentication
- Firebase Firestore

Relevant initialization:
- `initializeApp(firebaseConfig)`
- `getAuth(app)`
- `getFirestore(app)`

Environment variables required:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### 1.2 Firestore collections used by these tabs
- `contributions` — the main corpus of user-submitted translations and metadata
- `users` — created/updated from Firebase Auth state for role and profile metadata

### 1.3 Browser APIs used by the UI
- Web Speech API via `SpeechRecognition` / `webkitSpeechRecognition`
- MediaRecorder API for voice capture in Contribute
- `FileReader` for converting recorded audio Blob to a base64-style data URL
- `performance.now()` for measuring translation latency in the translator flow

## 2. Contribute tab: implementation details

### 2.1 Purpose of the tab
It is a submission pipeline for building the crowdsourced translation corpus that later powers the Translate tab’s verified-community match path.

### 2.2 Local prompt sourcing
The tab does not fetch prompts from Firebase. Instead it builds its prompt queue from two local JSON files:
- `src/data/sentences.json`
- `src/data/words.json`

The prompt list is created in `src/pages/ContributorPage.tsx` by:
- reading `ENGLISH_SENTENCE_PROMPTS`
- reading `ENGLISH_WORD_PROMPTS`
- converting each into a local `Prompt` structure with:
  - `id`
  - `english`
  - `type` (`word` or `sentence`)
  - `category`

The prompt array is shuffled at startup and then presented to the user one-by-one.

### 2.3 Firestore-driven prompt availability
The tab uses a real-time Firestore listener to count how many submissions already exist for each prompt:
- `onSnapshot(collection(db, 'contributions'), ...)`

For each Firestore document, it reads `promptId` and increments a local map:
- `promptSubmissionCounts[promptId] = count`

That count is used to hide prompt IDs that have already reached the hard cap:
- `MAX_SUBMISSIONS_PER_PROMPT = 3`

This is implemented as:
- `availablePrompts = ALL_PROMPTS.filter(prompt => (promptSubmissionCounts[prompt.id] ?? 0) < 3)`

### 2.4 Submission form state and validation
The submit flow validates:
- user is authenticated
- consent checkbox is accepted
- romanized Marathi input is not empty
- audio size is below a safety cap

The audio size limit is enforced to keep Firestore documents below the practical size threshold for storing audio as a data URL:
- `MAX_AUDIO_BLOB_BYTES = 700 * 1024` bytes

### 2.5 How audio is captured in Contribute
The audio capture is implemented by a local `AudioRecorder` subcomponent inside `src/pages/ContributorPage.tsx`.

Flow:
1. The component asks for microphone access using:
   - `navigator.mediaDevices.getUserMedia({ audio: true })`
2. If access is granted, it creates a `MediaRecorder` instance.
3. The recorder collects chunks in a `Blob[]` buffer via `recorder.ondataavailable`.
4. On stop, it assembles the recorded audio into one `Blob` with MIME type `audio/webm`.
5. The browser creates an object URL for playback and also stores the `Blob` in local component state.

The recording lifecycle is:
- Start recording: `MediaRecorder.start()`
- Stop recording: `mediaRecorderRef.current?.stop()`
- Clear recording: revoke the object URL and reset the state

### 2.6 How audio is converted before Firestore write
The recorded `Blob` is not stored directly as a raw binary file. It is converted into a data URL before it is written to Firestore.

The conversion uses:
- `FileReader`
- `reader.readAsDataURL(blob)`

The helper is:
- `blobToDataUrl(blob: Blob): Promise<string>`

This is important because the current implementation stores audio inside the Firestore document as a field named `audioUrl`, not as a storage object reference.

### 2.7 How entries are mapped into Firestore
Each submitted contribution becomes one Firestore document in the `contributions` collection.

The document fields are:
- `uid` — Firebase Auth UID of the contributor
- `contributorEmail` — email from auth context
- `contributorName` — display name from auth context
- `promptId` — the local prompt ID that was shown
- `promptEnglish` — the source English prompt text
- `promptType` — `word` or `sentence`
- `category` — category from the prompt JSON
- `translation` — a single string that stores both romanized and Devanagari output in the form:
  - `romanized text | devanagari text`
- `confidence` — one of `confident`, `partially-sure`, `not-sure`
- `audioUrl` — converted audio data URL or `null`
- `status` — initial value `pending`
- `reviewerUid` — initially `null`
- `reviewerComment` — initially `null`
- `reviewedAt` — initially `null`
- `submittedAt` — Firestore server timestamp

The document is written with:
- `addDoc(collection(db, 'contributions'), {...})`

### 2.8 Prompt-cap handling before save
Before adding the document, the code checks the existing submissions for that specific prompt using a Firestore query:
- `query(collection(db, 'contributions'), where('promptId', '==', current.id))`
- `getDocs(...)`

If the count equals or exceeds the cap, the submit is blocked and the UI advances to another prompt.

### 2.9 Why this tab is the source of truth for translation lookup
The Translate tab later reads from this same `contributions` collection. The Contribute tab is therefore the ingestion layer for the app’s verified-community translation corpus.

## 3. Leaderboard tab: implementation details

### 3.1 Data source
The Leaderboard tab reads all contribution documents from Firestore in real time:
- `onSnapshot(collection(db, 'contributions'), ...)`

It does not use a separate aggregation collection. The leaderboard is computed client-side from the contribution docs.

### 3.2 How the leaderboard is aggregated
For every contribution document, the tab builds an in-memory map keyed by `uid`:
- `counts[uid] = { name, count }`

The logic is:
1. Read `data.uid`
2. Read `data.contributorName`
3. If the contributor name is blank, it falls back to `Anonymous`
4. Increment the contributor’s count by 1
5. Keep the latest non-anonymous name if the contributor updates their profile name later

So the leaderboard is basically:
- one row per contributor UID
- count = number of contribution documents belonging to that UID

### 3.3 Sorting and ranking
After aggregation, the code:
- converts the map to an array of `{ uid, name, count }`
- sorts descending by `count`
- stores the sorted array in component state

This makes ranking deterministic and easy to render.

### 3.4 How the UI is built from the Firestore data
The component renders:
- top 3 contributors as a podium card
- the rest as a ranked list below the podium
- a “Your rank” callout using the current user UID

The current user’s position is computed as:
- `entries.findIndex(e => e.uid === user?.uid) + 1`

### 3.5 Error handling and rules implications
If Firestore denies the listener due to missing security rules, the component surfaces an error and tells the user that the leaderboard is unavailable until rules are configured.

This is handled through the Firestore error callback:
- `permission-denied` triggers a specific UI message

## 4. Translate tab: implementation details

### 4.1 What the tab does
The Translate tab has two different search paths:
1. A local dictionary/grammar-based translator for the app’s built-in lexical data
2. A crowdsourced verified-community lookup that reads from Firestore contribution documents

The UI is implemented in `src/components/TranslatorBox.tsx`.

### 4.2 Input flow
When the user presses Enter or clicks Translate, the tab:
1. reads the input string from the text field
2. trims it
3. stores the trimmed value into local state as `query`
4. calls the translation orchestrator

The main handler is:
- `handleSearch()`

### 4.3 Local dictionary search path
The app’s built-in dictionary comes from:
- `src/data/dictionary.json`
- `src/data/app_dictionary.json`

These are merged in `src/App.tsx` into one `combinedEntries` array and passed to the Translate UI as `entries`.

The local search logic is implemented in `src/hooks/useTranslate.ts` and `src/utils/search.ts`.

### 4.4 How single-word search works
For a single token input:
- the query is normalized with `normalise()`
- the code checks for obvious stop cases like `the`, `am`, `a`
- it calls `searchToken(normalized, entries)`

`searchToken()` performs multiple ranking strategies in order:
- exact string match
- variant match
- plural/singular normalization
- partial prefix containment
- Levenshtein fuzzy match

Every candidate is given a score and then sorted descending.

### 4.5 How phrase search works
For multi-word input, the hook does not simply run a dictionary lookup. It first uses the grammar engine in `src/utils/sentenceRules.ts`.

The grammar engine performs structural transformations such as:
- copula movement
- SVO → SOV reordering
- preposition → postposition conversion
- fixed phrase templates
- possession / want / need constructions
- question handling
- imperative handling
- existence sentence handling

The result is a `RuleResult` object with:
- `tokens` in TM-order
- `suffix`
- `sentenceType`
- optionally a `fixedPhrase`

The phrase search logic then:
- uses the reordered tokens for sequential lookup
- tries n-gram matching over the token list
- falls back to token-by-token dictionary matching
- appends grammar particles such as `aahe`, `ka`, `nahi`, `nako`

This is why phrase translation is more than a simple dictionary lookup.

### 4.6 How the verified-community translation path works
The Translate tab also has a Firestore-backed path called the translation orchestrator.

It is implemented in `src/hooks/useTranslationOrchestrator.ts`.

Flow:
1. On first use, it calls:
   - `getDocs(collection(db, 'contributions'))`
2. Each Firestore document is converted by `adaptCrowdsourcedRecord(...)`
3. The adapted record is filtered by `selectLookupCandidateRecords(...)`
4. The resulting records are cached in `recordsRef.current`
5. The exact-match lookup is then done with `findExactCrowdsourcedMatch(...)`

### 4.7 How Firestore contribution documents are mapped for translation lookup
The translation-adaptation layer is defined in `src/utils/crowdsourcedLookup.ts`.

It reads a Firestore document and maps it into a normalized structure with:
- `englishText`
- `englishNormalized`
- `romanisedText`
- `devanagariText`
- `audioUrl`
- `status`
- `warnings`
- `contributorId`

The mapping logic looks for different field names because the contributor data is not stored under a single fixed schema. It resolves values from a list of possible property names, including:
- `promptEnglish`, `prompt_english`, `englishText`, `english`, `text`, `prompt` for the English source
- `translation`, `translationText`, `translatedText` for the combined translation string
- `romanisedText`, `romanizedText`, `tm_romanized`, `tmRomanized`, `tmRomanised`, `romanized`, `romanised` for romanized text
- `devanagariText`, `tm_devanagari`, `tmDevanagari`, `devanagari`, `marathiText`, `marathiDevanagari` for Devanagari text

The translation string is parsed using the `|` separator:
- `romanized text | devanagari text`

If the document has only one field, the code will still preserve it as best as possible.

### 4.8 How exact-match lookup works
The exact lookup uses:
- `normalizeEnglishText(input)`
- `buildCrowdsourcedLookupIndex(records)`
- `findExactCrowdsourcedMatch(input, records)`

The process is:
1. Normalize the input English text to lower-case, trimmed, punctuation-cleaned form
2. Group records by normalized English text
3. Rank the bucket by record quality
4. Return the top candidate

The ranking adds points for:
- approved status
- pending status
- presence of both romanized and Devanagari output
- presence of romanized text
- presence of Devanagari text
- penalties for pending-review warnings

If a record matches exactly, the orchestrator builds an outcome object with:
- `romanisedText`
- `devanagariText`
- `matchType = 'verified-community'`
- `verified = true/false` depending on approval status
- `latencyMs`
- `dataQualityWarnings`

### 4.9 How the results are displayed
If the Firestore-backed exact match succeeds, the UI shows a “Verified community translation” card with:
- the Devanagari output
- the romanized output

If not, the UI falls back to the local dictionary/grammar-based result renderer.

### 4.10 Voice input in Translate
Voice input is implemented with the browser Web Speech API.

The hook is `src/hooks/useSpeechInput.ts` and it wraps the browser recognition object with a small interface layer.

The flow is:
1. The component mounts a `SpeechRecognition` instance
2. The recognition session is configured with:
   - `continuous = false`
   - `interimResults = true`
   - `lang = 'en-US'`
   - `maxAlternatives = 1`
3. When the user speaks, the browser emits `onresult`
4. The hook gathers the final transcript and passes it to the parent callback via `onResult(final.trim())`
5. The parent `TranslatorBox` updates the input field and the translation query state

The UI button is rendered via `src/components/VoiceInputButton.tsx`. It toggles between:
- start listening
- stop listening

The button is disabled if the current browser does not support `SpeechRecognition`.

## 5. Developer summary
In short:
- Contribute is the ingestion layer and writes to Firestore `contributions`
- Leaderboard is a client-side aggregation view over those contribution documents
- Translate has two retrieval layers:
  - local dictionary/grammar search for built-in translations
  - Firestore-backed verified-community lookup for user-submitted entries

The most important technical fact is that the app’s “community translation” behavior is not implemented as a separate backend service. It is implemented as a Firestore document model that is read by the Translate tab and aggregated by the Leaderboard tab directly from the browser.
