# filename: contribution-interface-instructions.md

# Contribution Interface Instructions

## Objective
Build a simple user interface for collecting Marathi word and sentence contributions for dataset training. The UI must support both text and optional voice input.

## Core User Goal
The user should be able to:
- choose between contributing **words**, **sentences**, or a **mixed** set of both
- review English prompts one at a time or in small batches
- enter:
  - Marathi romanized text
  - Marathi Devanagari text
  - optional voice input
- self-rate confidence for each contribution
- consent to dataset usage before submitting

## Key Product Decisions

### 1) Contribution Mode
Provide a mode selector with these options:
- Words
- Sentences
- Mixed
- Recommended for me

Recommended for me should be the default option.

### 2) Consent Requirement
Before any submission, show a required checkbox:

- [ ] I consent to my text and voice inputs being used for dataset training and quality improvement.

This checkbox must be required before enabling submission.

### 3) Prompt-Based Workflow
Do not use a free-form translation-only input box.

Instead:
- show a fixed English word or sentence prompt
- ask the user to provide the Marathi equivalent
- collect both:
  - romanized Marathi
  - Devanagari Marathi
- allow optional voice recording

This keeps the dataset cleaner and reduces duplication.

### 4) Voice Input Strategy
Use the English prompt as the source anchor.

Example:
- English prompt: `fruit`
- Romanized Marathi: `pandu`
- Devanagari Marathi: `पंडू`
- optional voice: Marathi pronunciation of `pandu`

Do not crowdsource the English version for the same item if the English prompt already exists.

### 5) Confidence Options
Provide a confidence selector for each submission:
- Very confident
- Confident
- Partially sure
- Not sure

Use confidence to support review and approval workflows.

### 6) Coverage and Redundancy Control
Avoid showing users categories that are already heavily covered.

Use a coverage-based serving strategy:
- show prompts with fewer than 2–3 approved inputs
- prioritize underrepresented categories
- avoid repeatedly showing the same prompt to the same user
- recommend categories where coverage is low

### 7) Optional Category Guidance
Show the user a recommended category or topic when coverage is low.

Example:
- Recommended category: Health
- Reason: low coverage, needs more approved entries

## Required UI Components

### A. Mode Selector
A control to choose:
- Words
- Sentences
- Mixed
- Recommended for me

### B. Consent Checkbox
A required checkbox for data usage consent.

### C. Prompt Card
Each prompt card should display:
- English text
- type: word or sentence
- category
- current coverage indicator
- input fields for:
  - Marathi romanized text
  - Marathi Devanagari text
  - optional voice recording
  - confidence selector

### D. Batch Controls
Include:
- Submit
- Skip
- Flag as unclear
- Next prompt

### E. Coverage Status Panel
Display category coverage information such as:
- Food: 82%
- Family: 65%
- Health: 21%
- Technology: 14%
- Travel: 33%

This helps direct users to undercovered areas.

## Submission Rules

### Required
- English prompt must be present
- Romanized Marathi must be entered
- Devanagari Marathi must be entered
- consent must be checked before submission

### Optional
- voice recording
- notes / clarification
- report issue / flag prompt

### Validation
Reject or warn if:
- input is blank
- input is a duplicate of an existing approved entry
- voice is uploaded without any text
- consent is not checked

## Data Model Recommendation

### Prompt Entity
Store prompt metadata as:
- prompt_id
- prompt_type: word | sentence
- english
- category
- target_contributions
- approved_contribution_count

### User Submission Entity
Store submission metadata as:
- submission_id
- prompt_id
- romanized_input
- devanagari_input
- audio_file_url or audio_file_id
- confidence
- consent_given
- submitted_at
- user_id or anonymous_id
- status: pending | approved | rejected | needs_review

## Coverage Logic Recommendation

Show prompts in this order:
1. prompts with approved_contribution_count < 3
2. categories with the lowest overall coverage
3. prompts not recently shown to the same user
4. a balanced mix of easy and practical prompts

## Review Workflow
Use confidence and agreement across users to support review:
- Very confident + matching entries from other users = fast approval
- Confident = standard review
- Partially sure / Not sure = manual review
- disagreements across multiple users = escalate for expert review

## Suggested User Flow
1. User opens contribution page
2. Selects Words, Sentences, Mixed, or Recommended
3. Accepts consent checkbox
4. Receives 5–10 prompts in a batch
5. Enters Marathi romanized and Devanagari text
6. Optionally records voice
7. Selects confidence
8. Submits batch
9. Sees progress and contribution summary

## Important UX Guardrails
- Keep voice optional
- Make text required
- Offer skip if unsure
- Prevent duplicate entries from the same user
- Keep English prompts fixed and consistent
- Avoid showing only one category repeatedly
- Show undercovered categories more often

## Initial Screens to Build
1. Contribution mode picker
2. Prompt batch form
3. Coverage dashboard for admins

## Recommended Build Approach
Use prompt cards rather than open-ended text fields.

This will give:
- cleaner data
- easier moderation
- better category balance
- less duplication
- better support for text + voice alignment

## Suggested Admin Features
Add an internal dashboard with:
- category coverage
- prompt coverage
- pending approvals
- duplicate detection
- low-confidence review queue
- audio review queue

## Final Product Intent
The UI should make contribution easy for users while producing clean, balanced, reviewable training data.
